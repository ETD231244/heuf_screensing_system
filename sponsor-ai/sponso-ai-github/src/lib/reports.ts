import { prisma } from "@/lib/prisma";
import { ACADEMIC_YEAR } from "@/lib/constants";

export async function loadReportRows() {
  return prisma.application.findMany({
    where: { academicYear: ACADEMIC_YEAR, status: { not: "DRAFT" } },
    include: {
      institution: true,
      applicant: { include: { district: true, llg: true, user: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export function groupCount<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const label = key(row) || "Not recorded";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function toCsv(rows: Awaited<ReturnType<typeof loadReportRows>>) {
  const header = [
    "Applicant",
    "Email",
    "District",
    "LLG",
    "Institution",
    "Programme",
    "Year",
    "Status",
    "Screening",
    "Submitted",
  ];
  const lines = rows.map((row) =>
    [
      `${row.applicant.givenName} ${row.applicant.surname}`,
      row.applicant.user.email,
      row.applicant.district?.name ?? "",
      row.applicant.llg?.name ?? row.applicant.llgName ?? "",
      row.institution.name,
      row.programName,
      row.yearOfStudy,
      row.status,
      row.screeningStatus ?? "",
      row.submittedAt?.toISOString() ?? "",
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
