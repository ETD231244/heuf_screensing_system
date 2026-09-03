import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ACADEMIC_YEAR } from "@/lib/constants";

const links = [
  { href: "/admin/users", title: "User accounts", text: "Applicants, coordinators, administrators, and roles." },
  { href: "/admin/lookups", title: "Lookups", text: "Institutions, programmes, districts, LLGs, document types, and intake periods." },
  { href: "/admin/announcements", title: "Announcements", text: "Publish notices and deadlines to applicants or staff." },
  { href: "/admin/audit", title: "Audit trail", text: "Submissions, uploads, screening, decisions, and admin changes." },
  { href: "/admin/reports", title: "Reports", text: "Applications by institution, district, LLG, programme, status, and screening." },
  { href: "/admin/settings", title: "System configuration", text: "Intake messages and operational settings." },
];

export default async function AdminHome() {
  await requireAdmin();
  const [users, applications, audits, unread] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.application.count({ where: { academicYear: ACADEMIC_YEAR, status: { not: "DRAFT" } } }),
    prisma.auditLog.count(),
    prisma.notification.count({ where: { readAt: null } }),
  ]);
  const byRole = Object.fromEntries(users.map((row) => [row.role, row._count._all]));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Administrator</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">System management</h1>
        <p className="text-[#5c564c]">
          Role-based access: only administrators can change users, lookups, and configuration. Coordinators screen applications; applicants never see this area.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Applicants" value={byRole.STUDENT ?? 0} />
        <Stat label="Coordinators" value={byRole.COORDINATOR ?? 0} />
        <Stat label="Submitted files" value={applications} />
        <Stat label="Audit events" value={audits} />
      </div>
      <p className="text-sm text-[#6f675c]">{unread} unread notices sit in user inboxes.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:border-[var(--huef-green)]">
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
              </CardHeader>
              <CardBody className="text-sm text-[#5c564c]">{link.text}</CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-[#6f675c]">{label}</p>
        <p className="text-3xl font-extrabold text-[var(--huef-green)]">{value}</p>
      </CardBody>
    </Card>
  );
}
