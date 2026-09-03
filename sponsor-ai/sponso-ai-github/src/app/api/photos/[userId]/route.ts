import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { userId } = await params;
  if (session.role === "STUDENT" && session.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const applicant = await prisma.applicant.findUnique({
    where: { userId },
    select: { photoBytes: true, photoMime: true },
  });
  if (!applicant?.photoBytes || !applicant.photoMime) {
    return NextResponse.json({ error: "No photograph" }, { status: 404 });
  }
  return new NextResponse(Buffer.from(applicant.photoBytes), {
    headers: {
      "Content-Type": applicant.photoMime,
      "Cache-Control": "private, max-age=120",
      "Content-Disposition": "inline; filename=\"profile-photo\"",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
