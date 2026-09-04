"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  id,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <Input
        id={id}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="none"
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-[#6f675c] hover:text-[var(--huef-green-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--huef-green)]"
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
