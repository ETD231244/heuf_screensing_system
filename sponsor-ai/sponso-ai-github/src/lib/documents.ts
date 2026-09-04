import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { extractPdfText, estimatePdfPages } from "@/lib/document-ai";
import { detectFileKind, sha256Hex } from "@/lib/security";

export async function saveDocumentFile(options: {
  applicationId: string;
  type: string;
  originalName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const { applicationId, type, originalName, mimeType, bytes } = options;
  let storedPath = "";
  try {
    const dir = path.join(process.cwd(), "storage", "documents", applicationId);
    await mkdir(dir, { recursive: true });
    const ext = originalName.includes(".")
      ? originalName.slice(originalName.lastIndexOf("."))
      : "";
    storedPath = path.join(dir, `${type}-${Date.now()}${ext}`);
    await writeFile(storedPath, bytes);
  } catch {
    storedPath = "";
  }

  const payload = Uint8Array.from(bytes);
  const kind = detectFileKind(bytes);
  const extractedText = kind === "pdf" ? extractPdfText(bytes) : "";
  const pageEstimate = kind === "pdf" ? estimatePdfPages(bytes) : null;
  const sha256 = sha256Hex(bytes);
  await prisma.document.updateMany({
    where: { applicationId, type, isCurrent: true },
    data: { isCurrent: false, supersededAt: new Date() },
  });
  await prisma.document.create({
    data: {
      applicationId,
      type,
      originalName,
      storedPath,
      mimeType,
      sizeBytes: bytes.length,
      contents: payload,
      sha256,
      extractedText: extractedText || null,
      pageEstimate,
      isCurrent: true,
    },
  });
}

export async function readDocumentBytes(document: {
  contents: Uint8Array | Buffer | null;
  storedPath: string;
}) {
  if (document.contents && document.contents.length > 0) {
    return Buffer.from(document.contents);
  }
  if (!document.storedPath) return null;
  const { readFile } = await import("node:fs/promises");
  try {
    return await readFile(document.storedPath);
  } catch {
    return null;
  }
}

export async function deleteStoredFile(storedPath: string) {
  if (!storedPath) return;
  try {
    await unlink(storedPath);
  } catch {
    /* already gone */
  }
}
