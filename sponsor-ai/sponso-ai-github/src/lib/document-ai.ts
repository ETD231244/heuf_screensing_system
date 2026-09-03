import { DOCUMENT_LABELS } from "./constants";
import { normalizeName } from "./utils";
import type { ScreeningStatus } from "./constants";

export type DocumentScreening = {
  status: ScreeningStatus;
  title: string;
  reason: string;
  confidence: number | null;
  confidenceExplained: string | null;
  detectedType: string | null;
  extractedHints: string[];
  issues: string[];
};

const TYPE_KEYWORDS: Record<string, string[]> = {
  TRANSCRIPT: [
    "transcript",
    "academic record",
    "grade point",
    "gpa",
    "semester",
    "credit",
    "course code",
    "units",
    "results slip",
  ],
  ACCEPTANCE_LETTER: [
    "offer",
    "acceptance",
    "admitted",
    "enrolment",
    "enrollment",
    "congratulations",
    "place has been offered",
    "offer letter",
  ],
  CONFIRMATION_LETTER: [
    "confirmation",
    "currently enrolled",
    "continuing student",
    "year of study",
    "re-enrol",
    "re-enroll",
  ],
  GRADE_10: ["grade 10", "grade ten", "year 10", "certificate of basic education", "lower secondary"],
  GRADE_12: [
    "grade 12",
    "grade twelve",
    "year 12",
    "higher school certificate",
    "matriculation",
    "national high",
  ],
  FEE_STRUCTURE: [
    "fee structure",
    "invoice",
    "tuition",
    "amount due",
    "school fees",
    "pgk",
    "kina",
    "account number",
    "fee schedule",
  ],
  STUDENT_ID: ["student identification", "student id", "id card", "student number", "valid until"],
  SUPPORT_LETTER: [
    "support letter",
    "to whom it may concern",
    "public servant",
    "recommend",
    "department of",
    "supervisor",
  ],
  PASSPORT_PHOTO: ["passport photo", "photograph"],
};

function decodePdfString(value: string) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

export function extractPdfText(bytes: Buffer) {
  const raw = bytes.toString("latin1");
  const chunks: string[] = [];
  const paren = [...raw.matchAll(/\((?:\\.|[^\\)]){4,200}\)/g)];
  for (const match of paren) {
    const inner = match[0].slice(1, -1);
    const decoded = decodePdfString(inner);
    if (/[A-Za-z]{3,}/.test(decoded)) chunks.push(decoded);
  }
  const hex = [...raw.matchAll(/<([0-9A-Fa-f\s]{8,})>/g)].slice(0, 40);
  for (const match of hex) {
    try {
      const text = Buffer.from(match[1].replace(/\s+/g, ""), "hex").toString("utf8");
      if (/[A-Za-z]{4,}/.test(text)) chunks.push(text);
    } catch {
      /* ignore */
    }
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim().slice(0, 8000);
}

export function estimatePdfPages(bytes: Buffer) {
  const matches = bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g);
  return matches?.length || null;
}

function scoreKeywords(text: string, keywords: string[]) {
  const hay = text.toLowerCase();
  let hits = 0;
  for (const word of keywords) {
    if (hay.includes(word)) hits += 1;
  }
  return hits;
}

function guessType(text: string) {
  let best: { type: string; hits: number } | null = null;
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    const hits = scoreKeywords(text, keywords);
    if (!best || hits > best.hits) best = { type, hits };
  }
  if (!best || best.hits === 0) return null;
  return best;
}

function nameOverlap(applicantName: string, text: string) {
  const parts = normalizeName(applicantName)
    .split(" ")
    .filter((part) => part.length > 2);
  if (!parts.length || !text) return { matched: 0, total: parts.length };
  const hay = normalizeName(text);
  const matched = parts.filter((part) => hay.includes(part)).length;
  return { matched, total: parts.length };
}

export function screenUploadedDocument(options: {
  requiredType: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  kind: "pdf" | "jpeg" | "png" | "webp" | "unknown";
  extractedText: string;
  pageEstimate: number | null;
  applicantName: string;
  programName?: string | null;
  institutionName?: string | null;
  duplicateOf?: { applicantName: string; documentType: string } | null;
}): DocumentScreening {
  const label = DOCUMENT_LABELS[options.requiredType] ?? options.requiredType;
  const issues: string[] = [];
  const hints: string[] = [];
  const text = options.extractedText;
  const fileName = options.originalName.toLowerCase();

  if (options.duplicateOf) {
    return {
      status: "POTENTIAL_DUPLICATE",
      title: "Potential duplicate document",
      reason: `This file appears identical to a document already on file for ${options.duplicateOf.applicantName} (${DOCUMENT_LABELS[options.duplicateOf.documentType] ?? options.duplicateOf.documentType}). A coordinator should confirm whether this is a reused scan.`,
      confidence: 92,
      confidenceExplained:
        "Confidence reflects a cryptographic match of the file contents, not a judgment about eligibility.",
      detectedType: options.requiredType,
      extractedHints: [],
      issues: ["Identical file contents found on another application."],
    };
  }

  if (options.kind === "unknown") {
    return {
      status: "UNREADABLE_DOCUMENT",
      title: "Unreadable or unsupported file",
      reason: `The uploaded file for ${label} could not be opened as a PDF or image. Please replace it with a clear scan or photograph.`,
      confidence: null,
      confidenceExplained: null,
      detectedType: null,
      extractedHints: [],
      issues: ["File signature is not a recognised PDF or image."],
    };
  }

  if (options.sizeBytes < 1500) {
    return {
      status: "UNREADABLE_DOCUMENT",
      title: "Document appears incomplete",
      reason: `The ${label} file is unusually small (${options.sizeBytes} bytes) and is unlikely to be a complete document. Please upload the full file.`,
      confidence: null,
      confidenceExplained: null,
      detectedType: null,
      extractedHints: [],
      issues: ["File size is too small for a complete document."],
    };
  }

  const guessed = text ? guessType(text) : fileName.includes("transcript")
    ? { type: "TRANSCRIPT", hits: 1 }
    : fileName.includes("invoice") || fileName.includes("fee")
      ? { type: "FEE_STRUCTURE", hits: 1 }
      : fileName.includes("offer") || fileName.includes("acceptance")
        ? { type: "ACCEPTANCE_LETTER", hits: 1 }
        : null;

  if (guessed?.type) {
    hints.push(`Readable content most closely resembles: ${DOCUMENT_LABELS[guessed.type] ?? guessed.type}.`);
  }

  if (options.kind !== "pdf" && !["PASSPORT_PHOTO", "STUDENT_ID"].includes(options.requiredType)) {
    issues.push(
      "This is an image rather than a searchable PDF. The screening assistant cannot read printed text from photographs, so a coordinator should confirm the document.",
    );
    if (guessed && guessed.type !== options.requiredType && guessed.hits >= 2) {
      return {
        status: "INCORRECT_DOCUMENT",
        title: "File may not match the required document",
        reason: `HUEF asked for a ${label}, but the file name or readable labels look more like a ${DOCUMENT_LABELS[guessed.type] ?? guessed.type}. Please upload the correct document.`,
        confidence: Math.min(90, 50 + guessed.hits * 12),
        confidenceExplained:
          "Confidence is based on how many typical keywords for another document type appear. It is a screening hint, not a final decision.",
        detectedType: guessed.type,
        extractedHints: hints,
        issues,
      };
    }
    return {
      status: "UNABLE_TO_DETERMINE",
      title: "AI unable to read this photograph",
      reason: `A ${label} was uploaded as an image. The assistant cannot reliably extract printed text from photos. A HUEF coordinator should open the file and confirm it is complete and correct.`,
      confidence: 35,
      confidenceExplained:
        "Low confidence because the file is an image. The score only means the assistant could not read the page, not that the applicant failed.",
      detectedType: null,
      extractedHints: hints,
      issues,
    };
  }

  if (options.requiredType === "PASSPORT_PHOTO") {
    if (options.kind === "pdf") {
      return {
        status: "NEEDS_REVIEW",
        title: "Photograph uploaded as a PDF",
        reason:
          "A passport-size photo was uploaded as a PDF. This can be accepted, but a coordinator should confirm that a clear face photograph is on the first page.",
        confidence: 55,
        confidenceExplained: "Medium confidence because the file type is unusual for a portrait photograph.",
        detectedType: "PASSPORT_PHOTO",
        extractedHints: hints,
        issues,
      };
    }
    return {
      status: "PASSED_INITIAL",
      title: "Photograph accepted for initial screening",
      reason:
        "The file is a valid image of a reasonable size. A coordinator should still confirm it is a recent passport-style photograph of the applicant.",
      confidence: 70,
      confidenceExplained:
        "This score means the file is a genuine image, not that facial recognition was used. HUEF does not automatically identify faces.",
      detectedType: "PASSPORT_PHOTO",
      extractedHints: hints,
      issues,
    };
  }

  if (options.kind === "pdf" && !text) {
    const pages = options.pageEstimate;
    if (pages === 0) {
      issues.push("The PDF does not appear to contain any pages.");
      return {
        status: "UNREADABLE_DOCUMENT",
        title: "PDF has no readable pages",
        reason: `The ${label} file could not be read. It may be corrupted. Please export or scan the document again.`,
        confidence: null,
        confidenceExplained: null,
        detectedType: null,
        extractedHints: hints,
        issues,
      };
    }
    if (pages === 1 && options.requiredType === "TRANSCRIPT") {
      issues.push("A transcript often has more than one page. This file may be incomplete.");
    }
    return {
      status: "UNABLE_TO_DETERMINE",
      title: "Scanned document — coordinator should read it",
      reason: `The ${label} PDF appears to be a scan without selectable text. The assistant cannot check names or document type automatically. A coordinator should open the file.`,
      confidence: 40,
      confidenceExplained:
        "This score only means text could not be extracted. It is not a fail mark.",
      detectedType: null,
      extractedHints: hints,
      issues,
    };
  }

  if (guessed && guessed.type !== options.requiredType && guessed.hits >= 2) {
    return {
      status: "INCORRECT_DOCUMENT",
      title: "Uploaded file does not appear to match the required document",
      reason: `HUEF requested a ${label}. The readable content looks more like a ${DOCUMENT_LABELS[guessed.type] ?? guessed.type} (matched ${guessed.hits} typical phrase${guessed.hits === 1 ? "" : "s"}). Please upload the correct document.`,
      confidence: Math.min(95, 55 + guessed.hits * 10),
      confidenceExplained:
        "Confidence is the strength of the keyword match against a different document category. A coordinator can override this if the file is actually correct.",
      detectedType: guessed.type,
      extractedHints: hints,
      issues,
    };
  }

  const names = nameOverlap(options.applicantName, `${text} ${options.originalName}`);
  if (text && names.total >= 2 && names.matched === 0) {
    return {
      status: "INFORMATION_MISMATCH",
      title: "Name on the document may not match the application",
      reason: `The ${label} does not clearly show the applicant name “${options.applicantName}”. Please check that you uploaded your own document, or that the spelling matches your HUEF profile.`,
      confidence: 68,
      confidenceExplained:
        "Confidence reflects that none of the applicant’s name parts were found in the readable text. Nicknames, scanned pages, or different name order can cause this flag.",
      detectedType: guessed?.type ?? options.requiredType,
      extractedHints: hints,
      issues: ["Applicant name was not found in the readable document text."],
    };
  }

  if (options.programName && text && !normalizeName(text).includes(normalizeName(options.programName).split(" ")[0] ?? "")) {
    hints.push("Programme name from the form was not obviously present in the document text.");
  }
  if (options.institutionName && text) {
    const first = normalizeName(options.institutionName).split(" ")[0];
    if (first && first.length > 3 && normalizeName(text).includes(first)) {
      hints.push(`Institution name fragment “${first}” appears in the document.`);
    }
  }

  const expectedHits = scoreKeywords(text, TYPE_KEYWORDS[options.requiredType] ?? []);
  if (expectedHits === 0 && text.length > 80 && !["PASSPORT_PHOTO", "STUDENT_ID"].includes(options.requiredType)) {
    return {
      status: "NEEDS_REVIEW",
      title: "Document needs a person to confirm the type",
      reason: `A file was uploaded for ${label}, but the readable text does not contain the usual phrases for that document. It may still be correct (for example a school letter with different wording). A coordinator should review it.`,
      confidence: 48,
      confidenceExplained:
        "Medium-low confidence because expected keywords were missing. This is a review flag, not a rejection.",
      detectedType: guessed?.type ?? null,
      extractedHints: hints,
      issues,
    };
  }

  if (options.pageEstimate === 1 && ["TRANSCRIPT", "FEE_STRUCTURE"].includes(options.requiredType)) {
    issues.push("Only one page was detected. If the original has more pages, please upload the complete file.");
    return {
      status: "NEEDS_REVIEW",
      title: "Document may be missing pages",
      reason: `The ${label} appears to have only one page. If your transcript or invoice is longer, please replace this upload with the full document.`,
      confidence: 60,
      confidenceExplained: "Confidence is based on page count detected in the PDF structure.",
      detectedType: options.requiredType,
      extractedHints: hints,
      issues,
    };
  }

  const confidence = Math.min(96, 62 + expectedHits * 8 + (names.matched > 0 ? 10 : 0));
  return {
    status: "PASSED_INITIAL",
    title: "Passed initial document screening",
    reason: `The ${label} looks like the requested document type and could be read. This is a preliminary check only. A HUEF coordinator must still verify the original.`,
    confidence,
    confidenceExplained:
      "This score estimates how closely the readable content matches a typical file of this type (keywords, file format, and name checks). It is not an academic grade or an eligibility decision.",
    detectedType: options.requiredType,
    extractedHints: hints,
    issues,
  };
}

export function worstDocumentStatus(statuses: ScreeningStatus[]): ScreeningStatus | null {
  const order: ScreeningStatus[] = [
    "MISSING_REQUIRED",
    "UNREADABLE_DOCUMENT",
    "INCORRECT_DOCUMENT",
    "POTENTIAL_DUPLICATE",
    "INFORMATION_MISMATCH",
    "NEEDS_REVIEW",
    "UNABLE_TO_DETERMINE",
    "PASSED_INITIAL",
  ];
  for (const status of order) {
    if (statuses.includes(status)) return status;
  }
  return null;
}
