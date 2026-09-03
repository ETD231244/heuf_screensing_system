import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/notification-list";

export default async function NotificationsPage() {
  const session = await requireUser();
  if (!session) redirect("/login");
  const items = await prisma.notification.findMany({
    where: { userId: session.id },
    include: {
      sender: { select: { email: true } },
      application: { select: { id: true, programName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Notification centre</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Notices</h1>
        <p className="text-[#5c564c]">
          Application updates, document issues, coordinator requests, decisions, and HUEF announcements appear here.
        </p>
      </div>
      <NotificationList items={items} />
    </div>
  );
}
