"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideApplication, overrideScreening, rerunScreening, screenNextPendingWithDeepSeek } from "@/app/actions";
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

  useEffect(() => {
    function onDraft(event: Event) {
      const text = (event as CustomEvent<string>).detail;
      if (typeof text === "string" && text.trim()) setNote(text);
    }
    window.addEventListener("huef-use-draft-note", onDraft);
    return () => window.removeEventListener("huef-use-draft-note", onDraft);
  }, []);

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
          DeepSeek prepares a briefing and can draft the student note. Only a HUEF official can approve, reject, request more information, or keep this file pending.
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
  deepSeekReady,
}: {
  applicationId: string;
  result: ScreeningResult | null;
  deepSeekReady: boolean;
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
          <CardTitle>DeepSeek screening</CardTitle>
          <p className="mt-1 text-sm text-[#6f675c]">
            DeepSeek reads the form and document text, then briefs you. You still open the files and record the award.
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
          {deepSeekReady ? "Ask DeepSeek to screen" : "Re-run rule checks"}
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
            <DeepSeekBrief result={result} deepSeekReady={deepSeekReady} />
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

function DeepSeekBrief({
  result,
  deepSeekReady,
}: {
  result: ScreeningResult;
  deepSeekReady: boolean;
}) {
  const ds = result.deepseek;
  if (!deepSeekReady && !ds?.used) {
    return (
      <Alert tone="warning">
        DeepSeek is not configured. An administrator can paste a DeepSeek API key under Settings. Rule-based checks still run so coordinators are not blocked.
      </Alert>
    );
  }
  if (ds?.error && !ds.used) {
    return <Alert tone="warning">{ds.error}</Alert>;
  }
  if (!ds?.used) {
    return (
      <Alert tone="info">
        Rule checks are ready. Click <strong>Ask DeepSeek to screen</strong> to generate a coordinator briefing, remaining checks, and a draft note for the applicant.
      </Alert>
    );
  }
  return (
    <div className="space-y-3 rounded-lg border border-[#cfe3d6] bg-[#f4fbf6] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--huef-green-dark)]">DeepSeek briefing</p>
        <Badge tone="green">{ds.model}</Badge>
      </div>
      <p className="text-sm leading-6 text-[#3f3a34]">{ds.brief}</p>
      {ds.suggestedDecisionLabel ? (
        <p className="text-sm">
          <span className="font-semibold">Suggested next step: </span>
          {ds.suggestedDecisionLabel}
          <span className="text-[#6f675c]"> — you still record the official decision.</span>
        </p>
      ) : null}
      {ds.remainingChecks?.length ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--huef-green)]">Still check by eye</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-[#3f3a34]">
            {ds.remainingChecks.map((item, index) => (
              <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {ds.draftApplicantNote ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--huef-green)]">Draft note for the applicant</p>
          <p className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-[#3f3a34]">{ds.draftApplicantNote}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent("huef-use-draft-note", { detail: ds.draftApplicantNote }))}
          >
            Use this note in the decision box
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function DeepSeekDeskActions({ ready }: { ready: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-[var(--huef-green-dark)]">DeepSeek screening desk</p>
          <p className="text-sm text-[#5c564c]">
            {ready
              ? "Screen the oldest pending file with DeepSeek. It drafts the briefing so you only confirm the documents and record the decision."
              : "Add a DeepSeek API key in Admin → Settings to let the model brief each pending file."}
          </p>
          {error ? <Alert tone="error" className="mt-2">{error}</Alert> : null}
          {message ? <Alert tone="success" className="mt-2">{message}</Alert> : null}
        </div>
        <Button
          type="button"
          disabled={pending || !ready}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await screenNextPendingWithDeepSeek();
              if (result && "error" in result) {
                setError(result.error ?? "DeepSeek could not screen the next file.");
                return;
              }
              setMessage(result?.message ?? "DeepSeek finished.");
              if (result && "applicationId" in result && result.applicationId) {
                router.push(`/coordinator/applications/${result.applicationId}`);
                return;
              }
              router.refresh();
            })
          }
        >
          {pending ? "DeepSeek is reading…" : "Screen next pending file"}
        </Button>
      </CardBody>
    </Card>
  );
}
