import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { loadReportRows, groupCount } from "@/lib/reports";
import { STATUS_LABELS, SCREENING_STATUS_LABELS, type ScreeningStatus } from "@/lib/constants";

function BarList({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <ul className="space-y-2">
      {rows.map(([label, count]) => (
        <li key={label}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate pr-3">{label}</span>
            <span className="font-semibold tabular-nums">{count}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#e4ddd0]">
            <div className="h-2 rounded-full bg-[var(--huef-green)]" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage() {
  await requireStaff();
  const rows = await loadReportRows();
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Reports & analytics</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">2026 intake</h1>
          <p className="text-[#5c564c]">{rows.length} submitted applications.</p>
        </div>
        <a
          href="/api/reports/applications"
          className="rounded-md bg-[var(--huef-green)] px-4 py-2 text-sm font-semibold text-white"
        >
          Export CSV
        </a>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>By institution</CardTitle></CardHeader>
          <CardBody><BarList rows={groupCount(rows, (row) => row.institution.name)} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>By district</CardTitle></CardHeader>
          <CardBody><BarList rows={groupCount(rows, (row) => row.applicant.district?.name ?? "Not recorded")} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>By LLG</CardTitle></CardHeader>
          <CardBody><BarList rows={groupCount(rows, (row) => row.applicant.llg?.name ?? row.applicant.llgName ?? "Not recorded")} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>By programme</CardTitle></CardHeader>
          <CardBody><BarList rows={groupCount(rows, (row) => row.programName)} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>By year level</CardTitle></CardHeader>
          <CardBody><BarList rows={groupCount(rows, (row) => row.yearOfStudy)} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>By application status</CardTitle></CardHeader>
          <CardBody><BarList rows={groupCount(rows, (row) => STATUS_LABELS[row.status] ?? row.status)} /></CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>By screening outcome</CardTitle></CardHeader>
          <CardBody>
            <BarList
              rows={groupCount(rows, (row) =>
                row.screeningStatus
                  ? SCREENING_STATUS_LABELS[row.screeningStatus as ScreeningStatus] ?? row.screeningStatus
                  : "Not screened",
              )}
            />
          </CardBody>
        </Card>
      </div>
      <p className="text-sm">
        Administrators can also manage users and lookups from the{" "}
        <Link href="/admin" className="font-semibold text-[var(--huef-green)] underline">
          admin dashboard
        </Link>
        .
      </p>
    </div>
  );
}
