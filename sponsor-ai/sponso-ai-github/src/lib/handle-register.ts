import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signedSessionToken } from "@/lib/auth";
import { redirectRelative, signedInPage } from "@/lib/session-response";

const registerSchema = z.object({
  givenName: z.string().trim().min(2),
  surname: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  password: z.string().min(8),
  confirmPassword: z.string(),
});

export async function handleRegister(request: Request) {
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
      role: "STUDENT",
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

  const token = await signedSessionToken({
    id: user.id,
    email: user.email,
    role: "STUDENT",
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });

  return signedInPage(request, "/student/apply", token);
}
