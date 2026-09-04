import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, CardTitle, statusTone } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACADEMIC_YEAR,
  APPLICATION_DEADLINE_LABEL,
  SCREENING_STATUS_LABELS,
  STATUS_LABELS,
  documentLabel,
  requiredDocuments,
} from "@/lib/constants";
import { formatDateTime, fullName } from "@/lib/utils";
import { applicationCompletion, profileCompletion } from "@/lib/progress";
import { parseScreening } from "@/lib/types";
import type { ScreeningStatus } from "@/lib/constants";

export default async function StudentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await requireStudent();
  const params = await searchParams;
  const [user, documentTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      include: {
        applicant: {
          include: {
            district: true,
            llg: true,
            applications: {
              where: { academicYear: ACADEMIC_YEAR },
              include: { institution: true, documents: { where: { isCurrent: true } } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        notifications: {
          where: { readAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.documentType.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);
  if (!user?.applicant) redirect("/student/profile");
  const application = user.applicant.applications[0];
  const a = user.applicant;
  const hasPhoto = Boolean(a.photoBytes && a.photoMime);
  const profile = profileCompletion({
    givenName: a.givenName,
    surname: a.surname,
    gender: a.gender,
    dateOfBirth: a.dateOfBirth,
    phone: a.phone,
    districtId: a.districtId,
    llgName: a.llg?.name ?? a.llgName,
    wardVillage: a.wardVillage,
    clanName: a.clanName,
    hasPhoto,
  });
  const required = application
    ? requiredDocuments(application.applicantType, a.eligibilityPath, documentTypes)
    : requiredDocuments("NEW_INTAKE", a.eligibilityPath, documentTypes);
  const uploadedTypes = new Set(application?.documents.map((doc) => doc.type) ?? []);
  const missingDocs = required.filter((type) => !uploadedTypes.has(type));
  const screening = parseScreening(application?.screeningJson);
  const issueFlags = (screening?.documents ?? []).filter((doc) => doc.status !== "PASSED_INITIAL");
  const completion = applicationCompletion({
    profilePercent: profile.percent,
    hasInstitution: Boolean(application?.institutionId),
    hasProgram: Boolean(application?.programName && application.programName !== "To be confirmed"),
    hasYear: Boolean(application?.yearOfStudy && application.yearOfStudy !== "Not stated"),
    uploaded: uploadedTypes.size,
    required: required.length,
    declared: Boolean(application?.declaredAt),
    submitted: Boolean(application && application.status !== "DRAFT"),
  });

  const nextStep = !application
    ? "Start your 2026 HUEF application."
    : application.status === "MORE_INFO"
      ? "A coordinator has asked for more information. Update the highlighted documents and resubmit."
      : application.status === "DRAFT"
        ? missingDocs.length
          ? `Upload missing documents: ${missingDocs.map((type) => documentLabel(type, documentTypes)).join(", ")}.`
          : profile.percent < 80
            ? "Finish your profile (photo, district, and LLG), then submit the form."
            : "Review the declaration and submit your application."
        : application.status === "PENDING"
          ? "Your file is with the Sponsorship Coordinator. Watch this page and your notices for updates."
          : application.status === "APPROVED"
            ? "Your application was approved. Keep your student ID and fee invoice."
            : "This application was not successful. Read the coordinator note below.";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar userId={user.id} name={fullName(a.givenName, a.surname)} hasPhoto={hasPhoto} size={72} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Applicant dashboard</p>
            <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">
              {fullName(a.givenName, a.surname)}
            </h1>
            <p className="text-[#5c564c]">
              {user.email} · {a.phone || "Add a phone number"} · {a.district?.name ?? "District not set"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/profile">Edit profile</Link>
        </Button>
      </div>

      {params.submitted ? (
        <Alert tone="success" title="Application received">
          Your HUEF application has been submitted successfully. You do not need to email it as well. Check this page and the Notification Centre for screening notes and the Coordinator’s decision.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-4">
            <ProgressBar value={completion} label="Application completion" />
            <ProgressBar value={profile.percent} label="Profile completion" />
            <Alert tone="info" title="What you should do next">
              {nextStep}
            </Alert>
            <p className="text-sm text-[#5c564c]">
              Important deadline: <strong>{APPLICATION_DEADLINE_LABEL}</strong> (or the date published by HUEF for this intake).
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unread notices</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            {user.notifications.length === 0 ? (
              <p className="text-[#6f675c]">No unread notices.</p>
            ) : (
              user.notifications.map((item) => (
                <div key={item.id}>
                  <p className="font-semibold text-[var(--huef-green-dark)]">{item.title}</p>
                  <p className="text-[#5c564c]">{item.message.slice(0, 120)}{item.message.length > 120 ? "…" : ""}</p>
                </div>
              ))
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/notifications">Open notification centre</Link>
            </Button>
          </CardBody>
        </Card>
      </div>

      {!application ? (
        <Card>
          <CardBody className="space-y-4">
            <p className="text-[#5c564c]">
              You have not started a 2026 HUEF application yet. The form can be saved as a draft on a phone and finished later.
            </p>
            <Button asChild>
              <Link href="/student/apply">Start application</Link>
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Current application · {ACADEMIC_YEAR} TFA</CardTitle>
                <Badge tone={statusTone(application.status)}>{STATUS_LABELS[application.status]}</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 text-sm">
              <Row label="Institution" value={`${application.institution.code} — ${application.institution.name}`} />
              <Row label="Programme" value={application.programName} />
              <Row label="Year of study" value={application.yearOfStudy} />
              <Row label="District / LLG" value={`${a.district?.name ?? "—"} / ${a.llg?.name ?? a.llgName ?? "—"}`} />
              <Row label="Submitted" value={formatDateTime(application.submittedAt)} />
              <Row
                label="Screening"
                value={
                  application.screeningStatus
                    ? SCREENING_STATUS_LABELS[application.screeningStatus as ScreeningStatus] ?? application.screeningStatus
                    : "Awaiting preliminary screening"
                }
              />
              {application.statusNote ? (
                <Alert tone={application.status === "REJECTED" ? "error" : "info"} title="Coordinator note">
                  {application.statusNote}
                </Alert>
              ) : null}
              {application.status === "DRAFT" || application.status === "MORE_INFO" ? (
                <Button asChild>
                  <Link href="/student/apply">
                    {application.status === "MORE_INFO" ? "Update application" : "Continue application"}
                  </Link>
                </Button>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required documents</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              {required.map((type) => {
                const uploaded = application.documents.find((doc) => doc.type === type);
                const finding = screening?.documents.find((item) => item.type === type);
                return (
                  <div key={type} className="rounded-md border border-[#eee6d6] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--huef-green-dark)]">
                        {documentLabel(type, documentTypes)}
                      </span>
                      <Badge tone={uploaded ? (finding && finding.status !== "PASSED_INITIAL" ? "amber" : "green") : "red"}>
                        {uploaded ? finding?.status ? SCREENING_STATUS_LABELS[finding.status] : "Uploaded" : "Missing"}
                      </Badge>
                    </div>
                    {uploaded ? (
                      <a href={`/api/files/${uploaded.id}`} className="mt-1 block text-xs text-[var(--huef-green)] underline">
                        {uploaded.originalName}
                      </a>
                    ) : null}
                    {finding && finding.status !== "PASSED_INITIAL" ? (
                      <p className="mt-1 text-xs text-[#6a5200]">{finding.reason}</p>
                    ) : null}
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {issueFlags.length ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Screening issues requiring correction</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {issueFlags.map((item) => (
                  <Alert key={item.type} tone="warning" title={item.title}>
                    {item.reason}
                  </Alert>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#f0eadc] pb-3 sm:flex-row sm:justify-between">
      <span className="text-[#7a7266]">{label}</span>
      <span className="font-medium text-[var(--huef-ink)] sm:max-w-[60%] sm:text-right">{value}</span>
    </div>
  );
}
