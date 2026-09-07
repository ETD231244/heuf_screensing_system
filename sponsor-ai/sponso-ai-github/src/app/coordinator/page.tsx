import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/auth";
import { Badge, Card, CardBody, statusTone } from "@/components/ui/card";
import {
  ACADEMIC_YEAR,
  SCREENING_STATUS_LABELS,
  STATUS_LABELS,
  type ScreeningStatus,
} from "@/lib/constants";
import { CoordinatorFilters } from "@/components/coordinator-filters";
import { CoordinatorLiveDashboard } from "@/components/coordinator-live-dashboard";
import { loadCoordinatorDashboard } from "@/lib/coordinator-dashboard";
import { formatDate, fullName } from "@/lib/utils";
import { parseScreening } from "@/lib/types";
import { recommendationLabel } from "@/lib/screening";
import { Avatar } from "@/components/ui/avatar";

export default async function CoordinatorPage({
  searchParams,
}: {
  searchParams: Promise<{
    district?: string;
    llg?: string;
    institution?: string;
    status?: string;
    screening?: string;
    year?: string;
    q?: string;
  }>;
}) {
  await requireCoordinator();
  const params = await searchParams;
  const [institutions, applications, dashboard] = await Promise.all([
    prisma.institution.findMany({ orderBy: { code: "asc" } }),
    prisma.application.findMany({
      where: {
        academicYear: ACADEMIC_YEAR,
        status: { not: "DRAFT" },
        ...(params.status ? { status: params.status } : {}),
        ...(params.institution ? { institutionId: params.institution } : {}),
        ...(params.year ? { yearOfStudy: params.year } : {}),
        ...(params.screening ? { screeningStatus: params.screening } : {}),
        ...(params.district ? { applicant: { district: { name: params.district } } } : {}),
        ...(params.llg
          ? { applicant: { OR: [{ llg: { name: params.llg } }, { llgName: params.llg }] } }
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
        applicant: { include: { district: true, user: true, llg: true } },
        institution: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    loadCoordinatorDashboard(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--huef-green-dark)]">
          2026 screening desk
        </h1>
        <p className="mt-1 text-[#5c564c]">
          AI prepares a first pass. You still open the file, read the documents, and record the award decision.
        </p>
      </div>

      <CoordinatorLiveDashboard initialData={dashboard} />

      <CoordinatorFilters
        institutions={institutions}
        initial={{
          district: params.district,
          llg: params.llg,
          institution: params.institution,
          status: params.status,
          screening: params.screening,
          year: params.year,
          q: params.q,
        }}
      />

      {applications.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-[#6f675c]">No submitted applications match these filters.</CardBody>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e0d8c8] bg-white">
          <div className="hidden grid-cols-[1.3fr_0.7fr_1.1fr_0.6fr_0.9fr] gap-3 border-b border-[#eee6d6] bg-[var(--huef-cream)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6f675c] md:grid">
            <span>Applicant</span>
            <span>District / LLG</span>
            <span>Institution</span>
            <span>Status</span>
            <span>AI screening</span>
          </div>
          <ul>
            {applications.map((app) => {
              const screening = parseScreening(app.screeningJson);
              return (
                <li key={app.id} className="border-b border-[#f0eadc] last:border-0">
                  <Link
                    href={`/coordinator/applications/${app.id}`}
                    className="grid gap-2 px-4 py-3 hover:bg-[#fbf7ee] md:grid-cols-[1.3fr_0.7fr_1.1fr_0.6fr_0.9fr] md:items-center md:gap-3"
                  >
                    <span className="flex items-center gap-3">
                      <Avatar
                        userId={app.applicant.userId}
                        name={fullName(app.applicant.givenName, app.applicant.surname)}
                        hasPhoto={Boolean(app.applicant.photoMime)}
                        size={40}
                        className="hidden sm:inline-flex"
                      />
                      <span>
                        <span className="block font-semibold text-[var(--huef-green-dark)]">
                          {fullName(app.applicant.givenName, app.applicant.surname)}
                        </span>
                        <span className="text-xs text-[#6f675c]">
                          {app.applicant.user.email} · {formatDate(app.submittedAt)}
                        </span>
                      </span>
                    </span>
                    <span className="text-sm">
                      {app.applicant.district?.name ?? "—"}
                      <span className="block text-xs text-[#6f675c]">{app.applicant.llg?.name ?? app.applicant.llgName ?? ""}</span>
                    </span>
                    <span className="text-sm">
                      {app.institution.code} · {app.programName}
                      <span className="block text-xs text-[#6f675c]">{app.yearOfStudy}</span>
                    </span>
                    <span>
                      <Badge tone={statusTone(app.status)}>{STATUS_LABELS[app.status]}</Badge>
                    </span>
                    <span className="text-xs text-[#5c564c]">
                      {app.screeningStatus
                        ? SCREENING_STATUS_LABELS[app.screeningStatus as ScreeningStatus]
                        : screening
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
