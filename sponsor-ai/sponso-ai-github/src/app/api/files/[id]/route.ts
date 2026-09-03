import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { readDocumentBytes } from "@/lib/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { application: { include: { applicant: true } } },
  });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.role === "STUDENT" && document.application.applicant.userId !== session.id) {
    return NextResponse.json({ error: "You do not have permission to open this document." }, { status: 403 });
  }

  const bytes = await readDocumentBytes(document);
  if (!bytes) {
    return NextResponse.json({ error: "This file is no longer available." }, { status: 404 });
  }

  const safeName = document.originalName.replace(/["\r\n]/g, "");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'none'; sandbox",
    },
  });
}
