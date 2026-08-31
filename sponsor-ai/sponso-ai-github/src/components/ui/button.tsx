"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--huef-gold)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--huef-green)] text-white hover:bg-[var(--huef-green-dark)]",
        gold: "bg-[var(--huef-gold)] text-[var(--huef-green-dark)] hover:bg-[#e6b800]",
        outline:
          "border border-[var(--huef-green)] bg-white text-[var(--huef-green)] hover:bg-[var(--huef-cream)]",
        ghost: "text-[var(--huef-green)] hover:bg-[var(--huef-cream)]",
        danger: "bg-[var(--huef-red)] text-white hover:bg-[#a31830]",
        secondary: "bg-[var(--huef-cream)] text-[var(--huef-green-dark)] hover:bg-[#ebe4d4]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
