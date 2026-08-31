import { handleRegister } from "@/lib/handle-register";

export async function POST(request: Request) {
  return handleRegister(request);
}
