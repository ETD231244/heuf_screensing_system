import { prisma } from "@/lib/prisma";
import {
  ACADEMIC_YEAR,
  HELA_DISTRICTS,
  SCREENING_STATUS_LABELS,
  STATUS_LABELS,
  type ScreeningStatus,
} from "@/lib/constants";
import { fullName } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

export type NamedCount = {
  key: string;
  label: string;
  count: number;
};

export type InstitutionRow = {
  code: string;
  name: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  moreInfo: number;
  flagged: number;
};

export type QueueRow = {
  id: string;
  name: string;
  district: string;
  llg: string;
  institution: string;
  program: string;
  status: string;
  statusLabel: string;
  screening: string;
  screeningLabel: string;
  submittedAt: string | null;
};

export type CoordinatorDashboardData = {
  generatedAt: string;
  totals: {
    submitted: number;
    awaiting: number;
    flagged: number;
    review: number;
    incomplete: number;
    approved: number;
    rejected: number;
    last7Days: number;
  };
  byStatus: NamedCount[];
  byScreening: NamedCount[];
  byDistrict: NamedCount[];
  byInstitution: InstitutionRow[];
  submissionsByDay: Array<{ date: string; label: string; count: number }>;
  attentionQueue: QueueRow[];
};

function isFlagged(status?: string | null) {
  return Boolean(status && status !== "PASSED_INITIAL");
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-PG", { day: "numeric", month: "short" });
}

export async function loadCoordinatorDashboard(): Promise<CoordinatorDashboardData> {
  const applications = await prisma.application.findMany({
    where: { academicYear: ACADEMIC_YEAR, status: { not: "DRAFT" } },
    include: {
      institution: true,
      applicant: { include: { district: true, llg: true, user: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const now = Date.now();
  const awaiting = applications.filter((row) => row.status === "PENDING").length;
  const flagged = applications.filter((row) => isFlagged(row.screeningStatus)).length;
  const review = applications.filter(
    (row) => row.screeningStatus === "NEEDS_REVIEW" || row.screeningStatus === "UNABLE_TO_DETERMINE",
  ).length;
  const incomplete = applications.filter(
    (row) => row.status === "MORE_INFO" || row.screeningStatus === "MISSING_REQUIRED",
  ).length;
  const approved = applications.filter((row) => row.status === "APPROVED").length;
  const rejected = applications.filter((row) => row.status === "REJECTED").length;
  const last7Days = applications.filter(
    (row) => row.submittedAt && now - row.submittedAt.getTime() < 7 * DAY_MS,
  ).length;

  const statusKeys = ["PENDING", "MORE_INFO", "APPROVED", "REJECTED"] as const;
  const byStatus = statusKeys.map((key) => ({
    key,
    label: STATUS_LABELS[key],
    count: applications.filter((row) => row.status === key).length,
  }));

  const screeningMap = new Map<string, number>();
  for (const row of applications) {
    const key = row.screeningStatus ?? "NOT_SCREENED";
    screeningMap.set(key, (screeningMap.get(key) ?? 0) + 1);
  }
  const byScreening: NamedCount[] = [
    ...Object.entries(SCREENING_STATUS_LABELS).map(([key, label]) => ({
      key,
      label,
      count: screeningMap.get(key) ?? 0,
    })),
    { key: "NOT_SCREENED", label: "Not screened", count: screeningMap.get("NOT_SCREENED") ?? 0 },
  ].filter((row) => row.count > 0);

  const byDistrict = HELA_DISTRICTS.map((name) => ({
    key: name,
    label: name,
    count: applications.filter((row) => row.applicant.district?.name === name).length,
  }));

  const institutionMap = new Map<string, InstitutionRow>();
  for (const row of applications) {
    const current = institutionMap.get(row.institutionId) ?? {
      code: row.institution.code,
      name: row.institution.name,
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      moreInfo: 0,
      flagged: 0,
    };
    current.total += 1;
    if (row.status === "PENDING") current.pending += 1;
    if (row.status === "APPROVED") current.approved += 1;
    if (row.status === "REJECTED") current.rejected += 1;
    if (row.status === "MORE_INFO") current.moreInfo += 1;
    if (isFlagged(row.screeningStatus)) current.flagged += 1;
    institutionMap.set(row.institutionId, current);
  }
  const byInstitution = [...institutionMap.values()].sort((a, b) => b.total - a.total);

  const submissionsByDay = Array.from({ length: TREND_DAYS }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (TREND_DAYS - 1 - index));
    const key = dayKey(date);
    return {
      date: key,
      label: dayLabel(date),
      count: applications.filter((row) => row.submittedAt && dayKey(row.submittedAt) === key).length,
    };
  });

  const attentionQueue: QueueRow[] = applications
    .filter(
      (row) =>
        row.status === "PENDING" ||
        row.status === "MORE_INFO" ||
        isFlagged(row.screeningStatus),
    )
    .slice(0, 10)
    .map((row) => ({
      id: row.id,
      name: fullName(row.applicant.givenName, row.applicant.surname),
      district: row.applicant.district?.name ?? "—",
      llg: row.applicant.llg?.name ?? row.applicant.llgName ?? "—",
      institution: `${row.institution.code} · ${row.programName}`,
      program: row.programName,
      status: row.status,
      statusLabel: STATUS_LABELS[row.status] ?? row.status,
      screening: row.screeningStatus ?? "",
      screeningLabel: row.screeningStatus
        ? SCREENING_STATUS_LABELS[row.screeningStatus as ScreeningStatus] ?? row.screeningStatus
        : "Not screened",
      submittedAt: row.submittedAt?.toISOString() ?? null,
    }));

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      submitted: applications.length,
      awaiting,
      flagged,
      review,
      incomplete,
      approved,
      rejected,
      last7Days,
    },
    byStatus,
    byScreening,
    byDistrict,
    byInstitution,
    submissionsByDay,
    attentionQueue,
  };
}
