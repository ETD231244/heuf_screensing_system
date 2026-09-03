export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-[var(--huef-green-dark)]">{label}</span>
          <span className="tabular-nums text-[#5c564c]">{clamped}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-[#e4ddd0]">
        <div
          className="h-full rounded-full bg-[var(--huef-green)] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
