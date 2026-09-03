import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signedSessionToken } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { redirectRelative, signedInPage } from "@/lib/session-response";
import { originLooksTrusted } from "@/lib/security";

const registerSchema = z.object({
  givenName: z.string().trim().min(2),
  surname: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  password: z.string().min(8),
  confirmPassword: z.string(),
});

export async function handleRegister(request: Request) {
  if (!originLooksTrusted(request)) {
    return redirectRelative(request, "/register", { flash: "invalid" });
  }

  const form = await request.formData();
  const parsed = registerSchema.safeParse({
    givenName: form.get("givenName"),
    surname: form.get("surname"),
    email: form.get("email"),
    phone: form.get("phone"),
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
  });

  if (!parsed.success) {
    return redirectRelative(request, "/register", { flash: "invalid" });
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return redirectRelative(request, "/register", { flash: "mismatch" });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return redirectRelative(request, "/register", { flash: "exists" });
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
          givenName: parsed.data.givenName.trim().toUpperCase(),
          surname: parsed.data.surname.trim().toUpperCase(),
          gender: "U",
          phone: parsed.data.phone.trim(),
        },
      },
    },
    include: { applicant: true },
  });

  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "REGISTER",
    entityType: "User",
    entityId: user.id,
    details: "Applicant account created with email and password",
  });
  await notifyUser({
    userId: user.id,
    title: "Welcome to HUEF",
    message:
      "Your HUEF account has been created successfully. Complete your profile, then start your 2026 Tuition Fee Assistance application.",
    type: "SUCCESS",
    category: "APPLICATION",
  });

  const token = await signedSessionToken({
    id: user.id,
    email: user.email,
    role: "STUDENT",
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });

  return signedInPage(request, "/student/profile?welcome=1", token);
}
