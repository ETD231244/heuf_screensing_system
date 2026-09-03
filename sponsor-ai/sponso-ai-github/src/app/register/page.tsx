import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth-forms";
import { getSession, homeForRole } from "@/lib/auth";
import { FLASH_COOKIE } from "@/lib/constants";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  const flash = (await cookies()).get(FLASH_COOKIE)?.value;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create a student account</CardTitle>
          <p className="mt-1 text-sm text-[#6f675c]">
            Use your own email. Do not lodge through a student leader or a third party. Each student applies for themselves.
          </p>
        </CardHeader>
        <CardBody className="space-y-5">
          <RegisterForm errorCode={flash} />
        </CardBody>
      </Card>
    </div>
  );
}
