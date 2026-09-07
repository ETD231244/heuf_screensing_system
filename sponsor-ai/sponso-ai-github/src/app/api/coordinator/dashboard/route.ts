import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadCoordinatorDashboard } from "@/lib/coordinator-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (session.role !== "COORDINATOR" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Coordinator access required" }, { status: 403 });
  }

  const data = await loadCoordinatorDashboard();
  return NextResponse.json(data, {
    headers: { "cache-control": "private, no-store" },
  });
}
