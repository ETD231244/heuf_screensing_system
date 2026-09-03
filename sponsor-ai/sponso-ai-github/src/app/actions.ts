"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  getSession,
  hashPassword,
  homeForRole,
  normalizeRole,
  requireCoordinator,
  requireStudent,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import {
  ACADEMIC_YEAR,
  MAX_FILE_BYTES,
  MAX_PHOTO_BYTES,
  requiredDocuments,
} from "@/lib/constants";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { screenApplication } from "@/lib/screen-application";
import { deleteStoredFile, saveDocumentFile } from "@/lib/documents";
import { safeErrorMessage, validateProfilePhoto, validateUploadedFile } from "@/lib/security";
import { llgsForDistrict } from "@/lib/geo";

const registerSchema = z.object({
  givenName: z.string().trim().min(2, "Enter your given name, for example John."),
  surname: z.string().trim().min(2, "Enter your surname, for example Doe."),
  email: z.string().trim().email("Enter a valid email address, for example john.doe@example.com."),
  phone: z.string().trim().min(7, "Enter a PNG mobile number, for example +675 7XX XXX XX."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
});

function upper(value: string) {
  return value.trim().toUpperCase();
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function registerStudent(formData: FormData) {
  const parsed = registerSchema.safeParse({
    givenName: formData.get("givenName"),
    surname: formData.get("surname"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the highlighted fields and try again." };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "The passwords do not match. Please enter the same password in both fields." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account already exists with this email address. Please sign in instead." };
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      authProvider: "PASSWORD",
      role: "STUDENT",
      lastLoginAt: new Date(),
      applicant: {
        create: {
          givenName: upper(parsed.data.givenName),
          surname: upper(parsed.data.surname),
          gender: "U",
          phone: parsed.data.phone.trim(),
        },
      },
    },
    include: { applicant: true },
  });

  await createSession({
    id: user.id,
    email: user.email,
    role: "STUDENT",
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "REGISTER",
    entityType: "User",
    entityId: user.id,
    details: "Applicant account created",
  });
  await notifyUser({
    userId: user.id,
    title: "Welcome to HUEF",
    message: "Your HUEF account has been created successfully. You can now complete your profile and start an application.",
    type: "SUCCESS",
  });
  redirect("/student/profile?welcome=1");
}

export async function loginUser(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email address and password to sign in." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { applicant: true },
  });
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Incorrect email or password. Please check your details and try again." };
  }

  const role = normalizeRole(user.role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({
    id: user.id,
    email: user.email,
    role,
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });
  redirect(homeForRole(role));
}

export async function logoutUser() {
  await clearSession();
  redirect("/");
}

async function studentApplicant() {
  const session = await requireStudent();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { applicant: true },
  });
  if (!user?.applicant) {
    throw new Error("Applicant profile missing");
  }
  return { session, user, applicant: user.applicant };
}

async function resolveDistrictAndLlg(districtName: string, llgName: string) {
  const district = districtName
    ? await prisma.district.findUnique({ where: { name: districtName } })
    : null;
  const allowed = llgsForDistrict(districtName);
  const normalisedLlg = llgName.trim();
  const llg =
    district && normalisedLlg
      ? await prisma.llg.findFirst({
          where: {
            districtId: district.id,
            name: allowed.includes(normalisedLlg as never) ? normalisedLlg : normalisedLlg,
          },
        })
      : null;
  return { district, llg, llgName: normalisedLlg || null };
}

export async function saveProfile(formData: FormData) {
  const { applicant, session, user } = await studentApplicant();
  const districtName = field(formData, "districtName").trim();
  const llgName = field(formData, "llgName").trim();
  const { district, llg } = await resolveDistrictAndLlg(districtName, llgName);

  const givenName = upper(field(formData, "givenName") || applicant.givenName);
  const surname = upper(field(formData, "surname") || applicant.surname);
  const phone = field(formData, "phone").trim() || applicant.phone;
  if (!phone) {
    return { error: "Enter a contact number, for example +675 7XX XXX XX." };
  }

  await prisma.applicant.update({
    where: { id: applicant.id },
    data: {
      givenName,
      surname,
      gender: field(formData, "gender") || applicant.gender,
      dateOfBirth: field(formData, "dateOfBirth") || null,
      age: Number(formData.get("age") || 0) || null,
      phone,
      studentId: field(formData, "studentId").trim() || null,
      clanName: upper(field(formData, "clanName")),
      wardVillage: upper(field(formData, "wardVillage")),
      llgName: llg?.name ?? (llgName ? upper(llgName) : null),
      llgId: llg?.id ?? null,
      districtId: district?.id ?? null,
      province: field(formData, "province") || "Hela",
    },
  });

  await createSession({
    ...session,
    givenName,
    surname,
  });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "PROFILE_UPDATE",
    entityType: "Applicant",
    entityId: applicant.id,
    details: "Applicant updated profile details",
  });
  return { ok: true as const, message: "Your HUEF profile has been updated successfully." };
}

export async function uploadProfilePhoto(formData: FormData) {
  const { applicant, user } = await studentApplicant();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photograph to upload." };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const checked = validateProfilePhoto({
    originalName: file.name,
    declaredMime: file.type,
    bytes,
    maxBytes: MAX_PHOTO_BYTES,
  });
  if (!checked.ok) return { error: checked.error };

  await prisma.applicant.update({
    where: { id: applicant.id },
    data: {
      photoMime: checked.mimeType,
      photoBytes: Uint8Array.from(bytes),
    },
  });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "PROFILE_PHOTO",
    entityType: "Applicant",
    entityId: applicant.id,
    details: "Applicant uploaded a profile photograph",
  });
  return { ok: true as const, message: "Your profile photograph was uploaded successfully." };
}

export async function saveDraft(formData: FormData) {
  const { applicant } = await studentApplicant();
  const existing = await prisma.application.findFirst({
    where: { applicantId: applicant.id, academicYear: ACADEMIC_YEAR },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.status !== "DRAFT" && existing.status !== "MORE_INFO") {
    return { error: "Your 2026 application has already been submitted and can only be changed if a coordinator asks for more information." };
  }

  const districtName = field(formData, "districtName").trim();
  const llgName = field(formData, "llgName").trim();
  const { district, llg } = await resolveDistrictAndLlg(districtName, llgName);
  const institutionId = field(formData, "institutionId").trim();
  const institution = institutionId
    ? await prisma.institution.findUnique({ where: { id: institutionId } })
    : await prisma.institution.findFirst();
  if (!institution) {
    return { error: "Select the institution you will attend in 2026." };
  }

  const applicantData = {
    givenName: upper(field(formData, "givenName") || applicant.givenName),
    surname: upper(field(formData, "surname") || applicant.surname),
    gender: field(formData, "gender") || applicant.gender,
    dateOfBirth: field(formData, "dateOfBirth") || null,
    age: Number(formData.get("age") || 0) || null,
    phone: field(formData, "phone") || applicant.phone,
    studentId: field(formData, "studentId").trim() || applicant.studentId,
    clanName: upper(field(formData, "clanName")),
    wardVillage: upper(field(formData, "wardVillage")),
    llgName: llg?.name ?? (llgName ? upper(llgName) : null),
    llgId: llg?.id ?? null,
    districtId: district?.id ?? null,
    province: field(formData, "province") || "Hela",
    fatherFullName: upper(field(formData, "fatherFullName")),
    fatherOccupation: upper(field(formData, "fatherOccupation")),
    fatherClan: upper(field(formData, "fatherClan")),
    fatherWard: upper(field(formData, "fatherWard")),
    fatherDistrict: upper(field(formData, "fatherDistrict")),
    fatherProvince: field(formData, "fatherProvince"),
    fatherPhone: field(formData, "fatherPhone"),
    motherFullName: upper(field(formData, "motherFullName")),
    motherOccupation: upper(field(formData, "motherOccupation")),
    motherClan: upper(field(formData, "motherClan")),
    motherWard: upper(field(formData, "motherWard")),
    motherDistrict: upper(field(formData, "motherDistrict")),
    motherProvince: field(formData, "motherProvince"),
    motherPhone: field(formData, "motherPhone"),
    eligibilityPath: field(formData, "eligibilityPath") || "HELA_ORIGIN",
    publicServantWho: field(formData, "publicServantWho") || null,
    publicServantDepartment: field(formData, "publicServantDepartment") || null,
    publicServantOccupation: field(formData, "publicServantOccupation") || null,
    publicServantYears: Number(formData.get("publicServantYears") || 0) || null,
    publicServantSupervisor: field(formData, "publicServantSupervisor") || null,
    publicServantSupervisorPhone: field(formData, "publicServantSupervisorPhone") || null,
  };

  await prisma.applicant.update({
    where: { id: applicant.id },
    data: applicantData,
  });

  const applicationData = {
    institutionId: institution.id,
    districtId: district?.id ?? null,
    programName: field(formData, "programName").trim() || "To be confirmed",
    studyType: field(formData, "studyType") || null,
    studyLevel: field(formData, "studyLevel") || "UNDERGRADUATE",
    yearOfStudy: field(formData, "yearOfStudy").trim() || "Not stated",
    expectedCompletion: field(formData, "expectedCompletion") || null,
    institutionProvince: field(formData, "institutionProvince") || null,
    registrarPhone: field(formData, "registrarPhone") || null,
    registrarEmail: field(formData, "registrarEmail") || null,
    applicantType: field(formData, "applicantType") || "NEW_INTAKE",
    lastSecondarySchool: field(formData, "lastSecondarySchool") || null,
    yearCompleted: field(formData, "yearCompleted") || null,
    feeCategory: field(formData, "feeCategory") || "HUEF_TFA",
    otherFeeType: field(formData, "otherFeeType") || null,
    tuitionFees: field(formData, "tuitionFees") || null,
    accountName: field(formData, "accountName") || null,
    accountNumber: field(formData, "accountNumber") || null,
    bankName: field(formData, "bankName") || null,
    bankBranch: field(formData, "bankBranch") || null,
    witnessName: field(formData, "witnessName") || null,
    witnessTitle: field(formData, "witnessTitle") || null,
    witnessVillage: field(formData, "witnessVillage") || null,
    witnessDistrict: field(formData, "witnessDistrict") || null,
    witnessPhone: field(formData, "witnessPhone") || null,
  };

  const saved = existing
    ? await prisma.application.update({ where: { id: existing.id }, data: applicationData })
    : await prisma.application.create({
        data: {
          applicantId: applicant.id,
          academicYear: ACADEMIC_YEAR,
          status: "DRAFT",
          ...applicationData,
        },
      });

  return { ok: true as const, applicationId: saved.id, message: "Your application draft has been saved." };
}

export async function submitApplication(formData: FormData) {
  const draft = await saveDraft(formData);
  if ("error" in draft) return draft;
  const { applicant, session, user } = await studentApplicant();

  const application = await prisma.application.findUnique({
    where: { id: draft.applicationId },
    include: { documents: true, applicant: true },
  });
  if (!application || application.applicantId !== applicant.id) {
    return { error: "We could not find that application. Please sign in again and retry." };
  }
  if (application.status !== "DRAFT" && application.status !== "MORE_INFO") {
    return { error: "This application is already submitted." };
  }

  const missingFields: string[] = [];
  if (!application.applicant.givenName) missingFields.push("given name");
  if (!application.applicant.surname) missingFields.push("surname");
  if (!application.applicant.phone) missingFields.push("contact number");
  if (!application.applicant.districtId && application.applicant.eligibilityPath === "HELA_ORIGIN") {
    missingFields.push("Hela district");
  }
  if (!application.applicant.llgName && application.applicant.eligibilityPath === "HELA_ORIGIN") {
    missingFields.push("LLG");
  }
  if (!application.programName || application.programName === "To be confirmed") {
    missingFields.push("programme of study");
  }
  if (!application.yearOfStudy || application.yearOfStudy === "Not stated") {
    missingFields.push("year of study");
  }
  if (!application.witnessName) missingFields.push("community witness");
  if (formData.get("declaration") !== "yes") {
    missingFields.push("declaration");
  }
  if (missingFields.length) {
    return {
      error: `Your application is incomplete. Please complete the highlighted sections before submitting: ${missingFields.join(", ")}.`,
    };
  }

  const required = requiredDocuments(
    application.applicantType,
    application.applicant.eligibilityPath,
  );
  const have = new Set(application.documents.map((doc) => doc.type));
  const missingDocs = required.filter((type) => !have.has(type));
  if (missingDocs.length) {
    return {
      error: "Your application is incomplete. Attach every required document before submitting. Missing files are listed on the Documents step.",
    };
  }

  await prisma.application.update({
    where: { id: application.id },
    data: {
      status: "PENDING",
      submittedAt: application.submittedAt ?? new Date(),
      declaredAt: new Date(),
      infoRequestedAt: null,
    },
  });
  const screening = await screenApplication(application.id, user.email);
  await createSession({
    ...session,
    givenName: application.applicant.givenName,
    surname: application.applicant.surname,
  });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "APPLICATION_SUBMIT",
    entityType: "Application",
    entityId: application.id,
    applicationId: application.id,
    details: `Submitted 2026 application. Preliminary screening: ${screening.overallStatus}`,
  });
  await notifyUser({
    userId: user.id,
    applicationId: application.id,
    title: "Application submitted",
    message:
      "Your HUEF application has been submitted successfully. You do not need to email the office as well. Check your dashboard for screening notes and the Coordinator’s decision.",
    type: "SUCCESS",
    category: "APPLICATION",
  });
  if (screening.overallStatus !== "PASSED_INITIAL") {
    await notifyUser({
      userId: user.id,
      applicationId: application.id,
      title: "Screening needs your attention",
      message: `The preliminary screening result is “${screening.overallStatus.replaceAll("_", " ")}”. ${screening.summary} You may be asked to replace a document.`,
      type: "WARNING",
      category: "SCREENING",
    });
  }
  redirect("/student?submitted=1");
}

export async function uploadDocument(formData: FormData) {
  const { applicant, user } = await studentApplicant();
  const type = String(formData.get("type") ?? "");
  const file = formData.get("file");
  if (!type || !(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Each file must be 5 MB or smaller." };
  }

  let application = await prisma.application.findFirst({
    where: { applicantId: applicant.id, academicYear: ACADEMIC_YEAR },
  });
  if (application && application.status !== "DRAFT" && application.status !== "MORE_INFO") {
    return { error: "A submitted application cannot be changed unless a coordinator has asked for more information." };
  }
  if (!application) {
    const institution = await prisma.institution.findFirst();
    if (!institution) return { error: "The system is not ready. Ask the Coordinator to seed institutions." };
    application = await prisma.application.create({
      data: {
        applicantId: applicant.id,
        institutionId: institution.id,
        programName: "To be confirmed",
        studyLevel: "UNDERGRADUATE",
        yearOfStudy: "Not stated",
        applicantType: "NEW_INTAKE",
        feeCategory: "HUEF_TFA",
        status: "DRAFT",
      },
    });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const checked = validateUploadedFile({
    originalName: file.name,
    declaredMime: file.type,
    bytes,
  });
  if (!checked.ok) return { error: checked.error };

  await saveDocumentFile({
    applicationId: application.id,
    type,
    originalName: file.name,
    mimeType: checked.mimeType,
    bytes,
  });

  const screening = await screenApplication(application.id, user.email);
  const finding = screening.documents.find((item) => item.type === type);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "DOCUMENT_UPLOAD",
    entityType: "Document",
    entityId: application.id,
    applicationId: application.id,
    details: `Uploaded ${type} (${file.name}). Screening: ${finding?.status ?? "pending"}`,
  });

  if (finding && finding.status !== "PASSED_INITIAL") {
    await notifyUser({
      userId: user.id,
      applicationId: application.id,
      title: "Document needs attention",
      message: finding.reason,
      type: "WARNING",
      category: "DOCUMENT",
    });
    return {
      ok: true as const,
      applicationId: application.id,
      warning: finding.reason,
      status: finding.status,
    };
  }

  return {
    ok: true as const,
    applicationId: application.id,
    message: "Your document was uploaded successfully and is awaiting screening.",
    status: finding?.status ?? "PASSED_INITIAL",
  };
}

export async function removeDocument(documentId: string) {
  const { applicant, user } = await studentApplicant();
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { application: true },
  });
  if (!doc || doc.application.applicantId !== applicant.id) {
    return { error: "We could not find that document." };
  }
  if (doc.application.status !== "DRAFT" && doc.application.status !== "MORE_INFO") {
    return { error: "A submitted application cannot be changed unless a coordinator has asked for more information." };
  }
  await deleteStoredFile(doc.storedPath);
  await prisma.document.delete({ where: { id: documentId } });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "DOCUMENT_REMOVE",
    entityType: "Document",
    entityId: doc.id,
    applicationId: doc.applicationId,
    details: `Removed ${doc.type}`,
  });
  return { ok: true as const, message: "The document was removed. Please upload a replacement if it is still required." };
}

export async function markNotificationRead(id: string) {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId: session.id },
    data: { readAt: new Date() },
  });
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: session.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true as const };
}

export async function decideApplication(formData: FormData) {
  const session = await requireCoordinator();
  const id = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "");
  const statusNote = String(formData.get("statusNote") ?? "").trim() || null;
  if (!["PENDING", "APPROVED", "REJECTED", "MORE_INFO"].includes(status)) {
    return { error: "Choose a valid status." };
  }
  const application = await prisma.application.findUnique({
    where: { id },
    include: { applicant: { include: { user: true } } },
  });
  if (!application || application.status === "DRAFT") {
    return { error: "This application is not ready for a decision." };
  }
  await prisma.application.update({
    where: { id },
    data: {
      status,
      statusNote,
      decidedAt: status === "PENDING" || status === "MORE_INFO" ? null : new Date(),
      decidedByEmail: status === "PENDING" || status === "MORE_INFO" ? null : session.email,
      infoRequestedAt: status === "MORE_INFO" ? new Date() : null,
      infoRequestNote: status === "MORE_INFO" ? statusNote : null,
    },
  });
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "STATUS_CHANGE",
    entityType: "Application",
    entityId: id,
    applicationId: id,
    details: `Status set to ${status}${statusNote ? `: ${statusNote}` : ""}`,
  });

  const studentUserId = application.applicant.userId;
  if (status === "APPROVED") {
    await notifyUser({
      userId: studentUserId,
      senderId: session.id,
      applicationId: id,
      title: "Application approved",
      message:
        statusNote ||
        "Your HUEF application has been approved. Keep your student ID and fee invoice; the Foundation will process TFA against the institution account.",
      type: "SUCCESS",
      category: "DECISION",
    });
  } else if (status === "REJECTED") {
    await notifyUser({
      userId: studentUserId,
      senderId: session.id,
      applicationId: id,
      title: "Application not successful",
      message:
        statusNote ||
        "Your HUEF application was not successful. Sign in to read the Coordinator’s note, or contact the HUEF office in Tari.",
      type: "ERROR",
      category: "DECISION",
    });
  } else if (status === "MORE_INFO") {
    await notifyUser({
      userId: studentUserId,
      senderId: session.id,
      applicationId: id,
      title: "Additional information requested",
      message:
        statusNote ||
        "A HUEF coordinator has asked you to provide additional information or replace a document. Please sign in and update your application.",
      type: "WARNING",
      category: "REQUEST",
    });
  }
  return { ok: true as const, message: "The application status has been updated and the applicant has been notified." };
}

export async function overrideScreening(formData: FormData) {
  const session = await requireCoordinator();
  const applicationId = String(formData.get("applicationId") ?? "");
  const override = String(formData.get("override") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["PASSED_INITIAL", "NEEDS_REVIEW", "INFORMATION_MISMATCH", "INCORRECT_DOCUMENT"].includes(override)) {
    return { error: "Choose a valid override outcome." };
  }
  if (reason.length < 8) {
    return { error: "Record a short reason for overriding the AI recommendation. AI does not make the final decision, but the reason must be kept." };
  }
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) return { error: "Application not found." };

  await prisma.application.update({
    where: { id: applicationId },
    data: { screeningStatus: override },
  });
  await prisma.screeningHistory.create({
    data: {
      applicationId,
      resultJson: application.screeningJson ?? "{}",
      overallStatus: override,
      runBy: session.email,
      coordinatorOverride: override,
      overrideReason: reason,
    },
  });
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "SCREENING_OVERRIDE",
    entityType: "Application",
    entityId: applicationId,
    applicationId,
    details: `Override to ${override}: ${reason}`,
  });
  return { ok: true as const, message: "Your override has been recorded. The AI finding is kept in the screening history." };
}

export async function rerunScreening(applicationId: string) {
  const session = await requireCoordinator();
  await screenApplication(applicationId, session.email);
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "SCREENING_RERUN",
    entityType: "Application",
    entityId: applicationId,
    applicationId,
    details: "Coordinator re-ran AI screening",
  });
  return { ok: true as const, message: "Screening was run again. Review the updated flags before you decide." };
}

export async function sendApplicantNotice(formData: FormData) {
  const session = await requireCoordinator();
  const title = field(formData, "title").trim();
  const message = field(formData, "message").trim();
  const audience = field(formData, "audience") || "ONE";
  const userId = field(formData, "userId").trim();
  const applicationId = field(formData, "applicationId").trim() || null;
  if (title.length < 3 || message.length < 8) {
    return { error: "Enter a clear title and message for the notice." };
  }

  let targets: string[] = [];
  if (audience === "ONE" && userId) {
    targets = [userId];
  } else if (audience === "PENDING") {
    const rows = await prisma.application.findMany({
      where: { academicYear: ACADEMIC_YEAR, status: "PENDING" },
      select: { applicant: { select: { userId: true } } },
    });
    targets = [...new Set(rows.map((row) => row.applicant.userId))];
  } else if (audience === "ALL_APPLICANTS") {
    const rows = await prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, select: { id: true } });
    targets = rows.map((row) => row.id);
  } else if (audience === "DISTRICT") {
    const districtName = field(formData, "districtName");
    const rows = await prisma.applicant.findMany({
      where: { district: { name: districtName } },
      select: { userId: true },
    });
    targets = rows.map((row) => row.userId);
  }

  if (!targets.length) {
    return { error: "No applicants matched that audience." };
  }

  await prisma.notification.createMany({
    data: targets.map((id) => ({
      userId: id,
      senderId: session.id,
      applicationId,
      title,
      message,
      type: "ANNOUNCEMENT",
      category: "ANNOUNCEMENT",
    })),
  });
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "NOTICE_SEND",
    entityType: "Notification",
    details: `Sent “${title}” to ${targets.length} applicant(s)`,
  });
  return { ok: true as const, message: `Notice sent to ${targets.length} applicant${targets.length === 1 ? "" : "s"}.` };
}

export async function currentUser() {
  return getSession();
}

export { safeErrorMessage };
