import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, CardBody, CardHeader, CardTitle, statusTone } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACADEMIC_YEAR, DOCUMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, fullName } from "@/lib/utils";

export default async function StudentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await requireStudent();
  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      applicant: {
        include: {
          district: true,
          applications: {
            where: { academicYear: ACADEMIC_YEAR },
            include: { institution: true, documents: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
  if (!user?.applicant) redirect("/student/apply");
  const application = user.applicant.applications[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Student portal</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">
          {fullName(user.applicant.givenName, user.applicant.surname)}
        </h1>
        <p className="text-[#5c564c]">{user.email} · {user.applicant.phone}</p>
      </div>

      {params.submitted ? (
        <div className="rounded-lg border border-[#b7dcc6] bg-[#eef7f1] px-4 py-3 text-sm text-[var(--huef-green-dark)]">
          Your 2026 application has been received. You do not need to email it as well. Check this page any time for the status.
        </div>
      ) : null}

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
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>2026 Tuition Fee Assistance</CardTitle>
                <Badge tone={statusTone(application.status)}>{STATUS_LABELS[application.status]}</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 text-sm">
              <Row label="Institution" value={`${application.institution.code} — ${application.institution.name}`} />
              <Row label="Programme" value={application.programName} />
              <Row label="Year of study" value={application.yearOfStudy} />
              <Row label="District" value={user.applicant.district?.name ?? "Not recorded"} />
              <Row label="Submitted" value={formatDateTime(application.submittedAt)} />
              <Row label="Documents attached" value={`${application.documents.length} file(s)`} />
              {application.statusNote ? (
                <div className="rounded-md bg-[var(--huef-cream)] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7266]">Coordinator note</p>
                  <p>{application.statusNote}</p>
                </div>
              ) : null}
              {application.status === "DRAFT" ? (
                <Button asChild>
                  <Link href="/student/apply">Continue application</Link>
                </Button>
              ) : null}
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status trail</CardTitle>
            </CardHeader>
            <CardBody>
              <ol className="space-y-4">
                <Step done title="Account created" detail="You can sign in on a phone browser." />
                <Step
                  done={application.status !== "DRAFT"}
                  current={application.status === "DRAFT"}
                  title="Application submitted"
                  detail={
                    application.status === "DRAFT"
                      ? "Finish the form and attach every required document."
                      : formatDateTime(application.submittedAt)
                  }
                />
                <Step
                  done={application.status === "APPROVED" || application.status === "REJECTED"}
                  current={application.status === "PENDING"}
                  title="Coordinator review"
                  detail="The office in Tari opens the file, reads the documents, and records a decision."
                />
                <Step
                  done={application.status === "APPROVED"}
                  current={application.status === "REJECTED"}
                  title="Decision visible here"
                  detail={
                    application.status === "APPROVED"
                      ? "Approved. Keep your student ID and fee invoice; the Foundation will process TFA against the institution account."
                      : application.status === "REJECTED"
                        ? "This application was not successful. The note above explains why, if one was recorded."
                        : "You will see Approved or Not successful on this page. You do not need to phone the office to ask whether the email arrived."
                  }
                />
              </ol>
            </CardBody>
          </Card>
          {application.documents.length ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Your uploaded files</CardTitle>
              </CardHeader>
              <CardBody className="grid gap-2 sm:grid-cols-2">
                {application.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/api/files/${doc.id}`}
                    className="rounded-md border border-[#e0d8c8] px-3 py-2 text-sm hover:bg-[var(--huef-cream)]"
                  >
                    <span className="font-semibold text-[var(--huef-green-dark)]">
                      {DOCUMENT_LABELS[doc.type] ?? doc.type}
                    </span>
                    <span className="mt-0.5 block text-[#6f675c]">{doc.originalName}</span>
                  </a>
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
      <span className="font-medium text-[var(--huef-ink)] sm:text-right">{value}</span>
    </div>
  );
}

function Step({
  title,
  detail,
  done,
  current,
}: {
  title: string;
  detail: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
          done ? "bg-[var(--huef-green)]" : current ? "bg-[var(--huef-gold)]" : "bg-[#d9d1c2]"
        }`}
      />
      <div>
        <p className="font-semibold text-[var(--huef-green-dark)]">{title}</p>
        <p className="text-sm text-[#5c564c]">{detail}</p>
      </div>
    </li>
  );
}
