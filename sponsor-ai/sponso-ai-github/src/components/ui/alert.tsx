import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const tones = {
  success: {
    box: "border-[#b7dcc6] bg-[#eef7f1] text-[var(--huef-green-dark)]",
    icon: CheckCircle2,
  },
  error: {
    box: "border-[#f1b7c0] bg-[#fde8eb] text-[#8e1528]",
    icon: XCircle,
  },
  warning: {
    box: "border-[#ffe08a] bg-[#fff8dc] text-[#6a5200]",
    icon: AlertTriangle,
  },
  info: {
    box: "border-[#c5d9f0] bg-[#eef4fb] text-[#1a4d70]",
    icon: Info,
  },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const conf = tones[tone];
  const Icon = conf.icon;
  return (
    <div className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", conf.box, className)} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-0.5 leading-6" : "leading-6"}>{children}</div>
      </div>
    </div>
  );
}
