import { NextResponse } from "next/server";
import { googleAuthorizeUrl, googleConfigured, googleStateCookie } from "@/lib/google";
import { redirectRelative } from "@/lib/session-response";

export async function GET(request: Request) {
  if (!googleConfigured()) {
    return redirectRelative(request, "/login", { flash: "google_unconfigured" });
  }
  const started = await googleAuthorizeUrl(request);
  if (!started) {
    return redirectRelative(request, "/login", { flash: "google_unconfigured" });
  }
  const response = NextResponse.redirect(started.url);
  const cookie = googleStateCookie(request, started.state);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
