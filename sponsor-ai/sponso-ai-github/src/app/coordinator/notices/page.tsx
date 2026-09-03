import { requireCoordinator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NoticeForm } from "@/components/notice-form";
import { fullName } from "@/lib/utils";

export default async function NoticesPage() {
  await requireCoordinator();
  const applicants = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true },
    include: { applicant: true },
    orderBy: { email: "asc" },
  });
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Communication</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Send a notice</h1>
        <p className="text-[#5c564c]">
          Notices appear in the applicant Notification Centre with the sender, date, and related application where applicable.
        </p>
      </div>
      <NoticeForm
        applicants={applicants.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.applicant ? fullName(user.applicant.givenName, user.applicant.surname) : user.email,
        }))}
      />
    </div>
  );
}
