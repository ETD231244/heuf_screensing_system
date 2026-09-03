import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#e0d8c8] bg-white shadow-[0_8px_30px_rgba(11,61,37,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-[#eee6d6] px-5 py-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-bold text-[var(--huef-green-dark)]", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "green" | "red" | "blue" | "amber";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[#f1ece1] text-[#4d463c]",
    gold: "bg-[#fff3c2] text-[#7a5b00]",
    green: "bg-[#d9f0e2] text-[#0b4d2c]",
    red: "bg-[#fde2e6] text-[#8e1528]",
    blue: "bg-[#e4f2fb] text-[#1a4d70]",
    amber: "bg-[#ffe8cc] text-[#8a4b00]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): "gold" | "green" | "red" | "neutral" | "blue" | "amber" {
  switch (status) {
    case "PENDING":
      return "gold";
    case "APPROVED":
    case "PASSED_INITIAL":
      return "green";
    case "REJECTED":
    case "INCORRECT_DOCUMENT":
    case "UNREADABLE_DOCUMENT":
      return "red";
    case "DRAFT":
      return "blue";
    case "MORE_INFO":
    case "NEEDS_REVIEW":
    case "INFORMATION_MISMATCH":
    case "POTENTIAL_DUPLICATE":
    case "UNABLE_TO_DETERMINE":
    case "MISSING_REQUIRED":
      return "amber";
    default:
      return "neutral";
  }
}
