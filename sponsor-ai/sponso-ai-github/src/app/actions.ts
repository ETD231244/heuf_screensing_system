"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  getSession,
  hashPassword,
  requireCoordinator,
  requireStudent,
  verifyPassword,
} from "@/lib/auth";
import { ACADEMIC_YEAR, ALLOWED_MIME_TYPES, MAX_FILE_BYTES, requiredDocuments } from "@/lib/constants";
import { screenApplication } from "@/lib/screen-application";
import { deleteStoredFile, saveDocumentFile } from "@/lib/documents";

const registerSchema = z.object({
  givenName: z.string().trim().min(2, "Enter your given name"),
  surname: z.string().trim().min(2, "Enter your surname"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a contact number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

function upper(value: string) {
  return value.trim().toUpperCase();
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
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "STUDENT",
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
  redirect("/student/apply");
}

export async function loginUser(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { applicant: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is not correct." };
  }

  await createSession({
    id: user.id,
    email: user.email,
    role: user.role === "COORDINATOR" ? "COORDINATOR" : "STUDENT",
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });
  redirect(user.role === "COORDINATOR" ? "/coordinator" : "/student");
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

export async function saveDraft(formData: FormData) {
  const { applicant } = await studentApplicant();
  const existing = await prisma.application.findFirst({
    where: { applicantId: applicant.id, academicYear: ACADEMIC_YEAR },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.status !== "DRAFT") {
    return { error: "Your 2026 application has already been submitted." };
  }

  const districtName = String(formData.get("districtName") ?? "").trim();
  const district = districtName
    ? await prisma.district.findUnique({ where: { name: districtName } })
    : null;
  const institutionId = String(formData.get("institutionId") ?? "").trim();
  const institution = institutionId
    ? await prisma.institution.findUnique({ where: { id: institutionId } })
    : await prisma.institution.findFirst();
  if (!institution) {
    return { error: "Select the institution you will attend in 2026." };
  }

  const applicantData = {
    givenName: upper(String(formData.get("givenName") ?? applicant.givenName)),
    surname: upper(String(formData.get("surname") ?? applicant.surname)),
    gender: String(formData.get("gender") ?? applicant.gender),
    dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null,
    age: Number(formData.get("age") || 0) || null,
    phone: String(formData.get("phone") ?? applicant.phone),
    clanName: upper(String(formData.get("clanName") ?? "")),
    wardVillage: upper(String(formData.get("wardVillage") ?? "")),
    llgName: upper(String(formData.get("llgName") ?? "")),
    districtId: district?.id ?? null,
    province: String(formData.get("province") ?? "Hela"),
    fatherFullName: upper(String(formData.get("fatherFullName") ?? "")),
    fatherOccupation: upper(String(formData.get("fatherOccupation") ?? "")),
    fatherClan: upper(String(formData.get("fatherClan") ?? "")),
    fatherWard: upper(String(formData.get("fatherWard") ?? "")),
    fatherDistrict: upper(String(formData.get("fatherDistrict") ?? "")),
    fatherProvince: String(formData.get("fatherProvince") ?? ""),
    fatherPhone: String(formData.get("fatherPhone") ?? ""),
    motherFullName: upper(String(formData.get("motherFullName") ?? "")),
    motherOccupation: upper(String(formData.get("motherOccupation") ?? "")),
    motherClan: upper(String(formData.get("motherClan") ?? "")),
    motherWard: upper(String(formData.get("motherWard") ?? "")),
    motherDistrict: upper(String(formData.get("motherDistrict") ?? "")),
    motherProvince: String(formData.get("motherProvince") ?? ""),
    motherPhone: String(formData.get("motherPhone") ?? ""),
    eligibilityPath: String(formData.get("eligibilityPath") ?? "HELA_ORIGIN"),
    publicServantWho: String(formData.get("publicServantWho") ?? "") || null,
    publicServantDepartment: String(formData.get("publicServantDepartment") ?? "") || null,
    publicServantOccupation: String(formData.get("publicServantOccupation") ?? "") || null,
    publicServantYears: Number(formData.get("publicServantYears") || 0) || null,
    publicServantSupervisor: String(formData.get("publicServantSupervisor") ?? "") || null,
    publicServantSupervisorPhone: String(formData.get("publicServantSupervisorPhone") ?? "") || null,
  };

  await prisma.applicant.update({
    where: { id: applicant.id },
    data: applicantData,
  });

  const applicationData = {
    institutionId: institution.id,
    programName: String(formData.get("programName") ?? "").trim() || "To be confirmed",
    studyType: String(formData.get("studyType") ?? "") || null,
    studyLevel: String(formData.get("studyLevel") ?? "UNDERGRADUATE"),
    yearOfStudy: String(formData.get("yearOfStudy") ?? "").trim() || "Not stated",
    expectedCompletion: String(formData.get("expectedCompletion") ?? "") || null,
    institutionProvince: String(formData.get("institutionProvince") ?? "") || null,
    registrarPhone: String(formData.get("registrarPhone") ?? "") || null,
    registrarEmail: String(formData.get("registrarEmail") ?? "") || null,
    applicantType: String(formData.get("applicantType") ?? "NEW_INTAKE"),
    lastSecondarySchool: String(formData.get("lastSecondarySchool") ?? "") || null,
    yearCompleted: String(formData.get("yearCompleted") ?? "") || null,
    feeCategory: String(formData.get("feeCategory") ?? "HUEF_TFA"),
    otherFeeType: String(formData.get("otherFeeType") ?? "") || null,
    tuitionFees: String(formData.get("tuitionFees") ?? "") || null,
    accountName: String(formData.get("accountName") ?? "") || null,
    accountNumber: String(formData.get("accountNumber") ?? "") || null,
    bankName: String(formData.get("bankName") ?? "") || null,
    bankBranch: String(formData.get("bankBranch") ?? "") || null,
    witnessName: String(formData.get("witnessName") ?? "") || null,
    witnessTitle: String(formData.get("witnessTitle") ?? "") || null,
    witnessVillage: String(formData.get("witnessVillage") ?? "") || null,
    witnessDistrict: String(formData.get("witnessDistrict") ?? "") || null,
    witnessPhone: String(formData.get("witnessPhone") ?? "") || null,
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

  return { ok: true as const, applicationId: saved.id };
}

export async function submitApplication(formData: FormData) {
  const draft = await saveDraft(formData);
  if ("error" in draft) return draft;
  const { applicant, session } = await studentApplicant();

  const application = await prisma.application.findUnique({
    where: { id: draft.applicationId },
    include: { documents: true, applicant: true },
  });
  if (!application || application.applicantId !== applicant.id) {
    return { error: "Application not found." };
  }
  if (application.status !== "DRAFT") {
    return { error: "This application is already submitted." };
  }

  const missingFields: string[] = [];
  if (!application.applicant.givenName) missingFields.push("given name");
  if (!application.applicant.surname) missingFields.push("surname");
  if (!application.applicant.phone) missingFields.push("contact number");
  if (!application.applicant.districtId && application.applicant.eligibilityPath === "HELA_ORIGIN") {
    missingFields.push("Hela district");
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
      error: `Complete these fields before submitting: ${missingFields.join(", ")}.`,
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
      error: "Attach every required document before submitting. Missing files are listed on the Documents step.",
    };
  }

  await prisma.application.update({
    where: { id: application.id },
    data: {
      status: "PENDING",
      submittedAt: new Date(),
      declaredAt: new Date(),
    },
  });
  await screenApplication(application.id);
  await createSession({
    ...session,
    givenName: application.applicant.givenName,
    surname: application.applicant.surname,
  });
  redirect("/student?submitted=1");
}

export async function uploadDocument(formData: FormData) {
  const { applicant } = await studentApplicant();
  const type = String(formData.get("type") ?? "");
  const file = formData.get("file");
  if (!type || !(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Each file must be 5 MB or smaller." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { error: "Upload a PDF, JPG, or PNG file." };
  }

  let application = await prisma.application.findFirst({
    where: { applicantId: applicant.id, academicYear: ACADEMIC_YEAR },
  });
  if (application && application.status !== "DRAFT") {
    return { error: "A submitted application cannot be changed." };
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

  await saveDocumentFile({
    applicationId: application.id,
    type,
    originalName: file.name,
    mimeType: file.type,
    bytes: Buffer.from(await file.arrayBuffer()),
  });

  return { ok: true as const, applicationId: application.id };
}

export async function removeDocument(documentId: string) {
  const { applicant } = await studentApplicant();
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { application: true },
  });
  if (!doc || doc.application.applicantId !== applicant.id) {
    return { error: "Document not found." };
  }
  if (doc.application.status !== "DRAFT") {
    return { error: "A submitted application cannot be changed." };
  }
  await deleteStoredFile(doc.storedPath);
  await prisma.document.delete({ where: { id: documentId } });
  return { ok: true as const };
}

export async function decideApplication(formData: FormData) {
  const session = await requireCoordinator();
  const id = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "");
  const statusNote = String(formData.get("statusNote") ?? "").trim() || null;
  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return { error: "Choose a valid status." };
  }
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || application.status === "DRAFT") {
    return { error: "This application is not ready for a decision." };
  }
  await prisma.application.update({
    where: { id },
    data: {
      status,
      statusNote,
      decidedAt: status === "PENDING" ? null : new Date(),
      decidedByEmail: status === "PENDING" ? null : session.email,
    },
  });
  return { ok: true as const };
}

export async function rerunScreening(applicationId: string) {
  await requireCoordinator();
  await screenApplication(applicationId);
  return { ok: true as const };
}

export async function currentUser() {
  return getSession();
}
