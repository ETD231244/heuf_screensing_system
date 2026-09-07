import { prisma } from "./prisma";
import { runScreening, type ScreeningResult } from "./screening";
import { ACADEMIC_YEAR } from "./constants";
import { extractPdfText, estimatePdfPages, screenUploadedDocument, type DocumentScreening } from "./document-ai";
import { detectFileKind } from "./security";
import { fullName } from "./utils";
import { readDocumentBytes } from "./documents";
import { mergeDeepSeekResult, runDeepSeekScreening } from "./deepseek";

export async function screenApplication(
  applicationId: string,
  runBy = "SYSTEM",
  options?: { llm?: boolean },
): Promise<ScreeningResult> {
  const [application, documentRules] = await Promise.all([
    prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        documents: { where: { isCurrent: true } },
        institution: true,
        applicant: { include: { user: true, district: true, llg: true } },
      },
    }),
    prisma.documentType.findMany({ where: { isActive: true } }),
  ]);
  if (!application) {
    throw new Error("Application not found");
  }

  const others = await prisma.application.findMany({
    where: {
      academicYear: ACADEMIC_YEAR,
      status: { not: "DRAFT" },
      id: { not: applicationId },
    },
    include: { applicant: { include: { user: true } } },
  });

  const hashes = application.documents.map((doc) => doc.sha256).filter(Boolean) as string[];
  const duplicateRows = hashes.length
    ? await prisma.document.findMany({
        where: {
          sha256: { in: hashes },
          applicationId: { not: applicationId },
          isCurrent: true,
        },
        include: {
          application: { include: { applicant: true } },
        },
      })
    : [];

  const documentFindings: Array<DocumentScreening & { type: string; originalName: string }> = [];
  const extractedByType = new Map<string, string>();
  for (const doc of application.documents) {
    const bytes = await readDocumentBytes(doc);
    const kind = bytes ? detectFileKind(bytes) : "unknown";
    const extractedText =
      doc.extractedText || (bytes && kind === "pdf" ? extractPdfText(bytes) : "");
    const pageEstimate =
      doc.pageEstimate ?? (bytes && kind === "pdf" ? estimatePdfPages(bytes) : null);
    const twin = duplicateRows.find((row) => row.sha256 && row.sha256 === doc.sha256);
    const finding = screenUploadedDocument({
      requiredType: doc.type,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      kind,
      extractedText,
      pageEstimate,
      applicantName: fullName(application.applicant.givenName, application.applicant.surname),
      programName: application.programName,
      institutionName: application.institution.name,
      duplicateOf: twin
        ? {
            applicantName: fullName(twin.application.applicant.givenName, twin.application.applicant.surname),
            documentType: twin.type,
          }
        : null,
    });
    documentFindings.push({
      ...finding,
      type: doc.type,
      originalName: doc.originalName,
    });
    extractedByType.set(doc.type, extractedText);
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        screeningStatus: finding.status,
        screeningJson: JSON.stringify(finding),
        extractedText: extractedText || null,
        pageEstimate,
      },
    });
  }

  const result = runScreening({
    id: application.id,
    applicantType: application.applicantType,
    eligibilityPath: application.applicant.eligibilityPath,
    feeCategory: application.feeCategory,
    publicServantYears: application.applicant.publicServantYears,
    programName: application.programName,
    yearOfStudy: application.yearOfStudy,
    witnessName: application.witnessName,
    tuitionFees: application.tuitionFees,
    givenName: application.applicant.givenName,
    surname: application.applicant.surname,
    phone: application.applicant.phone,
    email: application.applicant.user.email,
    dateOfBirth: application.applicant.dateOfBirth,
    districtName: application.applicant.district?.name,
    documentTypes: application.documents.map((doc) => doc.type),
    documentRules,
    documentFindings,
    others: others.map((item) => ({
      id: item.id,
      givenName: item.applicant.givenName,
      surname: item.applicant.surname,
      phone: item.applicant.phone,
      email: item.applicant.user.email,
      dateOfBirth: item.applicant.dateOfBirth,
    })),
  });

  let finalResult = result;
  if (options?.llm) {
    const { briefing, raw } = await runDeepSeekScreening({
      applicantName: fullName(application.applicant.givenName, application.applicant.surname),
      email: application.applicant.user.email,
      phone: application.applicant.phone,
      dateOfBirth: application.applicant.dateOfBirth,
      gender: application.applicant.gender,
      district: application.applicant.district?.name,
      llg: application.applicant.llg?.name ?? application.applicant.llgName,
      clan: application.applicant.clanName,
      village: application.applicant.wardVillage,
      eligibilityPath: application.applicant.eligibilityPath,
      publicServantYears: application.applicant.publicServantYears,
      applicantType: application.applicantType,
      programName: application.programName,
      yearOfStudy: application.yearOfStudy,
      institutionName: application.institution.name,
      feeCategory: application.feeCategory,
      tuitionFees: application.tuitionFees,
      witnessName: application.witnessName,
      documents: application.documents.map((doc, index) => ({
        type: doc.type,
        originalName: doc.originalName,
        status: documentFindings[index]?.status ?? doc.screeningStatus ?? "UNABLE_TO_DETERMINE",
        reason: documentFindings[index]?.reason ?? "No heuristic note.",
        extractedText: extractedByType.get(doc.type) || "",
      })),
      rules: result,
    });
    finalResult = mergeDeepSeekResult(result, briefing, raw);
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      screeningJson: JSON.stringify(finalResult),
      screeningStatus: finalResult.overallStatus,
    },
  });

  await prisma.screeningHistory.create({
    data: {
      applicationId,
      resultJson: JSON.stringify(finalResult),
      overallStatus: finalResult.overallStatus,
      runBy,
    },
  });

  return finalResult;
}
