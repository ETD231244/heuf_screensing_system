import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnnouncementManager } from "@/components/announcement-manager";

export default async function AnnouncementsPage() {
  await requireAdmin();
  const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Administrator</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Announcements and deadlines</h1>
      </div>
      <AnnouncementManager items={items} />
    </div>
  );
}
