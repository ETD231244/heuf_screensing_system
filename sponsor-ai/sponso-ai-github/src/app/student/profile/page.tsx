import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Alert } from "@/components/ui/alert";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; complete?: string }>;
}) {
  const session = await requireStudent();
  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { applicant: { include: { district: true, llg: true } } },
  });
  if (!user?.applicant) redirect("/register");
  const a = user.applicant;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Applicant profile</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Your HUEF details</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5c564c]">
          Keep your photograph and origin details up to date. Coordinators see this information when they review your application. Submitted applications cannot change eligibility facts without a coordinator request.
        </p>
      </div>
      {params.welcome ? (
        <Alert tone="success" title="Account created">
          Your HUEF account has been created successfully. You can now sign in any time. Complete this profile, then start your 2026 application.
        </Alert>
      ) : null}
      {params.complete ? (
        <Alert tone="warning" title="Finish your HUEF details">
          You signed in with Google. Please add your phone number, district, LLG, and origin information before you submit a scholarship application.
        </Alert>
      ) : null}
      <ProfileForm
        userId={user.id}
        email={user.email}
        hasPhoto={Boolean(a.photoBytes && a.photoMime)}
        initial={{
          givenName: a.givenName,
          surname: a.surname,
          gender: a.gender === "U" ? "" : a.gender,
          dateOfBirth: a.dateOfBirth ?? "",
          age: a.age ? String(a.age) : "",
          phone: a.phone ?? "",
          studentId: a.studentId ?? "",
          clanName: a.clanName ?? "",
          wardVillage: a.wardVillage ?? "",
          llgName: a.llg?.name ?? a.llgName ?? "",
          districtName: a.district?.name ?? "",
          province: a.province ?? "Hela",
        }}
      />
    </div>
  );
}
