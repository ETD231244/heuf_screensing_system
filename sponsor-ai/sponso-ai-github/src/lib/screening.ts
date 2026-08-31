import { DOCUMENT_LABELS, FEE_CATEGORY_LABELS, HELA_DISTRICTS, requiredDocuments } from "./constants";
import { normalizeName } from "./utils";

export type ScreeningFlag = {
  severity: "pass" | "info" | "warning" | "fail";
  code: string;
  title: string;
  detail: string;
};

export type DuplicateMatch = {
  applicationId: string;
  applicantName: string;
  reason: string;
};

export type ScreeningResult = {
  score: number;
  recommendation: "RECOMMEND_APPROVE" | "NEEDS_REVIEW" | "RECOMMEND_REJECT";
  summary: string;
  flags: ScreeningFlag[];
  missingDocuments: string[];
  duplicates: DuplicateMatch[];
  runAt: string;
};

export type ScreenableApplication = {
  id: string;
  applicantType: string;
  eligibilityPath: string;
  feeCategory: string;
  publicServantYears?: number | null;
  programName?: string | null;
  yearOfStudy?: string | null;
  witnessName?: string | null;
  tuitionFees?: string | null;
  givenName: string;
  surname: string;
  phone: string;
  email: string;
  dateOfBirth?: string | null;
  districtName?: string | null;
  documentTypes: string[];
  others: Array<{
    id: string;
    givenName: string;
    surname: string;
    phone: string;
    email: string;
    dateOfBirth?: string | null;
  }>;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function runScreening(app: ScreenableApplication): ScreeningResult {
  const flags: ScreeningFlag[] = [];
  let score = 100;
  const required = requiredDocuments(app.applicantType, app.eligibilityPath);
  const missingDocuments = required.filter((type) => !app.documentTypes.includes(type));

  if (missingDocuments.length === 0) {
    flags.push({
      severity: "pass",
      code: "DOCS_COMPLETE",
      title: "Supporting documents complete",
      detail: `All ${required.length} required files are attached.`,
    });
  } else {
    score -= missingDocuments.length * 12;
    flags.push({
      severity: "fail",
      code: "DOCS_MISSING",
      title: "Missing required documents",
      detail: missingDocuments.map((type) => DOCUMENT_LABELS[type] ?? type).join("; "),
    });
  }

  const helaOrigin = app.eligibilityPath === "HELA_ORIGIN";
  const districtOk = Boolean(app.districtName && HELA_DISTRICTS.includes(app.districtName as (typeof HELA_DISTRICTS)[number]));

  if (helaOrigin && districtOk) {
    flags.push({
      severity: "pass",
      code: "HELA_DISTRICT",
      title: "Hela district recorded",
      detail: `Applicant origin district is ${app.districtName}.`,
    });
  } else if (helaOrigin && !districtOk) {
    score -= 20;
    flags.push({
      severity: "fail",
      code: "DISTRICT_MISSING",
      title: "Hela district not confirmed",
      detail: "Hela-origin applicants must name one of Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, or Magarima.",
    });
  }

  if (app.eligibilityPath !== "HELA_ORIGIN") {
    const years = app.publicServantYears ?? 0;
    if (years >= 3) {
      flags.push({
        severity: "pass",
        code: "PS_YEARS",
        title: "Public servant service period meets the rule",
        detail: `${years} years of service in Hela recorded (minimum is 3).`,
      });
    } else {
      score -= 25;
      flags.push({
        severity: "fail",
        code: "PS_YEARS_SHORT",
        title: "Public servant service under 3 years",
        detail: `Recorded service is ${years || 0} year(s). HUEF requires more than three years in Hela.`,
      });
    }
    if (!app.documentTypes.includes("SUPPORT_LETTER")) {
      flags.push({
        severity: "warning",
        code: "PS_SUPPORT",
        title: "Support letter not attached",
        detail: "Applicants who are not of Hela origin should attach a parent or supervisor support letter.",
      });
    }
  }

  if (app.feeCategory === "CORPORATE") {
    score -= 40;
    flags.push({
      severity: "fail",
      code: "DOUBLE_DIP",
      title: "Corporate sponsor declared",
      detail: "HUEF does not assist students who are already on a corporate sponsor. This is treated as double-dipping.",
    });
  } else {
    flags.push({
      severity: "pass",
      code: "FEE_CATEGORY",
      title: "Fee category is eligible",
      detail: FEE_CATEGORY_LABELS[app.feeCategory] ?? app.feeCategory,
    });
  }

  if (!app.programName?.trim() || !app.yearOfStudy?.trim()) {
    score -= 10;
    flags.push({
      severity: "fail",
      code: "STUDY_DETAILS",
      title: "Programme details incomplete",
      detail: "Programme name and year of study are required.",
    });
  }

  if (!app.witnessName?.trim()) {
    score -= 8;
    flags.push({
      severity: "warning",
      code: "WITNESS",
      title: "Community verification missing",
      detail: "A ward councillor, pastor, or community leader should be named on the declaration.",
    });
  } else {
    flags.push({
      severity: "pass",
      code: "WITNESS_OK",
      title: "Community witness named",
      detail: app.witnessName,
    });
  }

  if (!app.tuitionFees?.trim()) {
    score -= 5;
    flags.push({
      severity: "warning",
      code: "FEES",
      title: "Tuition amount not stated",
      detail: "The 2026 invoice / fee structure amount helps the Coordinator assess the request.",
    });
  }

  const duplicates: DuplicateMatch[] = [];
  const selfName = normalizeName(`${app.givenName} ${app.surname}`);
  const selfPhone = app.phone.replace(/\s+/g, "");

  for (const other of app.others) {
    if (other.email.toLowerCase() === app.email.toLowerCase()) {
      duplicates.push({
        applicationId: other.id,
        applicantName: `${other.givenName} ${other.surname}`,
        reason: "Same email address",
      });
      continue;
    }
    const otherName = normalizeName(`${other.givenName} ${other.surname}`);
    const sameDob = Boolean(app.dateOfBirth && other.dateOfBirth && app.dateOfBirth === other.dateOfBirth);
    if (otherName === selfName && sameDob) {
      duplicates.push({
        applicationId: other.id,
        applicantName: `${other.givenName} ${other.surname}`,
        reason: "Same full name and date of birth",
      });
    } else if (otherName === selfName) {
      duplicates.push({
        applicationId: other.id,
        applicantName: `${other.givenName} ${other.surname}`,
        reason: "Same full name",
      });
    } else if (selfPhone && other.phone.replace(/\s+/g, "") === selfPhone) {
      duplicates.push({
        applicationId: other.id,
        applicantName: `${other.givenName} ${other.surname}`,
        reason: "Same contact number",
      });
    }
  }

  if (duplicates.length) {
    score -= Math.min(25, duplicates.length * 12);
    flags.push({
      severity: "warning",
      code: "DUPLICATE",
      title: "Possible duplicate application",
      detail: duplicates
        .map((item) => `${item.applicantName} (${item.reason})`)
        .join("; "),
    });
  } else {
    flags.push({
      severity: "pass",
      code: "NO_DUPLICATE",
      title: "No obvious duplicate",
      detail: "Name, phone, and email do not match another 2026 application.",
    });
  }

  score = clamp(score);
  const hasFail = flags.some((flag) => flag.severity === "fail");
  const recommendation: ScreeningResult["recommendation"] = hasFail
    ? score < 50
      ? "RECOMMEND_REJECT"
      : "NEEDS_REVIEW"
    : duplicates.length
      ? "NEEDS_REVIEW"
      : score >= 80
        ? "RECOMMEND_APPROVE"
        : "NEEDS_REVIEW";

  const summary =
    recommendation === "RECOMMEND_APPROVE"
      ? "The file looks complete and eligible. A human officer should still read the documents before approving."
      : recommendation === "RECOMMEND_REJECT"
        ? "The screening rules found a serious eligibility or completeness problem. The Coordinator should confirm before rejecting."
        : "The file needs a person to look at it. Flags are shown below; the final decision stays with the Coordinator.";

  return {
    score,
    recommendation,
    summary,
    flags,
    missingDocuments,
    duplicates,
    runAt: new Date().toISOString(),
  };
}

export function recommendationLabel(value: ScreeningResult["recommendation"]) {
  switch (value) {
    case "RECOMMEND_APPROVE":
      return "Recommend approve";
    case "RECOMMEND_REJECT":
      return "Recommend reject";
    default:
      return "Needs officer review";
  }
}
