import { prisma } from "./prisma";
import { runScreening, type ScreeningResult } from "./screening";
import { ACADEMIC_YEAR } from "./constants";

export async function screenApplication(applicationId: string): Promise<ScreeningResult> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      documents: true,
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
    data: { screeningJson: JSON.stringify(result) },
  });

  return result;
}
