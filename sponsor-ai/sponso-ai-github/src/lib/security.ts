import { createHash } from "node:crypto";
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from "./constants";

export type DetectedFileKind = "pdf" | "jpeg" | "png" | "webp" | "unknown";

export function sha256Hex(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function detectFileKind(bytes: Buffer): DetectedFileKind {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return "unknown";
}

export function mimeForKind(kind: DetectedFileKind) {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export function extensionLooksAllowed(name: string) {
  return /\.(pdf|jpe?g|png|webp)$/i.test(name);
}

export function validateUploadedFile(options: {
  originalName: string;
  declaredMime: string;
  bytes: Buffer;
  maxBytes?: number;
}) {
  const maxBytes = options.maxBytes ?? MAX_FILE_BYTES;
  if (!options.bytes.length) {
    return { ok: false as const, error: "The selected file is empty. Please choose a different file." };
  }
  if (options.bytes.length > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false as const,
      error: `This file is larger than ${mb} MB. Please compress it or upload a smaller copy.`,
    };
  }
  if (!extensionLooksAllowed(options.originalName)) {
    return {
      ok: false as const,
      error: "Only PDF, JPG, and PNG files are accepted. Please upload a supported file type.",
    };
  }
  const kind = detectFileKind(options.bytes);
  if (kind === "unknown") {
    return {
      ok: false as const,
      error:
        "This file could not be verified as a genuine PDF or image. It may be corrupted, renamed, or an unsupported format.",
    };
  }
  const actualMime = mimeForKind(kind);
  const declared = (options.declaredMime || "").toLowerCase();
  if (
    declared &&
    declared !== "application/octet-stream" &&
    !ALLOWED_MIME_TYPES.includes(declared as (typeof ALLOWED_MIME_TYPES)[number]) &&
    declared !== actualMime
  ) {
    return {
      ok: false as const,
      error: "The file type declared by the browser does not match an allowed HUEF document type.",
    };
  }
  if (declared && declared !== "application/octet-stream" && declared !== actualMime) {
    return {
      ok: false as const,
      error:
        "The file contents do not match the file type. A renamed or disguised file cannot be accepted.",
    };
  }
  return {
    ok: true as const,
    kind,
    mimeType: actualMime,
    sha256: sha256Hex(options.bytes),
  };
}

export function validateProfilePhoto(options: {
  originalName: string;
  declaredMime: string;
  bytes: Buffer;
  maxBytes: number;
}) {
  const result = validateUploadedFile(options);
  if (!result.ok) return result;
  if (result.kind === "pdf") {
    return {
      ok: false as const,
      error: "Please upload a photograph (JPG or PNG), not a PDF.",
    };
  }
  return result;
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function loginAllowed(ip: string) {
  const now = Date.now();
  const current = loginAttempts.get(ip);
  if (!current || current.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}

export function loginSucceeded(ip: string) {
  loginAttempts.delete(ip);
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function originLooksTrusted(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function safeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && /prisma|sqlite|econn|enotfound|secret|key/i.test(error.message)) {
    return fallback;
  }
  if (error instanceof Error && error.message.length < 140 && !/[\\/]/.test(error.message)) {
    return error.message;
  }
  return fallback;
}
