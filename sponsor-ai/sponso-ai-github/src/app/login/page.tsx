import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth-forms";
import { getSession, homeForRole } from "@/lib/auth";
import { FLASH_COOKIE } from "@/lib/constants";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  const flash = (await cookies()).get(FLASH_COOKIE)?.value;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to HUEF</CardTitle>
          <p className="mt-1 text-sm text-[#6f675c]">
            Students track an application here. The Sponsorship Coordinator manages the full list.
          </p>
        </CardHeader>
        <CardBody className="space-y-5">
          <LoginForm errorCode={flash} />
          <p className="text-sm text-[#5c564c]">
            New applicant?{" "}
            <Link href="/register" className="font-semibold text-[var(--huef-green)] underline">
              Create an account
            </Link>
          </p>
          <div className="rounded-lg bg-[var(--huef-cream)] px-4 py-3 text-sm">
            <p className="font-semibold text-[var(--huef-green-dark)]">Demo accounts</p>
            <p className="mt-1 text-[#5c564c]">
              Coordinator: <span className="font-mono">coordinator@huef.pg</span> / HUEF2026!
            </p>
            <p className="text-[#5c564c]">
              Administrator: <span className="font-mono">admin@huef.pg</span> / HUEF2026!
            </p>
            <p className="text-[#5c564c]">
              Student (draft form): <span className="font-mono">student@huef.pg</span> / student123
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
