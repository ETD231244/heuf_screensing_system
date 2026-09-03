import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { homeForRole, normalizeRole, signedSessionToken } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { exchangeGoogleCode, verifyGoogleState } from "@/lib/google";
import { GOOGLE_STATE_COOKIE } from "@/lib/constants";
import { redirectRelative, signedInPage } from "@/lib/session-response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    return redirectRelative(request, "/login", { flash: "google_denied" });
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expected = jar.get(GOOGLE_STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected || !(await verifyGoogleState(state))) {
    return redirectRelative(request, "/login", { flash: "google_invalid" });
  }

  try {
    const profile = await exchangeGoogleCode(request, code);
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
      include: { applicant: true },
    });

    if (user && user.email === profile.email && user.googleId && user.googleId !== profile.googleId) {
      return redirectRelative(request, "/login", { flash: "google_mismatch" });
    }

    if (user && !user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          authProvider: user.passwordHash ? "BOTH" : "GOOGLE",
          lastLoginAt: new Date(),
        },
        include: { applicant: true },
      });
    } else if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          authProvider: "GOOGLE",
          role: "STUDENT",
          lastLoginAt: new Date(),
          applicant: {
            create: {
              givenName: profile.givenName.toUpperCase(),
              surname: profile.surname.toUpperCase(),
              gender: "U",
              phone: "",
            },
          },
        },
        include: { applicant: true },
      });
      await notifyUser({
        userId: user.id,
        title: "Welcome to HUEF",
        message:
          "You signed in with Google. Please complete your HUEF-specific details (phone, district, and origin) before submitting an application.",
        type: "SUCCESS",
        category: "APPLICATION",
      });
      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "REGISTER_GOOGLE",
        entityType: "User",
        entityId: user.id,
        details: "Applicant account created from a Google account",
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    if (!user.isActive) {
      return redirectRelative(request, "/login", { flash: "disabled" });
    }

    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "LOGIN_GOOGLE",
      entityType: "User",
      entityId: user.id,
      details: "Signed in with Google",
    });

    const role = normalizeRole(user.role);
    const token = await signedSessionToken({
      id: user.id,
      email: user.email,
      role,
      givenName: user.applicant?.givenName,
      surname: user.applicant?.surname,
    });

    const needsProfile =
      role === "STUDENT" &&
      (!user.applicant?.phone || user.applicant.gender === "U" || !user.applicant.districtId);
    const destination = needsProfile ? "/student/profile?complete=1" : homeForRole(role);
    const response = signedInPage(request, destination, token);
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return redirectRelative(request, "/login", { flash: "google_failed" });
  }
}
