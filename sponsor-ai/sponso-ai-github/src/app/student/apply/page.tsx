import { redirect } from "next/navigation";
import { ApplicationWizard, type WizardValues } from "@/components/application-wizard";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACADEMIC_YEAR } from "@/lib/constants";

export default async function ApplyPage() {
  const session = await requireStudent();
  const [user, institutions, programs, documentTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      include: {
        applicant: {
          include: {
            district: true,
            applications: {
              where: { academicYear: ACADEMIC_YEAR },
              include: { documents: { where: { isCurrent: true } }, institution: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.institution.findMany({ orderBy: { code: "asc" } }),
    prisma.program.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.documentType.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  if (!user?.applicant) redirect("/register");
  const application = user.applicant.applications[0];
  if (application && application.status !== "DRAFT" && application.status !== "MORE_INFO") {
    redirect("/student");
  }

  const a = user.applicant;
  const initial: WizardValues = {
    givenName: a.givenName ?? "",
    surname: a.surname ?? "",
    gender: a.gender === "U" ? "" : a.gender,
    dateOfBirth: a.dateOfBirth ?? "",
    age: a.age ? String(a.age) : "",
    phone: a.phone ?? "",
    email: user.email,
    studentId: a.studentId ?? "",
    clanName: a.clanName ?? "",
    wardVillage: a.wardVillage ?? "",
    llgName: a.llgName ?? "",
    districtName: a.district?.name ?? "",
    province: a.province ?? "Hela",
    fatherFullName: a.fatherFullName ?? "",
    fatherOccupation: a.fatherOccupation ?? "",
    fatherClan: a.fatherClan ?? "",
    fatherWard: a.fatherWard ?? "",
    fatherDistrict: a.fatherDistrict ?? "",
    fatherProvince: a.fatherProvince ?? "",
    fatherPhone: a.fatherPhone ?? "",
    motherFullName: a.motherFullName ?? "",
    motherOccupation: a.motherOccupation ?? "",
    motherClan: a.motherClan ?? "",
    motherWard: a.motherWard ?? "",
    motherDistrict: a.motherDistrict ?? "",
    motherProvince: a.motherProvince ?? "",
    motherPhone: a.motherPhone ?? "",
    eligibilityPath: a.eligibilityPath ?? "HELA_ORIGIN",
    publicServantWho: a.publicServantWho ?? "",
    publicServantDepartment: a.publicServantDepartment ?? "",
    publicServantOccupation: a.publicServantOccupation ?? "",
    publicServantYears: a.publicServantYears ? String(a.publicServantYears) : "",
    publicServantSupervisor: a.publicServantSupervisor ?? "",
    publicServantSupervisorPhone: a.publicServantSupervisorPhone ?? "",
    institutionId: application?.institutionId ?? "",
    programName: application?.programName === "To be confirmed" ? "" : application?.programName ?? "",
    studyType: application?.studyType ?? "",
    studyLevel: application?.studyLevel ?? "UNDERGRADUATE",
    yearOfStudy: application?.yearOfStudy === "Not stated" ? "" : application?.yearOfStudy ?? "",
    expectedCompletion: application?.expectedCompletion ?? "",
    institutionProvince: application?.institutionProvince ?? "",
    registrarPhone: application?.registrarPhone ?? "",
    registrarEmail: application?.registrarEmail ?? "",
    applicantType: application?.applicantType ?? "NEW_INTAKE",
    lastSecondarySchool: application?.lastSecondarySchool ?? "",
    yearCompleted: application?.yearCompleted ?? "",
    feeCategory: application?.feeCategory ?? "HUEF_TFA",
    otherFeeType: application?.otherFeeType ?? "",
    tuitionFees: application?.tuitionFees ?? "",
    accountName: application?.accountName ?? "",
    accountNumber: application?.accountNumber ?? "",
    bankName: application?.bankName ?? "",
    bankBranch: application?.bankBranch ?? "",
    witnessName: application?.witnessName ?? "",
    witnessTitle: application?.witnessTitle ?? "",
    witnessVillage: application?.witnessVillage ?? "",
    witnessDistrict: application?.witnessDistrict ?? "",
    witnessPhone: application?.witnessPhone ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">
          2026 HUEF application form
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Tuition Fee Assistance</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c564c]">
          Fill the sections in order. Use BLOCK LETTERS. You can save a draft and come back. The form will not submit until every required document is attached — so missing papers are caught here, not weeks later by phone.
        </p>
      </div>
      <ApplicationWizard
        initial={initial}
        institutions={institutions}
        programs={programs.map((item) => ({
          id: item.id,
          name: item.name,
          institutionId: item.institutionId,
        }))}
        documentTypes={documentTypes.map((item) => ({
          code: item.code,
          label: item.label,
          requiredForNew: item.requiredForNew,
          requiredForContinuing: item.requiredForContinuing,
          requiredForNonHela: item.requiredForNonHela,
          isActive: item.isActive,
        }))}
        documents={
          application?.documents.map((doc) => ({
            id: doc.id,
            type: doc.type,
            originalName: doc.originalName,
            sizeBytes: doc.sizeBytes,
            screeningStatus: doc.screeningStatus,
          })) ?? []
        }
      />
    </div>
  );
}
