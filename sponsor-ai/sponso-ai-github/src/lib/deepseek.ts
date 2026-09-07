import { createDeepSeek } from "@ai-sdk/deepseek";
import { extractJsonMiddleware, generateText, Output, wrapLanguageModel } from "ai";
import { z } from "zod";
import { prisma } from "./prisma";
import {
  DOCUMENT_LABELS,
  ELIGIBILITY_LABELS,
  DEFAULT_DEEPSEEK_MODEL,
  SCREENING_STATUSES,
  SCREENING_STATUS_LABELS,
  STATUS_LABELS,
  type ScreeningStatus,
} from "./constants";
import type { DeepSeekScreening, ScreeningFlag, ScreeningResult } from "./screening";

export const DEEPSEEK_KEY_SETTING = "deepseek_api_key";
export const DEEPSEEK_MODEL_SETTING = "deepseek_model";
export { DEFAULT_DEEPSEEK_MODEL } from "./constants";

const STATUS_RANK: Record<string, number> = {
  PASSED_INITIAL: 0,
  NEEDS_REVIEW: 1,
  UNABLE_TO_DETERMINE: 2,
  INFORMATION_MISMATCH: 3,
  POTENTIAL_DUPLICATE: 4,
  MISSING_REQUIRED: 5,
  UNREADABLE_DOCUMENT: 6,
  INCORRECT_DOCUMENT: 7,
};

const deepSeekOutputSchema = z.object({
  overallStatus: z.enum(SCREENING_STATUSES),
  recommendation: z.enum(["RECOMMEND_APPROVE", "NEEDS_REVIEW", "RECOMMEND_REJECT"]),
  summary: z.string(),
  coordinatorBrief: z.string(),
  remainingChecks: z.array(z.string()),
  draftApplicantNote: z.string(),
  suggestedDecision: z.enum(["PENDING", "MORE_INFO", "APPROVED", "REJECTED"]),
  flags: z.array(
    z.object({
      severity: z.enum(["pass", "info", "warning", "fail"]),
      title: z.string(),
      detail: z.string(),
    }),
  ),
});

export type DeepSeekScreeningInput = {
  applicantName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  district?: string | null;
  llg?: string | null;
  clan?: string | null;
  village?: string | null;
  eligibilityPath: string;
  publicServantYears?: number | null;
  applicantType: string;
  programName: string;
  yearOfStudy: string;
  institutionName: string;
  feeCategory: string;
  tuitionFees?: string | null;
  witnessName?: string | null;
  documents: Array<{
    type: string;
    originalName: string;
    status: string;
    reason: string;
    extractedText: string;
  }>;
  rules: ScreeningResult;
};

export async function getDeepSeekApiKey() {
  const fromEnv = process.env.DEEPSEEK_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const row = await prisma.systemSetting.findUnique({ where: { key: DEEPSEEK_KEY_SETTING } });
  return row?.value?.trim() || null;
}

export async function getDeepSeekModel() {
  const fromEnv = process.env.DEEPSEEK_MODEL?.trim();
  if (fromEnv) return fromEnv;
  const row = await prisma.systemSetting.findUnique({ where: { key: DEEPSEEK_MODEL_SETTING } });
  const value = row?.value?.trim();
  return value || DEFAULT_DEEPSEEK_MODEL;
}

export async function isDeepSeekConfigured() {
  return Boolean(await getDeepSeekApiKey());
}

export function suggestedDecisionLabel(value?: string | null) {
  if (!value) return "Keep pending";
  if (value === "MORE_INFO") return "Ask the applicant for more information";
  if (value === "APPROVED") return "Ready for officer approval";
  if (value === "REJECTED") return "Officer should consider rejecting";
  return STATUS_LABELS[value] ?? value;
}

export function worseStatus(a: ScreeningStatus, b: ScreeningStatus): ScreeningStatus {
  return (STATUS_RANK[b] ?? 0) > (STATUS_RANK[a] ?? 0) ? b : a;
}

export async function runDeepSeekScreening(
  input: DeepSeekScreeningInput,
): Promise<{ briefing: DeepSeekScreening; raw?: z.infer<typeof deepSeekOutputSchema> }> {
  const apiKey = await getDeepSeekApiKey();
  const modelId = await getDeepSeekModel();
  if (!apiKey) {
    return {
      briefing: {
        used: false,
        configured: false,
        model: modelId,
        error: "DeepSeek is not configured. An administrator can add the API key under Settings.",
      },
    };
  }

  const deepSeek = createDeepSeek({ apiKey });
  const documentBlock = input.documents
    .map((doc) => {
      const label = DOCUMENT_LABELS[doc.type] ?? doc.type;
      const text = doc.extractedText.replace(/\s+/g, " ").trim().slice(0, 2500) || "(no readable text — likely a scan or photo)";
      return `### ${label} (${doc.originalName})
Heuristic status: ${SCREENING_STATUS_LABELS[doc.status as ScreeningStatus] ?? doc.status}
Heuristic note: ${doc.reason}
Extracted text:
${text}`;
    })
    .join("\n\n");

  const prompt = `You are the HUEF (Hela Undialu Education Foundation) screening assistant for 2026 Tuition Fee Assistance applications in Papua New Guinea.

You help the Sponsorship Coordinator. You do not award or refuse the scholarship. The coordinator always makes the official decision after reading the original documents.

HUEF rules to apply:
- Applicants must be of Hela origin by blood and custom, or a public servant (or child of one) who has served in Hela for 3+ years.
- Hela districts are Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, and Magarima.
- Required documents depend on new intake vs continuing, and on eligibility path.
- Names, programme, institution, and year of study on letters should match the form.
- Unreadable scans, wrong document types, missing files, and possible duplicates must be flagged for a person.
- Seeded demo PDFs are often unreadable — say so plainly and tell the coordinator to open the file.

Application facts:
- Name: ${input.applicantName}
- Email / phone: ${input.email} / ${input.phone}
- DOB / gender: ${input.dateOfBirth ?? "—"} / ${input.gender ?? "—"}
- Origin: ${input.district ?? "—"} · ${input.llg ?? "—"} · clan ${input.clan ?? "—"} · ${input.village ?? "—"}
- Eligibility: ${ELIGIBILITY_LABELS[input.eligibilityPath] ?? input.eligibilityPath}
- Public servant years: ${input.publicServantYears ?? "n/a"}
- Type: ${input.applicantType === "CONTINUING" ? "Continuing student" : "New intake"}
- Institution / programme / year: ${input.institutionName} · ${input.programName} · ${input.yearOfStudy}
- Fee category / tuition: ${input.feeCategory} · K ${input.tuitionFees ?? "not stated"}
- Witness: ${input.witnessName ?? "—"}

Rule-based engine result (always keep this in mind, do not ignore mechanical failures):
- Status: ${SCREENING_STATUS_LABELS[input.rules.overallStatus]}
- Recommendation: ${input.rules.recommendation}
- Completeness score: ${input.rules.score}/100
- Missing documents: ${input.rules.missingDocuments.map((type) => DOCUMENT_LABELS[type] ?? type).join("; ") || "none"}
- Flags: ${input.rules.flags.map((flag) => `${flag.severity}: ${flag.title} — ${flag.detail}`).join(" | ")}

Documents:
${documentBlock || "No documents were attached."}

Write a practical briefing a busy Hela coordinator can use in under a minute.
- coordinatorBrief: 3–6 short sentences in plain English. Name what to look at first.
- remainingChecks: concrete visual checks still needed (open the PDF, confirm the face photo, compare names, etc.).
- draftApplicantNote: a polite note the coordinator can send if more information is needed, or a short confirmation if the file looks complete. Do not pretend the award has been made.
- suggestedDecision: PENDING, MORE_INFO, APPROVED, or REJECTED as a recommendation only.
- If readable text is missing, do not claim the document is correct. Flag it as unreadable and ask the coordinator to open it.
- overallStatus must be one of: ${SCREENING_STATUSES.join(", ")}.`;

  try {
    const { output } = await generateText({
      model: wrapLanguageModel({
        model: deepSeek(modelId),
        middleware: extractJsonMiddleware(),
      }),
      output: Output.object({ schema: deepSeekOutputSchema }),
      abortSignal: AbortSignal.timeout(45000),
      providerOptions: {
        deepseek: {
          thinking: { type: "disabled" },
          userId: "huef-screening",
        },
      },
      prompt,
    });

    if (!output) {
      return {
        briefing: {
          used: false,
          configured: true,
          model: modelId,
          error: "DeepSeek returned an empty screening brief. The rule-based checks are still shown.",
        },
      };
    }

    return {
      briefing: {
        used: true,
        configured: true,
        model: modelId,
        ranAt: new Date().toISOString(),
        brief: output.coordinatorBrief,
        remainingChecks: output.remainingChecks,
        draftApplicantNote: output.draftApplicantNote,
        suggestedDecision: output.suggestedDecision,
        suggestedDecisionLabel: suggestedDecisionLabel(output.suggestedDecision),
      },
      raw: output,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "DeepSeek could not complete this screening.";
    return {
      briefing: {
        used: false,
        configured: true,
        model: modelId,
        error: message.slice(0, 280),
      },
    };
  }
}

export function mergeDeepSeekResult(
  rules: ScreeningResult,
  briefing: DeepSeekScreening,
  raw?: z.infer<typeof deepSeekOutputSchema>,
): ScreeningResult {
  const extraFlags: ScreeningFlag[] = (raw?.flags ?? []).map((flag, index) => ({
    severity: flag.severity,
    code: `DEEPSEEK_${index + 1}`,
    title: flag.title,
    detail: flag.detail,
  }));

  let overallStatus = rules.overallStatus;
  let recommendation = rules.recommendation;
  let summary = rules.summary;

  if (raw) {
    overallStatus = worseStatus(rules.overallStatus, raw.overallStatus);
    recommendation =
      rules.recommendation === "RECOMMEND_REJECT" || raw.recommendation === "RECOMMEND_REJECT"
        ? "RECOMMEND_REJECT"
        : rules.recommendation === "NEEDS_REVIEW" || raw.recommendation === "NEEDS_REVIEW"
          ? "NEEDS_REVIEW"
          : "RECOMMEND_APPROVE";
    summary = raw.summary || rules.summary;
  }

  return {
    ...rules,
    overallStatus,
    recommendation,
    summary,
    flags: [...rules.flags, ...extraFlags],
    deepseek: briefing,
    version: briefing.used ? "HUEF DeepSeek Screening v3" : rules.version,
  };
}
