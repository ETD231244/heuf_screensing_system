import { fileSizeLabel } from "@/lib/utils";

export function DocumentPreview({
  id,
  mimeType,
  originalName,
  sizeBytes,
}: {
  id: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}) {
  const href = `/api/files/${id}`;
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <div className="overflow-hidden rounded-md border border-[#e0d8c8] bg-white">
      {isImage ? (
        // Authenticated document route; next/image cannot apply session cookies to blob URLs.
        <img src={href} alt={originalName} className="max-h-80 w-full bg-[#f7f3e8] object-contain sm:max-h-[28rem]" />
      ) : isPdf ? (
        <iframe
          src={href}
          title={originalName}
          className="h-64 w-full bg-[#f7f3e8] sm:h-[28rem]"
        />
      ) : (
        <p className="px-3 py-8 text-center text-sm text-[#6f675c]">Preview is not available for this file type.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eee6d6] px-3 py-2 text-xs">
        <span className="min-w-0 truncate text-[#5c564c]">
          {originalName} · {fileSizeLabel(sizeBytes)}
        </span>
        <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[var(--huef-green)] underline">
          Open full file
        </a>
      </div>
    </div>
  );
}
