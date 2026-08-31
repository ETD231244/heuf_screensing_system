import { NextResponse } from "next/server";
import { FLASH_COOKIE, SESSION_COOKIE } from "@/lib/constants";

export function isPreviewHttps(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") ?? "";
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return proto === "https" || host.includes("cursorvm.com") || host.includes("cursor.com");
}

export function cookieOptionsFor(request: Request) {
  const secure = isPreviewHttps(request);
  return {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    sameSite: (secure ? "none" : "lax") as "none" | "lax",
    secure,
  };
}

export function flashCookieOptionsFor(request: Request) {
  const secure = isPreviewHttps(request);
  return {
    httpOnly: false,
    path: "/",
    maxAge: 180,
    sameSite: (secure ? "none" : "lax") as "none" | "lax",
    secure,
  };
}

export function safeNextPath(path: string) {
  const allowed = new Set(["/coordinator", "/student", "/student/apply", "/", "/login", "/register"]);
  return allowed.has(path) ? path : "/";
}

/** 200 HTML + Set-Cookie. 303 redirects drop cookies in the Cursor Desktop iframe. */
export function signedInPage(request: Request, path: string, token: string) {
  const next = safeNextPath(path);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${next}" />
  <title>Signing in — HUEF</title>
</head>
<body style="font-family:Segoe UI,sans-serif;background:#f7f3e8;color:#0b4d2c;padding:48px;text-align:center">
  <p style="font-size:18px;font-weight:700">Signing you in to HUEF…</p>
  <p><a href="${next}" style="color:#0b4d2c;font-weight:700">Continue</a> if this page does not move.</p>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
  response.cookies.set(SESSION_COOKIE, token, cookieOptionsFor(request));
  return response;
}

export function redirectRelative(
  request: Request,
  path: string,
  options?: { flash?: string; clearSession?: boolean },
) {
  const next = safeNextPath(path);
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: next },
  });
  if (options?.flash) {
    response.cookies.set(FLASH_COOKIE, options.flash, flashCookieOptionsFor(request));
  }
  if (options?.clearSession) {
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptionsFor(request), maxAge: 0 });
  }
  return response;
}
