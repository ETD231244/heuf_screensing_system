import { extractPdfText, screenUploadedDocument } from "../src/lib/document-ai";

const transcriptPdf = Buffer.concat([
  Buffer.from(
    `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
BT (OFFICIAL ACADEMIC TRANSCRIPT) Tj (HENENE AGIBE) Tj (GPA 3.1 SEMESTER RESULTS CREDIT UNITS) Tj ET
%%EOF`,
  ),
  Buffer.alloc(2000, 32),
]);

const text = extractPdfText(transcriptPdf);
const result = screenUploadedDocument({
  requiredType: "ACCEPTANCE_LETTER",
  originalName: "transcript.pdf",
  mimeType: "application/pdf",
  sizeBytes: transcriptPdf.length,
  kind: "pdf",
  extractedText: text,
  pageEstimate: 1,
  applicantName: "HENENE AGIBE",
  duplicateOf: null,
});

if (result.status !== "INCORRECT_DOCUMENT" && result.status !== "NEEDS_REVIEW") {
  console.error("Expected a mismatch flag when a transcript is uploaded as a photo", result);
  process.exit(1);
}

const ok = screenUploadedDocument({
  requiredType: "TRANSCRIPT",
  originalName: "transcript.pdf",
  mimeType: "application/pdf",
  sizeBytes: transcriptPdf.length,
  kind: "pdf",
  extractedText: text,
  pageEstimate: 2,
  applicantName: "HENENE AGIBE",
  duplicateOf: null,
});

if (ok.status !== "PASSED_INITIAL" && ok.status !== "NEEDS_REVIEW") {
  console.error("Transcript should pass or need review, got", ok);
  process.exit(1);
}

console.log("document-ai checks passed", result.status, ok.status);
