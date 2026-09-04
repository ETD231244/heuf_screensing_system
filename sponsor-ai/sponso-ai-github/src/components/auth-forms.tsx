"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";

const LOGIN_ERRORS: Record<string, string> = {
  missing: "Enter your email address and password to sign in.",
  invalid: "Incorrect email or password. Please check your details and try again.",
  locked: "Too many sign-in attempts. Please wait a few minutes and try again.",
  disabled: "This HUEF account has been disabled. Contact the office in Tari.",
  google_unconfigured:
    "Google sign-in is not enabled on this server yet. Please use your HUEF email and password, or ask the administrator to configure Google authentication.",
  google_denied: "Google sign-in was cancelled. You can try again or use your email and password.",
  google_invalid: "That Google sign-in link was not valid. Please try again.",
  google_failed: "Google sign-in could not be completed. Please try again or use your email and password.",
  google_mismatch: "This Google account does not match the HUEF record. Sign in with email and password instead.",
};

const REGISTER_ERRORS: Record<string, string> = {
  invalid: "Please check the form. Full name, a valid email, a PNG phone number, and an 8-character password are required.",
  mismatch: "The passwords do not match. Please enter the same password in both fields.",
  exists: "An account already exists with this email address. Please sign in instead.",
};

function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href="/auth/google"
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b4] bg-white px-4 text-sm font-semibold text-[#3f3a34] hover:bg-[var(--huef-cream)]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {label}
    </a>
  );
}

export function LoginForm({ errorCode }: { errorCode?: string }) {
  const error = errorCode ? LOGIN_ERRORS[errorCode] ?? "Could not sign in. Please try again." : null;
  return (
    <form action="/auth/login" method="post" className="space-y-4">
      <Field label="Email address" htmlFor="email" required hint="Use the email on your HUEF account.">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="e.g. john.doe@example.com"
        />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
        />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[var(--huef-green)] px-6 text-base font-semibold text-white hover:bg-[var(--huef-green-dark)]"
        type="submit"
      >
        Sign in
      </button>
      <div className="relative py-1 text-center text-xs font-semibold uppercase tracking-wide text-[#7a7266]">
        <span className="relative z-10 bg-white px-2">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-[#e0d8c8]" />
      </div>
      <GoogleButton label="Continue with Google" />
    </form>
  );
}

export function RegisterForm({ errorCode }: { errorCode?: string }) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const error =
    localError ??
    (errorCode ? REGISTER_ERRORS[errorCode] ?? "Could not create the account. Please try again." : null);

  return (
    <form
      action="/auth/register"
      method="post"
      className="space-y-4"
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const password = String(data.get("password") ?? "");
        const confirm = String(data.get("confirmPassword") ?? "");
        const next: Record<string, string> = {};
        if (password !== confirm) {
          next.confirmPassword = "The passwords do not match. Please enter the same password in both fields.";
        }
        if (password.length < 8) {
          next.password = "Password must be at least 8 characters.";
        }
        setFieldErrors(next);
        if (Object.keys(next).length) {
          event.preventDefault();
          setLocalError(next.confirmPassword || next.password);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full given name" htmlFor="givenName" required>
          <Input id="givenName" name="givenName" required className="uppercase" placeholder="e.g. John T." />
        </Field>
        <Field label="Surname" htmlFor="surname" required>
          <Input id="surname" name="surname" required className="uppercase" placeholder="e.g. Doe" />
        </Field>
      </div>
      <Field
        label="Email address"
        htmlFor="email"
        required
        hint="Use an email you can check. This is how you sign back in to see your status."
      >
        <Input id="email" name="email" type="email" required placeholder="e.g. john.doe@example.com" />
      </Field>
      <Field
        label="Phone number"
        htmlFor="phone"
        required
        hint="PNG mobile numbers usually start with 7. Include the country code if you can."
      >
        <Input id="phone" name="phone" required placeholder="e.g. +675 7XX XXX XX" inputMode="tel" />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        required
        error={fieldErrors.password}
        hint="At least 8 characters. Type the same password in both boxes."
      >
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required placeholder="Create a password" />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" required error={fieldErrors.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="Re-enter your password"
        />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[var(--huef-green)] px-6 text-base font-semibold text-white hover:bg-[var(--huef-green-dark)]"
        type="submit"
      >
        Create student account
      </button>
      <div className="relative py-1 text-center text-xs font-semibold uppercase tracking-wide text-[#7a7266]">
        <span className="relative z-10 bg-white px-2">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-[#e0d8c8]" />
      </div>
      <GoogleButton label="Register with Google" />
      <p className="text-xs leading-5 text-[#6f675c]">
        After Google authentication you must still complete HUEF-specific details (phone, district, LLG, and origin). If this email already has a HUEF account, you will be signed into that account instead of creating a duplicate.
      </p>
      <p className="text-center text-sm">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[var(--huef-green)] underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
