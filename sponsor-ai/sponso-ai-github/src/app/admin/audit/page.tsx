import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  await requireAdmin();
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Accountability</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Audit trail</h1>
        <p className="text-[#5c564c]">
          Submissions, document replacements, AI screenings, coordinator reviews, status changes, and administrative edits are kept even when later information changes.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent events</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="border-b border-[#f0eadc] pb-3 text-sm last:border-0">
              <p className="font-semibold text-[var(--huef-green-dark)]">{row.action}</p>
              <p className="text-[#5c564c]">{row.details}</p>
              <p className="text-xs text-[#6f675c]">
                {row.actorEmail} · {row.entityType}
                {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""} · {formatDateTime(row.createdAt)}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
