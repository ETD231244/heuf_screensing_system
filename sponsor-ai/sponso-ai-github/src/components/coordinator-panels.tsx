"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideApplication, rerunScreening } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { recommendationLabel, type ScreeningResult } from "@/lib/screening";
import { Badge } from "@/components/ui/card";

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
          The screening assistant can flag problems. Only you can approve, reject, or keep this file pending.
        </p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note the student will see (for example, why the application was unsuccessful)."
        />
        {error ? <p className="text-sm text-[var(--huef-red)]">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => setStatus("PENDING")}>
            Keep pending
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

  const tone =
    result?.recommendation === "RECOMMEND_APPROVE"
      ? "green"
      : result?.recommendation === "RECOMMEND_REJECT"
        ? "red"
        : "amber";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Screening assistant</CardTitle>
          <p className="mt-1 text-sm text-[#6f675c]">
            Checks completeness, eligibility rules, and possible duplicates. It does not make the award.
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
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7266]">Score</p>
                <p className="text-2xl font-extrabold text-[var(--huef-green-dark)]">{result.score}/100</p>
              </div>
              <Badge tone={tone}>{recommendationLabel(result.recommendation)}</Badge>
            </div>
            <p className="text-sm leading-6 text-[#3f3a34]">{result.summary}</p>
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
          </>
        )}
      </CardBody>
    </Card>
  );
}
