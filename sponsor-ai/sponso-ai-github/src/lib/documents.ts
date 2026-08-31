import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

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
    storedPath = path.join(dir, `${type}${ext}`);
    await writeFile(storedPath, bytes);
  } catch {
    storedPath = "";
  }

  const payload = Uint8Array.from(bytes);
  await prisma.document.upsert({
    where: { applicationId_type: { applicationId, type } },
    update: {
      originalName,
      storedPath,
      mimeType,
      sizeBytes: bytes.length,
      contents: payload,
    },
    create: {
      applicationId,
      type,
      originalName,
      storedPath,
      mimeType,
      sizeBytes: bytes.length,
      contents: payload,
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
