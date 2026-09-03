import { prisma } from "./prisma";
import { runScreening, type ScreeningResult } from "./screening";
import { ACADEMIC_YEAR } from "./constants";
import { extractPdfText, estimatePdfPages, screenUploadedDocument } from "./document-ai";
import { detectFileKind } from "./security";
import { fullName } from "./utils";
import { readDocumentBytes } from "./documents";

export async function screenApplication(
  applicationId: string,
  runBy = "SYSTEM",
): Promise<ScreeningResult> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      documents: true,
      institution: true,
      applicant: { include: { user: true, district: true } },
    },
  });
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
        },
        include: {
          application: { include: { applicant: true } },
        },
      })
    : [];

  const documentFindings = [];
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

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      screeningJson: JSON.stringify(result),
      screeningStatus: result.overallStatus,
    },
  });

  await prisma.screeningHistory.create({
    data: {
      applicationId,
      resultJson: JSON.stringify(result),
      overallStatus: result.overallStatus,
      runBy,
    },
  });

  return result;
}
