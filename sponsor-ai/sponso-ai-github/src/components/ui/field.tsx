import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-[#cfc6b4] bg-white px-3 py-2 text-base text-[var(--huef-ink)] shadow-sm placeholder:text-[#8a8376] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--huef-green)] disabled:cursor-not-allowed disabled:bg-[#f3f0e8]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-[#cfc6b4] bg-white px-3 py-2 text-base text-[var(--huef-ink)] shadow-sm placeholder:text-[#8a8376] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--huef-green)] disabled:cursor-not-allowed disabled:bg-[#f3f0e8]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-md border border-[#cfc6b4] bg-white px-3 py-2 text-base text-[var(--huef-ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--huef-green)] disabled:cursor-not-allowed disabled:bg-[#f3f0e8]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold text-[var(--huef-green-dark)]", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-[var(--huef-red)]">*</span> : null}
        {optional ? <span className="ml-1 text-xs font-medium text-[#7a7266]">(optional)</span> : null}
      </Label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-[var(--huef-red)]">{error}</p> : null}
      {hint && !error ? <p className="mt-1 text-xs text-[#6f675c]">{hint}</p> : null}
    </div>
  );
}
