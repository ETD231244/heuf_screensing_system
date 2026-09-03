"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword, normalizeRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notifyMany } from "@/lib/notify";
import { ACADEMIC_YEAR } from "@/lib/constants";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function adminSaveUser(formData: FormData) {
  const session = await requireAdmin();
  const id = field(formData, "id");
  const email = field(formData, "email").toLowerCase();
  const role = normalizeRole(field(formData, "role") || "STUDENT");
  const isActive = field(formData, "isActive") !== "false";
  const password = field(formData, "password");
  if (!email) return { error: "Enter an email address." };

  if (id) {
    const data: {
      email: string;
      role: string;
      isActive: boolean;
      passwordHash?: string;
    } = { email, role, isActive };
    if (password) {
      if (password.length < 8) return { error: "New passwords must be at least 8 characters." };
      data.passwordHash = await hashPassword(password);
    }
    await prisma.user.update({ where: { id }, data });
    await recordAudit({
      actorId: session.id,
      actorEmail: session.email,
      action: "USER_UPDATE",
      entityType: "User",
      entityId: id,
      details: `Updated ${email} (${role}, active=${isActive})`,
    });
    return { ok: true as const, message: "The user account has been updated." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "An account already exists with this email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const givenName = field(formData, "givenName") || "New";
  const surname = field(formData, "surname") || "User";
  const user = await prisma.user.create({
    data: {
      email,
      role,
      isActive,
      passwordHash: await hashPassword(password),
      authProvider: "PASSWORD",
      ...(role === "STUDENT"
        ? {
            applicant: {
              create: {
                givenName: givenName.toUpperCase(),
                surname: surname.toUpperCase(),
                gender: "U",
                phone: field(formData, "phone") || "70000000",
              },
            },
          }
        : {}),
    },
  });
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "USER_CREATE",
    entityType: "User",
    entityId: user.id,
    details: `Created ${email} as ${role}`,
  });
  return { ok: true as const, message: "The user account has been created." };
}

export async function adminSaveInstitution(formData: FormData) {
  const session = await requireAdmin();
  const id = field(formData, "id");
  const code = field(formData, "code").toUpperCase();
  const name = field(formData, "name");
  const category = field(formData, "category") || "Other";
  const province = field(formData, "province") || null;
  if (!code || !name) return { error: "Institution code and name are required." };
  if (id) {
    await prisma.institution.update({
      where: { id },
      data: { code, name, category, province, isActive: field(formData, "isActive") !== "false" },
    });
  } else {
    await prisma.institution.create({ data: { code, name, category, province } });
  }
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "INSTITUTION_SAVE",
    entityType: "Institution",
    details: `${code} — ${name}`,
  });
  return { ok: true as const, message: "Institution saved." };
}

export async function adminSaveProgram(formData: FormData) {
  await requireAdmin();
  const name = field(formData, "name");
  const institutionId = field(formData, "institutionId") || null;
  if (!name) return { error: "Enter a programme name." };
  await prisma.program.create({ data: { name, institutionId } });
  return { ok: true as const, message: "Programme added." };
}

export async function adminSaveLlg(formData: FormData) {
  await requireAdmin();
  const districtId = field(formData, "districtId");
  const name = field(formData, "name");
  if (!districtId || !name) return { error: "Select a district and enter the LLG name." };
  await prisma.llg.create({ data: { districtId, name } });
  return { ok: true as const, message: "LLG added." };
}

export async function adminSavePeriod(formData: FormData) {
  const session = await requireAdmin();
  const academicYear = field(formData, "academicYear") || ACADEMIC_YEAR;
  const title = field(formData, "title") || `${academicYear} Tuition Fee Assistance`;
  const opensAt = new Date(field(formData, "opensAt") || `${academicYear}-01-01`);
  const closesAt = new Date(field(formData, "closesAt") || `${academicYear}-02-13`);
  await prisma.applicationPeriod.upsert({
    where: { academicYear },
    update: { title, opensAt, closesAt, isActive: field(formData, "isActive") !== "false" },
    create: { academicYear, title, opensAt, closesAt },
  });
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "PERIOD_SAVE",
    entityType: "ApplicationPeriod",
    details: title,
  });
  return { ok: true as const, message: "Application period saved." };
}

export async function adminSaveDocumentType(formData: FormData) {
  await requireAdmin();
  const code = field(formData, "code").toUpperCase().replace(/\s+/g, "_");
  const label = field(formData, "label");
  if (!code || !label) return { error: "Code and label are required." };
  await prisma.documentType.upsert({
    where: { code },
    update: {
      label,
      requiredForNew: formData.get("requiredForNew") === "on",
      requiredForContinuing: formData.get("requiredForContinuing") === "on",
      requiredForNonHela: formData.get("requiredForNonHela") === "on",
      isActive: field(formData, "isActive") !== "false",
    },
    create: {
      code,
      label,
      requiredForNew: formData.get("requiredForNew") === "on",
      requiredForContinuing: formData.get("requiredForContinuing") === "on",
      requiredForNonHela: formData.get("requiredForNonHela") === "on",
    },
  });
  return { ok: true as const, message: "Document type saved." };
}

export async function adminSaveAnnouncement(formData: FormData) {
  const session = await requireAdmin();
  const title = field(formData, "title");
  const body = field(formData, "body");
  const audience = field(formData, "audience") || "ALL";
  const deadlineAt = field(formData, "deadlineAt") ? new Date(field(formData, "deadlineAt")) : null;
  if (!title || !body) return { error: "Enter a title and message." };
  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      audience,
      deadlineAt,
      createdById: session.id,
    },
  });
  const where =
    audience === "STUDENT"
      ? { role: "STUDENT" as const, isActive: true }
      : audience === "COORDINATOR"
        ? { role: "COORDINATOR" as const, isActive: true }
        : { isActive: true };
  const users = await prisma.user.findMany({ where, select: { id: true } });
  await notifyMany(
    users.map((user) => user.id),
    {
      senderId: session.id,
      title,
      message: body,
      type: "ANNOUNCEMENT",
      category: "ANNOUNCEMENT",
    },
  );
  await recordAudit({
    actorId: session.id,
    actorEmail: session.email,
    action: "ANNOUNCEMENT",
    entityType: "Announcement",
    entityId: announcement.id,
    details: title,
  });
  return { ok: true as const, message: "Announcement published and sent to the selected audience." };
}

export async function adminSaveSetting(formData: FormData) {
  await requireAdmin();
  const key = field(formData, "key");
  const value = field(formData, "value");
  if (!key) return { error: "Missing setting key." };
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return { ok: true as const, message: "Setting saved." };
}
