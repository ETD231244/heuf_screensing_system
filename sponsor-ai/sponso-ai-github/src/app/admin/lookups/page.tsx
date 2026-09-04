import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LookupsManager } from "@/components/lookups-manager";
import { ACADEMIC_YEAR } from "@/lib/constants";

export default async function LookupsPage() {
  await requireAdmin();
  const [institutions, programs, districts, documentTypes, period] = await Promise.all([
    prisma.institution.findMany({ orderBy: { code: "asc" } }),
    prisma.program.findMany({ include: { institution: true }, orderBy: { name: "asc" } }),
    prisma.district.findMany({ include: { llgs: true }, orderBy: { name: "asc" } }),
    prisma.documentType.findMany({ orderBy: { code: "asc" } }),
    prisma.applicationPeriod.findUnique({ where: { academicYear: ACADEMIC_YEAR } }),
  ]);
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Administrator</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">Institutions, geography, and intake</h1>
      </div>
      <LookupsManager
        institutions={institutions}
        programs={programs.map((item) => ({
          id: item.id,
          name: item.name,
          institutionName: item.institution?.name ?? null,
        }))}
        districts={districts}
        documentTypes={documentTypes}
        period={
          period
            ? {
                academicYear: period.academicYear,
                title: period.title,
                opensAt: period.opensAt.toISOString().slice(0, 16),
                closesAt: period.closesAt.toISOString().slice(0, 16),
              }
            : null
        }
      />
    </div>
  );
}
