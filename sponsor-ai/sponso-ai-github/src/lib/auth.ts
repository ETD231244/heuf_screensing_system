import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE } from "./constants";

export type SessionUser = {
  id: string;
  email: string;
  role: "STUDENT" | "COORDINATOR";
  givenName?: string;
  surname?: string;
};

function secret() {
  const value = process.env.AUTH_SECRET || "huef-local-dev-secret-not-for-production";
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export async function signedSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    givenName: user.givenName ?? "",
    surname: user.surname ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function createSession(user: SessionUser) {
  const token = await signedSessionToken(user);
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const secure = proto === "https" || host.includes("cursorvm.com") || host.includes("cursor.com");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    sameSite: secure ? "none" : "lax",
    secure,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.role) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      role: payload.role === "COORDINATOR" ? "COORDINATOR" : "STUDENT",
      givenName: payload.givenName ? String(payload.givenName) : undefined,
      surname: payload.surname ? String(payload.surname) : undefined,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireStudent() {
  const session = await requireUser();
  if (session.role !== "STUDENT") redirect("/coordinator");
  return session;
}

export async function requireCoordinator() {
  const session = await requireUser();
  if (session.role !== "COORDINATOR") redirect("/student");
  return session;
}
