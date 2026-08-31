import { redirectRelative } from "@/lib/session-response";

export async function POST(request: Request) {
  return redirectRelative(request, "/", { clearSession: true });
}
