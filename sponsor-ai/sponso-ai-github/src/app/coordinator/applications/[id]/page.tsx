import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/auth";
import { Badge, Card, CardBody, CardHeader, CardTitle, statusTone } from "@/components/ui/card";
import { DecisionForm, ScreeningPanel } from "@/components/coordinator-panels";
import {
  DOCUMENT_LABELS,
  ELIGIBILITY_LABELS,
  FEE_CATEGORY_LABELS,
  STATUS_LABELS,
  STUDY_LEVEL_LABELS,
} from "@/lib/constants";
import { fileSizeLabel, formatDateTime, fullName } from "@/lib/utils";
import { parseScreening } from "@/lib/types";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCoordinator();
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { type: "asc" } },
      institution: true,
      applicant: { include: { user: true, district: true } },
    },
  });
  if (!application || application.status === "DRAFT") notFound();
  const a = application.applicant;
  const screening = parseScreening(application.screeningJson);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <Link href="/coordinator" className="text-sm font-semibold text-[var(--huef-green)]">
          ← All applications
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--huef-green-dark)]">
              {fullName(a.givenName, a.surname)}
            </h1>
            <p className="text-[#5c564c]">
              {a.user.email} · {a.phone} · {application.institution.code} {application.institution.name}
            </p>
          </div>
          <Badge tone={statusTone(application.status)} className="text-sm">
            {STATUS_LABELS[application.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Applicant</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
              <Fact label="Gender" value={a.gender === "F" ? "Female" : a.gender === "M" ? "Male" : a.gender} />
              <Fact label="Date of birth" value={a.dateOfBirth ?? "—"} />
              <Fact label="Clan / village" value={[a.clanName, a.wardVillage].filter(Boolean).join(" · ") || "—"} />
              <Fact label="LLG" value={a.llgName ?? "—"} />
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
            <CardBody className="space-y-2">
              {application.documents.length === 0 ? (
                <p className="text-sm text-[#6f675c]">No files attached.</p>
              ) : (
                application.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/api/files/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-md border border-[#e0d8c8] px-3 py-2 text-sm hover:bg-[var(--huef-cream)]"
                  >
                    <span>
                      <span className="block font-semibold text-[var(--huef-green-dark)]">
                        {DOCUMENT_LABELS[doc.type] ?? doc.type}
                      </span>
                      <span className="text-[#6f675c]">{doc.originalName}</span>
                    </span>
                    <span className="text-xs text-[#7a7266]">{fileSizeLabel(doc.sizeBytes)}</span>
                  </a>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <ScreeningPanel applicationId={application.id} result={screening} />
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
