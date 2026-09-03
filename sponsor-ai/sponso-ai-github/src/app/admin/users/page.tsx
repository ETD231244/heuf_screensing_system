import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserManager } from "@/components/admin-forms";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: { id: true, email: true, role: true, isActive: true },
  });
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Administrator</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">User accounts and roles</h1>
      </div>
      <UserManager users={users} />
    </div>
  );
}
