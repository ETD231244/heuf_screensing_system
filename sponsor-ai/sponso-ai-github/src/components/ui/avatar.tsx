import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function Avatar({
  userId,
  name,
  hasPhoto,
  size = 56,
  className,
}: {
  userId: string;
  name: string;
  hasPhoto?: boolean;
  size?: number;
  className?: string;
}) {
  const dim = `${size}px`;
  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/photos/${userId}`}
        alt={`${name} profile photograph`}
        width={size}
        height={size}
        className={cn("rounded-full border border-[#d9c98a] object-cover bg-white", className)}
        style={{ width: dim, height: dim }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[#e7efe9] text-[var(--huef-green)]",
        className,
      )}
      style={{ width: dim, height: dim }}
      aria-label={`${name} has not uploaded a photograph`}
    >
      <UserRound style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

export function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <Image
      src="/huef-logo.png"
      alt="Hela Undialu Education Foundation emblem"
      width={size}
      height={size}
      className="rounded-full bg-white object-contain p-0.5"
    />
  );
}
