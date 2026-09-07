import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/auth";
import { Badge, Card, CardBody, CardHeader, CardTitle, statusTone } from "@/components/ui/card";
import { DecisionForm, ScreeningPanel } from "@/components/coordinator-panels";
import { isDeepSeekConfigured } from "@/lib/deepseek";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import {
  DOCUMENT_LABELS,
  ELIGIBILITY_LABELS,
  FEE_CATEGORY_LABELS,
  SCREENING_STATUS_LABELS,
  STATUS_LABELS,
  STUDY_LEVEL_LABELS,
  type ScreeningStatus,
} from "@/lib/constants";
import { fileSizeLabel, formatDateTime, fullName } from "@/lib/utils";
import { parseScreening } from "@/lib/types";
import { DocumentPreview } from "@/components/document-preview";

export const maxDuration = 60;

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCoordinator();
  const { id } = await params;
  const [application, deepSeekReady] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        documents: { orderBy: [{ isCurrent: "desc" }, { uploadedAt: "desc" }] },
        institution: true,
        screeningHistory: { orderBy: { createdAt: "desc" }, take: 8 },
        applicant: { include: { user: true, district: true, llg: true } },
      },
    }),
    isDeepSeekConfigured(),
  ]);
  if (!application || application.status === "DRAFT") notFound();
  const a = application.applicant;
  const screening = parseScreening(application.screeningJson);
  const name = fullName(a.givenName, a.surname);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <Link href="/coordinator" className="text-sm font-semibold text-[var(--huef-green)]">
          ← All applications
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <Avatar userId={a.userId} name={name} hasPhoto={Boolean(a.photoMime)} size={72} />
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--huef-green-dark)]">{name}</h1>
              <p className="text-[#5c564c]">
                {a.user.email} · {a.phone} · {application.institution.code} {application.institution.name}
              </p>
              <p className="text-sm text-[#6f675c]">
                {a.district?.name ?? "District not recorded"}
                {a.llg?.name || a.llgName ? ` · ${a.llg?.name ?? a.llgName}` : ""}
                {a.studentId ? ` · Student ID ${a.studentId}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone={statusTone(application.status)} className="text-sm">
              {STATUS_LABELS[application.status]}
            </Badge>
            {application.screeningStatus ? (
              <Badge tone={statusTone(application.screeningStatus)}>
                {SCREENING_STATUS_LABELS[application.screeningStatus as ScreeningStatus]}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <Alert tone="info">
        Open the applicant profile, uploaded documents, DeepSeek briefing, and screening history together. DeepSeek does not make the award.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Applicant profile</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
              <Fact label="Gender" value={a.gender === "F" ? "Female" : a.gender === "M" ? "Male" : a.gender} />
              <Fact label="Date of birth" value={a.dateOfBirth ?? "—"} />
              <Fact label="Clan / village" value={[a.clanName, a.wardVillage].filter(Boolean).join(" · ") || "—"} />
              <Fact label="LLG" value={a.llg?.name ?? a.llgName ?? "—"} />
              <Fact label="District" value={a.district?.name ?? "—"} />
              <Fact label="Eligibility" value={ELIGIBILITY_LABELS[a.eligibilityPath] ?? a.eligibilityPath} />
              <Fact label="Father" value={[a.fatherFullName, a.fatherOccupation].filter(Boolean).join(" — ") || "—"} />
              <Fact label="Mother" value={[a.motherFullName, a.motherOccupation].filter(Boolean).join(" — ") || "—"} />
              {a.eligibilityPath !== "HELA_ORIGIN" ? (
                <>
                  <Fact label="Public servant" value={a.publicServantWho ?? "—"} />
                  <Fact label="Department / years" value={`${a.publicServantDepartment ?? "—"} · ${a.publicServantYears ?? 0} yrs`} />
                </>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study and fees</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
              <Fact label="Type" value={application.applicantType === "CONTINUING" ? "Continuing" : "New intake"} />
              <Fact label="Programme" value={application.programName} />
              <Fact label="Level" value={STUDY_LEVEL_LABELS[application.studyLevel] ?? application.studyLevel} />
              <Fact label="Year of study" value={application.yearOfStudy} />
              <Fact label="Fee category" value={FEE_CATEGORY_LABELS[application.feeCategory] ?? application.feeCategory} />
              <Fact label="Tuition 2026" value={application.tuitionFees ? `K ${application.tuitionFees}` : "—"} />
              <Fact label="Account" value={[application.accountName, application.accountNumber].filter(Boolean).join(" · ") || "—"} />
              <Fact label="Bank" value={[application.bankName, application.bankBranch].filter(Boolean).join(" · ") || "—"} />
              <Fact label="Witness" value={application.witnessName ?? "—"} />
              <Fact label="Submitted" value={formatDateTime(application.submittedAt)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supporting documents</CardTitle>
            </CardHeader>
            <CardBody className="space-y-5">
              {application.documents.filter((doc) => doc.isCurrent).length === 0 ? (
                <p className="text-sm text-[#6f675c]">No files attached.</p>
              ) : (
                application.documents
                  .filter((doc) => doc.isCurrent)
                  .map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--huef-green-dark)]">
                          {DOCUMENT_LABELS[doc.type] ?? doc.type}
                        </p>
                        {doc.screeningStatus ? (
                          <Badge tone={doc.screeningStatus === "PASSED_INITIAL" ? "green" : "amber"}>
                            {SCREENING_STATUS_LABELS[doc.screeningStatus as ScreeningStatus] ?? doc.screeningStatus}
                          </Badge>
                        ) : null}
                      </div>
                      <DocumentPreview
                        id={doc.id}
                        mimeType={doc.mimeType}
                        originalName={doc.originalName}
                        sizeBytes={doc.sizeBytes}
                      />
                    </div>
                  ))
              )}
              {application.documents.some((doc) => !doc.isCurrent) ? (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--huef-green)]">
                    Previous versions (kept for audit)
                  </p>
                  <ul className="space-y-1 text-sm">
                    {application.documents
                      .filter((doc) => !doc.isCurrent)
                      .map((doc) => (
                        <li key={doc.id}>
                          <a href={`/api/files/${doc.id}`} className="text-[var(--huef-green)] underline">
                            {DOCUMENT_LABELS[doc.type] ?? doc.type} — {doc.originalName}
                          </a>
                          <span className="text-xs text-[#6f675c]">
                            {" "}
                            · replaced {formatDateTime(doc.supersededAt)} · {fileSizeLabel(doc.sizeBytes)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screening history</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              {application.screeningHistory.length === 0 ? (
                <p className="text-[#6f675c]">No stored screening runs yet.</p>
              ) : (
                application.screeningHistory.map((row) => (
                  <div key={row.id} className="rounded-md bg-[var(--huef-cream)] px-3 py-2">
                    <p className="font-semibold text-[var(--huef-green-dark)]">
                      {SCREENING_STATUS_LABELS[row.overallStatus as ScreeningStatus] ?? row.overallStatus}
                    </p>
                    <p className="text-xs text-[#6f675c]">
                      {formatDateTime(row.createdAt)} · {row.runBy}
                      {row.coordinatorOverride ? ` · Override: ${row.overrideReason}` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <ScreeningPanel applicationId={application.id} result={screening} deepSeekReady={deepSeekReady} />
          <DecisionForm
            applicationId={application.id}
            currentStatus={application.status}
            currentNote={application.statusNote}
          />
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7266]">{label}</p>
      <p className="font-medium text-[var(--huef-ink)]">{value}</p>
    </div>
  );
}
