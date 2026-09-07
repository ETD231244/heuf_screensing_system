import type { Applicant, Application, District, Document, Institution, Llg, User } from "@prisma/client";
import type { ScreeningResult } from "./screening";

export type ApplicationWithRelations = Application & {
  applicant: Applicant & { user: User; district: District | null; llg?: Llg | null };
  institution: Institution;
  documents: Document[];
};

export function parseScreening(json?: string | null): ScreeningResult | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ScreeningResult;
    return {
      score: parsed.score ?? 0,
      recommendation: parsed.recommendation ?? "NEEDS_REVIEW",
      overallStatus: parsed.overallStatus ?? (parsed.recommendation === "RECOMMEND_APPROVE" ? "PASSED_INITIAL" : "NEEDS_REVIEW"),
      summary: parsed.summary ?? "",
      flags: parsed.flags ?? [],
      missingDocuments: parsed.missingDocuments ?? [],
      duplicates: parsed.duplicates ?? [],
      documents: parsed.documents ?? [],
      runAt: parsed.runAt ?? new Date().toISOString(),
      version: parsed.version ?? "HUEF AI Screening Engine v1",
      deepseek: parsed.deepseek ?? null,
    };
  } catch {
    return null;
  }
}
