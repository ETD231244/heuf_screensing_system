import { prisma } from "@/lib/prisma";
import { signedSessionToken, verifyPassword } from "@/lib/auth";
import { redirectRelative, signedInPage } from "@/lib/session-response";

export async function handleLogin(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return redirectRelative(request, "/login", { flash: "missing" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { applicant: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return redirectRelative(request, "/login", { flash: "invalid" });
  }

  const token = await signedSessionToken({
    id: user.id,
    email: user.email,
    role: user.role === "COORDINATOR" ? "COORDINATOR" : "STUDENT",
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });

  const destination = user.role === "COORDINATOR" ? "/coordinator" : "/student";
  return signedInPage(request, destination, token);
}
