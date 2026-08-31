import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/auth";
import { Badge, Card, CardBody, CardHeader, CardTitle, statusTone } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { ACADEMIC_YEAR, HELA_DISTRICTS, STATUS_LABELS } from "@/lib/constants";
import { formatDate, fullName } from "@/lib/utils";
import { parseScreening } from "@/lib/types";
import { recommendationLabel } from "@/lib/screening";

export default async function CoordinatorPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; institution?: string; status?: string; q?: string }>;
}) {
  await requireCoordinator();
  const params = await searchParams;
  const [institutions, applications, counts] = await Promise.all([
    prisma.institution.findMany({ orderBy: { code: "asc" } }),
    prisma.application.findMany({
      where: {
        academicYear: ACADEMIC_YEAR,
        status: { not: "DRAFT" },
        ...(params.status ? { status: params.status } : {}),
        ...(params.institution ? { institutionId: params.institution } : {}),
        ...(params.district
          ? { applicant: { district: { name: params.district } } }
          : {}),
        ...(params.q
          ? {
              OR: [
                { applicant: { givenName: { contains: params.q } } },
                { applicant: { surname: { contains: params.q } } },
                { applicant: { user: { email: { contains: params.q } } } },
                { programName: { contains: params.q } },
              ],
            }
          : {}),
      },
      include: {
        applicant: { include: { district: true, user: true } },
        institution: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { academicYear: ACADEMIC_YEAR, status: { not: "DRAFT" } },
      _count: { _all: true },
    }),
  ]);

  const byStatus = Object.fromEntries(counts.map((row) => [row.status, row._count._all]));
  const districtRows = await prisma.application.findMany({
    where: { academicYear: ACADEMIC_YEAR, status: { not: "DRAFT" } },
    include: { applicant: { include: { district: true } } },
  });
  const districtCounts = HELA_DISTRICTS.map((name) => ({
    name,
    count: districtRows.filter((row) => row.applicant.district?.name === name).length,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">
          Sponsorship coordinator
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">
          2026 applications
        </h1>
        <p className="text-[#5c564c]">
          All submitted files in one list, already sorted by district and institution. Open a record to read the documents and record a decision.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Submitted" value={districtRows.length} />
        <Summary label="Pending" value={byStatus.PENDING ?? 0} />
        <Summary label="Approved" value={byStatus.APPROVED ?? 0} />
        <Summary label="Not successful" value={byStatus.REJECTED ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Count by Hela district</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-4">
          {districtCounts.map((row) => (
            <div key={row.name} className="rounded-lg bg-[var(--huef-cream)] px-3 py-3">
              <p className="text-sm font-semibold text-[var(--huef-green-dark)]">{row.name}</p>
              <p className="text-2xl font-extrabold text-[var(--huef-green)]">{row.count}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <form className="grid gap-3 rounded-xl border border-[#e0d8c8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search name, email, programme"
          className="h-11 rounded-md border border-[#cfc6b4] px-3"
        />
        <Select name="district" defaultValue={params.district ?? ""}>
          <option value="">All districts</option>
          {HELA_DISTRICTS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </Select>
        <Select name="institution" defaultValue={params.institution ?? ""}>
          <option value="">All institutions</option>
          {institutions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Select name="status" defaultValue={params.status ?? ""} className="flex-1">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Not successful</option>
          </Select>
          <button
            type="submit"
            className="h-11 rounded-md bg-[var(--huef-green)] px-4 text-sm font-semibold text-white"
          >
            Filter
          </button>
        </div>
      </form>

      {applications.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-[#6f675c]">
            No submitted applications match these filters.
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e0d8c8] bg-white">
          <div className="hidden grid-cols-[1.2fr_0.8fr_1.1fr_0.6fr_0.8fr] gap-3 border-b border-[#eee6d6] bg-[var(--huef-cream)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6f675c] md:grid">
            <span>Applicant</span>
            <span>District</span>
            <span>Institution</span>
            <span>Status</span>
            <span>Screening</span>
          </div>
          <ul>
            {applications.map((app) => {
              const screening = parseScreening(app.screeningJson);
              return (
                <li key={app.id} className="border-b border-[#f0eadc] last:border-0">
                  <Link
                    href={`/coordinator/applications/${app.id}`}
                    className="grid gap-1 px-4 py-3 hover:bg-[#fbf7ee] md:grid-cols-[1.2fr_0.8fr_1.1fr_0.6fr_0.8fr] md:items-center md:gap-3"
                  >
                    <span>
                      <span className="block font-semibold text-[var(--huef-green-dark)]">
                        {fullName(app.applicant.givenName, app.applicant.surname)}
                      </span>
                      <span className="text-xs text-[#6f675c]">
                        {app.applicant.user.email} · {formatDate(app.submittedAt)}
                      </span>
                    </span>
                    <span className="text-sm">{app.applicant.district?.name ?? "—"}</span>
                    <span className="text-sm">
                      {app.institution.code} · {app.programName}
                    </span>
                    <span>
                      <Badge tone={statusTone(app.status)}>{STATUS_LABELS[app.status]}</Badge>
                    </span>
                    <span className="text-xs text-[#5c564c]">
                      {screening
                        ? `${screening.score}/100 · ${recommendationLabel(screening.recommendation)}`
                        : "Not screened"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-[#6f675c]">{label}</p>
        <p className="text-3xl font-extrabold text-[var(--huef-green)]">{value}</p>
      </CardBody>
    </Card>
  );
}
