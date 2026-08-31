import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { HELA_DISTRICTS, INSTITUTIONS } from "../src/lib/constants";
import { runScreening } from "../src/lib/screening";

const prisma = new PrismaClient();

const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF
`;

async function addDocument(applicationId: string, type: string, name: string) {
  const dir = path.join(process.cwd(), "storage", "documents", applicationId);
  await mkdir(dir, { recursive: true });
  const storedPath = path.join(dir, `${type}.pdf`);
  const bytes = Buffer.from(MINIMAL_PDF);
  await writeFile(storedPath, bytes);
  await prisma.document.create({
    data: {
      applicationId,
      type,
      originalName: name,
      storedPath,
      mimeType: "application/pdf",
      sizeBytes: bytes.length,
      contents: bytes,
    },
  });
}

async function main() {
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.district.deleteMany();

  const districts = await Promise.all(
    HELA_DISTRICTS.map((name) => prisma.district.create({ data: { name } })),
  );
  const districtByName = Object.fromEntries(districts.map((d) => [d.name, d]));

  const institutions = await Promise.all(
    INSTITUTIONS.map((item) =>
      prisma.institution.create({
        data: { code: item.code, name: item.name, category: item.category },
      }),
    ),
  );
  const inst = Object.fromEntries(institutions.map((i) => [i.code, i]));

  const password = await bcrypt.hash("HUEF2026!", 10);
  const studentPassword = await bcrypt.hash("student123", 10);

  await prisma.user.create({
    data: {
      email: "coordinator@huef.pg",
      passwordHash: password,
      role: "COORDINATOR",
    },
  });

  const demoStudent = await prisma.user.create({
    data: {
      email: "student@huef.pg",
      passwordHash: studentPassword,
      role: "STUDENT",
      applicant: {
        create: {
          givenName: "NANCY",
          surname: "PUNDARI",
          gender: "F",
          dateOfBirth: "2004-05-12",
          age: 22,
          phone: "71550011",
          clanName: "HULI",
          wardVillage: "HOBURA",
          llgName: "TARI URBAN",
          districtId: districtByName["Tari-Pori"].id,
          province: "Hela",
          fatherFullName: "JOSEPH PUNDARI",
          fatherOccupation: "SUBSISTENCE FARMER",
          motherFullName: "MARY PUNDARI",
          motherOccupation: "MARKET VENDOR",
          eligibilityPath: "HELA_ORIGIN",
        },
      },
    },
    include: { applicant: true },
  });

  await prisma.application.create({
    data: {
      applicantId: demoStudent.applicant!.id,
      institutionId: inst.A5.id,
      programName: "Bachelor of Information Systems",
      studyLevel: "UNDERGRADUATE",
      yearOfStudy: "1st year",
      applicantType: "NEW_INTAKE",
      feeCategory: "HUEF_TFA",
      status: "DRAFT",
    },
  });

  type SeedApp = {
    email: string;
    givenName: string;
    surname: string;
    gender: "M" | "F";
    dob: string;
    phone: string;
    district: string;
    clan: string;
    village: string;
    eligibility: string;
    psYears?: number;
    institution: string;
    program: string;
    year: string;
    type: "NEW_INTAKE" | "CONTINUING";
    fee: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    note?: string;
    tuition: string;
    witness: string;
    docs: string[];
    submittedDaysAgo: number;
  };

  const samples: SeedApp[] = [
    {
      email: "henene.agibe@student.pg",
      givenName: "HENENE",
      surname: "AGIBE",
      gender: "M",
      dob: "2003-03-05",
      phone: "70112233",
      district: "Tari-Pori",
      clan: "HULI",
      village: "PIAIABE",
      eligibility: "HELA_ORIGIN",
      institution: "A5",
      program: "Bachelor of Information Systems",
      year: "4th year",
      type: "CONTINUING",
      fee: "HUEF_TFA",
      status: "PENDING",
      tuition: "12800.00",
      witness: "COUNCILLOR JAMES TOBE",
      docs: ["PASSPORT_PHOTO", "CONFIRMATION_LETTER", "FEE_STRUCTURE", "TRANSCRIPT", "STUDENT_ID"],
      submittedDaysAgo: 6,
    },
    {
      email: "henene.agibe2@student.pg",
      givenName: "HENENE",
      surname: "AGIBE",
      gender: "M",
      dob: "2003-03-05",
      phone: "70998877",
      district: "Tari-Pori",
      clan: "HULI",
      village: "PIAIABE",
      eligibility: "HELA_ORIGIN",
      institution: "A2",
      program: "Bachelor of Education",
      year: "2nd year",
      type: "CONTINUING",
      fee: "HUEF_TFA",
      status: "PENDING",
      tuition: "9800.00",
      witness: "PASTOR MARK HALI",
      docs: ["PASSPORT_PHOTO", "CONFIRMATION_LETTER", "FEE_STRUCTURE", "TRANSCRIPT", "STUDENT_ID"],
      submittedDaysAgo: 4,
    },
    {
      email: "lina.komengi@student.pg",
      givenName: "LINA",
      surname: "KOMENGI",
      gender: "F",
      dob: "2005-11-20",
      phone: "72334455",
      district: "Komo-Hulia",
      clan: "DUMA",
      village: "KOMO STATION",
      eligibility: "HELA_ORIGIN",
      institution: "A1",
      program: "Bachelor of Science",
      year: "1st year",
      type: "NEW_INTAKE",
      fee: "CORPORATE",
      status: "PENDING",
      tuition: "15200.00",
      witness: "WARD RECORDER PAUL KOMENGI",
      docs: ["PASSPORT_PHOTO", "ACCEPTANCE_LETTER", "GRADE_10", "GRADE_12", "FEE_STRUCTURE"],
      submittedDaysAgo: 3,
    },
    {
      email: "daniel.olabe@student.pg",
      givenName: "DANIEL",
      surname: "OLABE",
      gender: "M",
      dob: "2002-08-14",
      phone: "73445566",
      district: "Magarima",
      clan: "TANI",
      village: "MAGARIMA",
      eligibility: "HELA_ORIGIN",
      institution: "A3",
      program: "Bachelor of Engineering (Civil)",
      year: "3rd year",
      type: "CONTINUING",
      fee: "HUEF_TFA",
      status: "APPROVED",
      note: "Continuing student in good standing. Fee structure verified.",
      tuition: "14500.00",
      witness: "PASTOR JOHN TABI",
      docs: ["PASSPORT_PHOTO", "CONFIRMATION_LETTER", "FEE_STRUCTURE", "TRANSCRIPT", "STUDENT_ID"],
      submittedDaysAgo: 18,
    },
    {
      email: "grace.halu@student.pg",
      givenName: "GRACE",
      surname: "HALU",
      gender: "F",
      dob: "2004-01-30",
      phone: "74556677",
      district: "Koroba-Lake Kopiago",
      clan: "HEWA",
      village: "KOROBA",
      eligibility: "PUBLIC_SERVANT_CHILD",
      psYears: 8,
      institution: "C23",
      program: "Certificate in Community Health Work",
      year: "1st year",
      type: "NEW_INTAKE",
      fee: "HUEF_TFA",
      status: "PENDING",
      tuition: "6200.00",
      witness: "SISTER ANNA WAI",
      docs: [
        "PASSPORT_PHOTO",
        "ACCEPTANCE_LETTER",
        "GRADE_10",
        "GRADE_12",
        "FEE_STRUCTURE",
        "SUPPORT_LETTER",
      ],
      submittedDaysAgo: 2,
    },
    {
      email: "michael.tabe@student.pg",
      givenName: "MICHAEL",
      surname: "TABE",
      gender: "M",
      dob: "2001-06-09",
      phone: "75667788",
      district: "Tari-Pori",
      clan: "HULI",
      village: "PAJALU",
      eligibility: "HELA_ORIGIN",
      institution: "B1",
      program: "Diploma of Primary Teaching",
      year: "2nd year",
      type: "CONTINUING",
      fee: "HUEF_TFA",
      status: "REJECTED",
      note: "Confirmation letter does not match the year of study declared on the form.",
      tuition: "5400.00",
      witness: "COUNCILLOR STEVEN ALI",
      docs: ["PASSPORT_PHOTO", "CONFIRMATION_LETTER", "FEE_STRUCTURE"],
      submittedDaysAgo: 12,
    },
    {
      email: "rose.yokolo@student.pg",
      givenName: "ROSE",
      surname: "YOKOLO",
      gender: "F",
      dob: "2006-02-18",
      phone: "76778899",
      district: "Komo-Hulia",
      clan: "HULI",
      village: "HULIA",
      eligibility: "HELA_ORIGIN",
      institution: "H1",
      program: "Grade 11",
      year: "Grade 11",
      type: "NEW_INTAKE",
      fee: "HUEF_TFA",
      status: "PENDING",
      tuition: "3800.00",
      witness: "HEAD TEACHER SAMSON PELE",
      docs: ["PASSPORT_PHOTO", "ACCEPTANCE_LETTER", "GRADE_10", "GRADE_12", "FEE_STRUCTURE"],
      submittedDaysAgo: 1,
    },
  ];

  const uploadsRoot = path.join(process.cwd(), "storage", "documents");
  await mkdir(uploadsRoot, { recursive: true });
  const logoSrc = path.join(process.cwd(), "public", "huef-logo.png");

  for (const sample of samples) {
    const user = await prisma.user.create({
      data: {
        email: sample.email,
        passwordHash: studentPassword,
        role: "STUDENT",
        applicant: {
          create: {
            givenName: sample.givenName,
            surname: sample.surname,
            gender: sample.gender,
            dateOfBirth: sample.dob,
            age: 2026 - Number(sample.dob.slice(0, 4)),
            phone: sample.phone,
            clanName: sample.clan,
            wardVillage: sample.village,
            llgName: `${sample.district.toUpperCase()} LLG`,
            districtId: districtByName[sample.district].id,
            province: "Hela",
            fatherFullName: `FATHER OF ${sample.givenName}`,
            fatherOccupation: "PUBLIC SERVANT",
            motherFullName: `MOTHER OF ${sample.givenName}`,
            motherOccupation: "HOME DUTIES",
            eligibilityPath: sample.eligibility,
            publicServantWho: sample.eligibility === "PUBLIC_SERVANT_CHILD" ? "FATHER" : null,
            publicServantDepartment:
              sample.eligibility === "PUBLIC_SERVANT_CHILD" ? "Education" : null,
            publicServantYears: sample.psYears ?? null,
            publicServantSupervisor:
              sample.eligibility === "PUBLIC_SERVANT_CHILD" ? "Mr Ronny Angu" : null,
          },
        },
      },
      include: { applicant: true },
    });

    const submittedAt = new Date(Date.now() - sample.submittedDaysAgo * 24 * 60 * 60 * 1000);
    const application = await prisma.application.create({
      data: {
        applicantId: user.applicant!.id,
        institutionId: inst[sample.institution].id,
        programName: sample.program,
        studyType: "Full time",
        studyLevel: sample.institution.startsWith("H")
          ? "NATIONAL_HIGH_SCHOOL"
          : "UNDERGRADUATE",
        yearOfStudy: sample.year,
        expectedCompletion: "2027",
        institutionProvince: "Various",
        applicantType: sample.type,
        feeCategory: sample.fee,
        tuitionFees: sample.tuition,
        accountName: inst[sample.institution].name,
        accountNumber: "100200300",
        bankName: "BSP",
        bankBranch: "Tari",
        witnessName: sample.witness,
        witnessTitle: "Community leader",
        witnessVillage: sample.village,
        witnessDistrict: sample.district,
        witnessPhone: "70000000",
        declaredAt: submittedAt,
        status: sample.status,
        statusNote: sample.note,
        submittedAt,
        decidedAt: sample.status === "PENDING" ? null : submittedAt,
        decidedByEmail: sample.status === "PENDING" ? null : "coordinator@huef.pg",
      },
    });

    for (const docType of sample.docs) {
      if (docType === "PASSPORT_PHOTO") {
        const dir = path.join(uploadsRoot, application.id);
        await mkdir(dir, { recursive: true });
        const storedPath = path.join(dir, "PASSPORT_PHOTO.png");
        let photoBytes = Buffer.from(MINIMAL_PDF);
        try {
          await copyFile(logoSrc, storedPath);
          photoBytes = await readFile(storedPath);
        } catch {
          await writeFile(storedPath, MINIMAL_PDF);
        }
        await prisma.document.create({
          data: {
            applicationId: application.id,
            type: docType,
            originalName: `${sample.surname.toLowerCase()}-photo.png`,
            storedPath,
            mimeType: "image/png",
            sizeBytes: photoBytes.length,
            contents: photoBytes,
          },
        });
      } else {
        await addDocument(
          application.id,
          docType,
          `${sample.surname}-${docType.replaceAll("_", "-").toLowerCase()}.pdf`,
        );
      }
    }

    const withDocs = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        documents: true,
        applicant: { include: { user: true, district: true } },
      },
    });
    if (!withDocs) continue;

    const others = samples
      .filter((item) => item.email !== sample.email)
      .map((item) => ({
        id: item.email,
        givenName: item.givenName,
        surname: item.surname,
        phone: item.phone,
        email: item.email,
        dateOfBirth: item.dob,
      }));

    const screening = runScreening({
      id: withDocs.id,
      applicantType: withDocs.applicantType,
      eligibilityPath: withDocs.applicant.eligibilityPath,
      feeCategory: withDocs.feeCategory,
      publicServantYears: withDocs.applicant.publicServantYears,
      programName: withDocs.programName,
      yearOfStudy: withDocs.yearOfStudy,
      witnessName: withDocs.witnessName,
      tuitionFees: withDocs.tuitionFees,
      givenName: withDocs.applicant.givenName,
      surname: withDocs.applicant.surname,
      phone: withDocs.applicant.phone,
      email: withDocs.applicant.user.email,
      dateOfBirth: withDocs.applicant.dateOfBirth,
      districtName: withDocs.applicant.district?.name,
      documentTypes: withDocs.documents.map((d) => d.type),
      others,
    });

    await prisma.application.update({
      where: { id: application.id },
      data: { screeningJson: JSON.stringify(screening) },
    });
  }

  console.log("Seeded HUEF demo data.");
  console.log("Coordinator: coordinator@huef.pg / HUEF2026!");
  console.log("Student (draft): student@huef.pg / student123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
