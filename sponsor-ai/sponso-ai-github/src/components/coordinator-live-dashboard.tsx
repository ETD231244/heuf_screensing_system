"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Badge, Card, CardBody, CardHeader, CardTitle, statusTone } from "@/components/ui/card";
import type {
  CoordinatorDashboardData,
  NamedCount,
} from "@/lib/coordinator-dashboard";

const POLL_MS = 8000;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#d4a017",
  MORE_INFO: "#c47a00",
  APPROVED: "#0b4d2c",
  REJECTED: "#c41e3a",
};

const SCREENING_COLORS: Record<string, string> = {
  PASSED_INITIAL: "#1b7a4a",
  NEEDS_REVIEW: "#d4a017",
  INFORMATION_MISMATCH: "#c47a00",
  INCORRECT_DOCUMENT: "#c41e3a",
  UNREADABLE_DOCUMENT: "#8e1528",
  MISSING_REQUIRED: "#b45309",
  POTENTIAL_DUPLICATE: "#6d28d9",
  UNABLE_TO_DETERMINE: "#64748b",
  NOT_SCREENED: "#94a3b8",
};

const DISTRICT_COLORS = ["#0b4d2c", "#1b7a4a", "#d4a017", "#c47a00"];

function colorForStatus(key: string) {
  return STATUS_COLORS[key] ?? "#6f675c";
}

function colorForScreening(key: string) {
  return SCREENING_COLORS[key] ?? "#6f675c";
}

export function CoordinatorLiveDashboard({ initialData }: { initialData: CoordinatorDashboardData }) {
  const [data, setData] = useState(initialData);
  const [live, setLive] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(() => new Date(initialData.generatedAt));
  const [, startTransition] = useTransition();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    async function poll() {
      if (document.hidden) {
        timer = window.setTimeout(poll, POLL_MS);
        return;
      }
      try {
        const response = await fetch("/api/coordinator/dashboard", { cache: "no-store" });
        if (!response.ok) throw new Error("dashboard");
        const next = (await response.json()) as CoordinatorDashboardData;
        if (!cancelled) {
          startTransition(() => setData(next));
          setLive(true);
          setUpdatedAt(new Date(next.generatedAt));
        }
      } catch {
        if (!cancelled) setLive(false);
      }
      if (!cancelled) timer = window.setTimeout(poll, POLL_MS);
    }

    timer = window.setTimeout(poll, POLL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(clock);
    };
  }, []);

  const secondsAgo = now == null ? 0 : Math.max(0, Math.round((now - updatedAt.getTime()) / 1000));

  return (
    <section className="space-y-5" aria-label="Live coordinator dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">
            Live intake
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--huef-green-dark)]">
            Real-time screening picture
          </h2>
          <p className="text-sm text-[#5c564c]">
            Charts and tables refresh every 8 seconds while this page is open.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full border border-[#e0d8c8] bg-white px-3 py-1.5 text-sm font-semibold"
          aria-live="polite"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${live ? "animate-pulse bg-[#1b7a4a]" : "bg-[#c41e3a]"}`}
          />
          {live ? "Live" : "Paused"}
          <span className="font-normal text-[#6f675c]" suppressHydrationWarning>
            · {now == null || secondsAgo < 5 ? "updated just now" : `updated ${secondsAgo}s ago`}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total submitted" value={data.totals.submitted} hint="All 2026 files" />
        <Kpi label="Awaiting screening" value={data.totals.awaiting} hint="Still pending" />
        <Kpi label="AI-flagged" value={data.totals.flagged} hint="Needs a closer look" />
        <Kpi label="Needs manual review" value={data.totals.review} hint="AI unsure" />
        <Kpi label="Incomplete / more info" value={data.totals.incomplete} hint="Waiting on applicant" />
        <Kpi label="Approved" value={data.totals.approved} hint="Awarded" />
        <Kpi label="Not successful" value={data.totals.rejected} hint="Closed files" />
        <Kpi label="New (last 7 days)" value={data.totals.last7Days} hint="Recent submissions" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application status</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart slices={data.byStatus} colorFor={colorForStatus} empty="No submitted applications yet." />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Submissions over 14 days</CardTitle>
          </CardHeader>
          <CardBody>
            <AreaChart points={data.submissionsByDay} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Count by Hela district</CardTitle>
          </CardHeader>
          <CardBody>
            <VerticalBars rows={data.byDistrict} colors={DISTRICT_COLORS} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI screening outcomes</CardTitle>
          </CardHeader>
          <CardBody>
            <HorizontalBars rows={data.byScreening} colorFor={colorForScreening} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Institution snapshot</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <InstitutionTable rows={data.byInstitution} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attention queue</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <AttentionTable rows={data.attentionQueue} />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-[#6f675c]">{label}</p>
        <p className="text-3xl font-extrabold tabular-nums text-[var(--huef-green)]">{value}</p>
        <p className="mt-1 text-xs text-[#8a8173]">{hint}</p>
      </CardBody>
    </Card>
  );
}

function DonutChart({
  slices,
  colorFor,
  empty,
}: {
  slices: NamedCount[];
  colorFor: (key: string) => string;
  empty: string;
}) {
  const total = slices.reduce((sum, row) => sum + row.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return <p className="text-sm text-[#6f675c]">{empty}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 120 120" className="h-44 w-44 shrink-0" role="img" aria-label="Application status chart">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#efe8d8" strokeWidth="16" />
        {slices.map((slice) => {
          if (slice.count === 0) return null;
          const dash = (slice.count / total) * circumference;
          const current = offset;
          offset += dash;
          return (
            <circle
              key={slice.key}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={colorFor(slice.key)}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-current}
              transform="rotate(-90 60 60)"
              strokeLinecap="butt"
            />
          );
        })}
        <text x="60" y="56" textAnchor="middle" fill="#07351f" fontSize="18" fontWeight="800">
          {total}
        </text>
        <text x="60" y="72" textAnchor="middle" fill="#6f675c" fontSize="9" fontWeight="600">
          files
        </text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(slice.key) }} />
              {slice.label}
            </span>
            <span className="font-semibold tabular-nums">
              {slice.count}
              <span className="ml-1 font-normal text-[#8a8173]">
                ({Math.round((slice.count / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AreaChart({ points }: { points: Array<{ date: string; label: string; count: number }> }) {
  const max = Math.max(1, ...points.map((point) => point.count));
  const width = 320;
  const height = 160;
  const padX = 12;
  const padY = 18;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const coords = points.map((point, index) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padY + innerH - (point.count / max) * innerH;
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${padY + innerH} ${line} ${padX + innerW},${padY + innerH}`;
  const latest = points[points.length - 1]?.count ?? 0;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Submissions in the last 14 days">
        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padY + innerH - tick * innerH;
          return <line key={tick} x1={padX} x2={padX + innerW} y1={y} y2={y} stroke="#efe8d8" />;
        })}
        <polygon points={area} fill="rgba(11,77,44,0.12)" />
        <polyline points={line} fill="none" stroke="#0b4d2c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((point) => (
          <circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#f0c000"
            stroke="#0b4d2c"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-[#8a8173]">
        <span>{points[0]?.label}</span>
        <span className="font-semibold text-[var(--huef-green-dark)]">{latest} today</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function VerticalBars({ rows, colors }: { rows: NamedCount[]; colors: string[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="flex h-52 items-end gap-3">
      {rows.map((row, index) => (
        <div key={row.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
          <p className="mb-1 text-sm font-extrabold tabular-nums text-[var(--huef-green-dark)]">{row.count}</p>
          <div
            className="w-full max-w-16 rounded-t-md"
            style={{
              height: `${Math.max(row.count === 0 ? 4 : 12, (row.count / max) * 100)}%`,
              background: colors[index % colors.length],
            }}
            title={`${row.label}: ${row.count}`}
          />
          <p className="mt-2 h-10 text-center text-[11px] font-semibold leading-tight text-[#5c564c]">{row.label}</p>
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({
  rows,
  colorFor,
}: {
  rows: NamedCount[];
  colorFor: (key: string) => string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  if (rows.length === 0) {
    return <p className="text-sm text-[#6f675c]">No screening results yet.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate pr-2">{row.label}</span>
            <span className="font-semibold tabular-nums">{row.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#efe8d8]">
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${(row.count / max) * 100}%`, background: colorFor(row.key) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InstitutionTable({
  rows,
}: {
  rows: CoordinatorDashboardData["byInstitution"];
}) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-sm text-[#6f675c]">No institution counts yet.</p>;
  }
  return (
    <table className="data-grid text-sm">
      <thead>
        <tr className="bg-[var(--huef-cream)] text-left text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <th className="px-4 py-3">Institution</th>
          <th className="px-3 py-3 text-right">Total</th>
          <th className="px-3 py-3 text-right">Pending</th>
          <th className="px-3 py-3 text-right">Approved</th>
          <th className="px-3 py-3 text-right">Not successful</th>
          <th className="px-4 py-3 text-right">AI flags</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.code} className="border-t border-[#f0eadc]">
            <td className="px-4 py-3">
              <span className="font-semibold text-[var(--huef-green-dark)]">{row.code}</span>
              <span className="mt-0.5 block text-xs text-[#6f675c]">{row.name}</span>
            </td>
            <td className="px-3 py-3 text-right tabular-nums font-semibold">{row.total}</td>
            <td className="px-3 py-3 text-right tabular-nums">{row.pending}</td>
            <td className="px-3 py-3 text-right tabular-nums">{row.approved}</td>
            <td className="px-3 py-3 text-right tabular-nums">{row.rejected}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.flagged}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AttentionTable({ rows }: { rows: CoordinatorDashboardData["attentionQueue"] }) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-sm text-[#6f675c]">No files currently need attention.</p>;
  }
  return (
    <table className="data-grid text-sm">
      <thead>
        <tr className="bg-[var(--huef-cream)] text-left text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <th className="px-4 py-3">Applicant</th>
          <th className="px-3 py-3">District</th>
          <th className="px-3 py-3">Status</th>
          <th className="px-3 py-3">AI</th>
          <th className="px-4 py-3 text-right">Open</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-[#f0eadc]">
            <td className="px-4 py-3">
              <span className="font-semibold text-[var(--huef-green-dark)]">{row.name}</span>
              <span className="mt-0.5 block text-xs text-[#6f675c]">
                {row.institution} · {row.submittedLabel}
              </span>
            </td>
            <td className="px-3 py-3">
              {row.district}
              <span className="block text-xs text-[#6f675c]">{row.llg}</span>
            </td>
            <td className="px-3 py-3">
              <Badge tone={statusTone(row.status)}>{row.statusLabel}</Badge>
            </td>
            <td className="px-3 py-3 text-xs text-[#5c564c]">{row.screeningLabel}</td>
            <td className="px-4 py-3 text-right">
              <Link href={`/coordinator/applications/${row.id}`} className="font-semibold text-[var(--huef-green)]">
                Review
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
