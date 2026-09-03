import { prisma } from "@/lib/prisma";
import { homeForRole, normalizeRole, signedSessionToken, verifyPassword } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { redirectRelative, signedInPage } from "@/lib/session-response";
import { loginAllowed, loginSucceeded, originLooksTrusted, requestIp } from "@/lib/security";

export async function handleLogin(request: Request) {
  if (!originLooksTrusted(request)) {
    return redirectRelative(request, "/login", { flash: "invalid" });
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = requestIp(request);

  if (!email || !password) {
    return redirectRelative(request, "/login", { flash: "missing" });
  }
  if (!loginAllowed(ip)) {
    return redirectRelative(request, "/login", { flash: "locked" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { applicant: true },
  });
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return redirectRelative(request, "/login", { flash: "invalid" });
  }

  loginSucceeded(ip);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    details: "Signed in with email and password",
  });

  const role = normalizeRole(user.role);
  const token = await signedSessionToken({
    id: user.id,
    email: user.email,
    role,
    givenName: user.applicant?.givenName,
    surname: user.applicant?.surname,
  });

  return signedInPage(request, homeForRole(role), token);
}
