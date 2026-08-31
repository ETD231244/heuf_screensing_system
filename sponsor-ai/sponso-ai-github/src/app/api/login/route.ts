import { handleLogin } from "@/lib/handle-login";

export async function POST(request: Request) {
  return handleLogin(request);
}
