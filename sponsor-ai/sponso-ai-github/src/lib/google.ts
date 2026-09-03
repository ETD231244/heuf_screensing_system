import { SignJWT, jwtVerify } from "jose";
import { GOOGLE_STATE_COOKIE } from "./constants";
import { cookieOptionsFor, publicOrigin } from "./session-response";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "huef-local-dev-secret-not-for-production");
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(request: Request) {
  return `${publicOrigin(request)}/auth/google/callback`;
}

export async function googleAuthorizeUrl(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const state = await new SignJWT({ n: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
  const url = new URL(GOOGLE_AUTH);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return { url: url.toString(), state };
}

export async function verifyGoogleState(state: string) {
  try {
    await jwtVerify(state, secret());
    return true;
  } catch {
    return false;
  }
}

export function googleStateCookie(request: Request, state: string) {
  return {
    name: GOOGLE_STATE_COOKIE,
    value: state,
    options: { ...cookieOptionsFor(request), maxAge: 600 },
  };
}

export async function exchangeGoogleCode(request: Request, code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured.");
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleRedirectUri(request),
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error("Google could not verify this sign-in. Please try again.");
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }
  const profileRes = await fetch(GOOGLE_USERINFO, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("Could not read the Google account profile.");
  }
  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
  };
  if (!profile.email || !profile.sub) {
    throw new Error("The Google account did not provide a verified email address.");
  }
  return {
    googleId: profile.sub,
    email: profile.email.toLowerCase(),
    givenName: (profile.given_name || profile.name || "Applicant").trim(),
    surname: (profile.family_name || "HUEF").trim(),
  };
}
