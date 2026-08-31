import type { Applicant, Application, District, Document, Institution, User } from "@prisma/client";
import type { ScreeningResult } from "./screening";

export type ApplicationWithRelations = Application & {
  applicant: Applicant & { user: User; district: District | null };
  institution: Institution;
  documents: Document[];
};

export function parseScreening(json?: string | null): ScreeningResult | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as ScreeningResult;
  } catch {
    return null;
  }
}
