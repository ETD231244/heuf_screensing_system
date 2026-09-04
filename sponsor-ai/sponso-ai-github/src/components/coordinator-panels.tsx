"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideApplication, overrideScreening, rerunScreening } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { overallStatusLabel, recommendationLabel, type ScreeningResult } from "@/lib/screening";
import { Badge } from "@/components/ui/card";
import { SCREENING_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export function DecisionForm({
  applicationId,
  currentStatus,
  currentNote,
}: {
  applicationId: string;
  currentStatus: string;
  currentNote?: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(currentNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setStatus(status: string) {
    setError(null);
    const data = new FormData();
    data.set("applicationId", applicationId);
    data.set("status", status);
    data.set("statusNote", note);
    startTransition(async () => {
      const result = await decideApplication(data);
      if (result && "error" in result) {
        setError(result.error ?? "Could not update the status.");
        return;
      }
      setMessage(result?.message ?? "Status updated and the applicant has been notified.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a decision</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-[#5c564c]">
          The screening assistant can flag problems. Only a HUEF official can approve, reject, request more information, or keep this file pending.
        </p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note the student will see (for example, which document to replace, or why the application was unsuccessful)."
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => setStatus("PENDING")}>
            Keep pending
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => setStatus("MORE_INFO")}>
            Request more information
          </Button>
          <Button type="button" disabled={pending || currentStatus === "APPROVED"} onClick={() => setStatus("APPROVED")}>
            Approve
          </Button>
          <Button type="button" variant="danger" disabled={pending} onClick={() => setStatus("REJECTED")}>
            Reject
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function ScreeningPanel({
  applicationId,
  result,
}: {
  applicationId: string;
  result: ScreeningResult | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [override, setOverride] = useState("NEEDS_REVIEW");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const tone =
    result?.overallStatus === "PASSED_INITIAL"
      ? "green"
      : result?.recommendation === "RECOMMEND_REJECT"
        ? "red"
        : "amber";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>AI screening results</CardTitle>
          <p className="mt-1 text-sm text-[#6f675c]">
            Assistive checks only. AI must not make the scholarship award. Record your own decision below.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await rerunScreening(applicationId);
              router.refresh();
            })
          }
        >
          Re-run checks
        </Button>
      </CardHeader>
      <CardBody className="space-y-4">
        {!result ? (
          <p className="text-sm text-[#6f675c]">No screening result yet. Run the checks to generate one.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-[var(--huef-cream)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7266]">Completeness score</p>
                <p className="text-2xl font-extrabold text-[var(--huef-green-dark)]">{result.score}/100</p>
              </div>
              <Badge tone={tone}>{overallStatusLabel(result.overallStatus)}</Badge>
              <Badge tone="neutral">{recommendationLabel(result.recommendation)}</Badge>
            </div>
            <p className="text-xs text-[#6f675c]">
              The completeness score is a rule-based hint (documents, eligibility, duplicates). It is not a grade and does not approve or reject the student.
            </p>
            <p className="text-sm leading-6 text-[#3f3a34]">{result.summary}</p>
            {result.documents?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--huef-green)]">Document flags</p>
                {result.documents.map((doc) => (
                  <div key={doc.type} className="rounded-md border border-[#e0d8c8] px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{doc.title}</p>
                      <Badge tone={doc.status === "PASSED_INITIAL" ? "green" : "amber"}>
                        {SCREENING_STATUS_LABELS[doc.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[#5c564c]">{doc.reason}</p>
                    {doc.confidence != null ? (
                      <p className="mt-1 text-xs text-[#6f675c]">
                        Confidence {doc.confidence}% — {doc.confidenceExplained}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            <ul className="space-y-2">
              {result.flags.map((flag) => (
                <li
                  key={flag.code}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    flag.severity === "fail"
                      ? "border-[#f1b7c0] bg-[#fde8eb]"
                      : flag.severity === "warning"
                        ? "border-[#ffe08a] bg-[#fff8dc]"
                        : flag.severity === "pass"
                          ? "border-[#b7dcc6] bg-[#eef7f1]"
                          : "border-[#e0d8c8] bg-white"
                  }`}
                >
                  <p className="font-semibold">{flag.title}</p>
                  <p className="text-[#5c564c]">{flag.detail}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 rounded-lg bg-[var(--huef-cream)] p-3">
              <p className="text-sm font-semibold text-[var(--huef-green-dark)]">Coordinator override</p>
              <Select value={override} onChange={(e) => setOverride(e.target.value)}>
                {Object.entries(SCREENING_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for overriding the AI recommendation (kept in the screening history)."
              />
              {error ? <Alert tone="error">{error}</Alert> : null}
              {message ? <Alert tone="success">{message}</Alert> : null}
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  const data = new FormData();
                  data.set("applicationId", applicationId);
                  data.set("override", override);
                  data.set("reason", reason);
                  startTransition(async () => {
                    const result = await overrideScreening(data);
                    if (result && "error" in result) {
                      setError(result.error ?? "Could not record the override.");
                      return;
                    }
                    setMessage(result?.message ?? "Override recorded.");
                    router.refresh();
                  });
                }}
              >
                Record override
              </Button>
            </div>
            <p className="text-xs text-[#6f675c]">Last run {formatDateTime(result.runAt)} · {result.version}</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
