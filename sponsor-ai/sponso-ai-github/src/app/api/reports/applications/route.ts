import { requireStaff } from "@/lib/auth";
import { loadReportRows, toCsv } from "@/lib/reports";

export async function GET() {
  await requireStaff();
  const rows = await loadReportRows();
  return new Response(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="huef-applications-2026.csv"',
      "cache-control": "private, no-store",
    },
  });
}
