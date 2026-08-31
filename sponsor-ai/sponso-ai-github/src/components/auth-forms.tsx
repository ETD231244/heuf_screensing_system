"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/field";

const LOGIN_ERRORS: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "Email or password is not correct.",
};

const REGISTER_ERRORS: Record<string, string> = {
  invalid: "Check the form. Name, a valid email, phone, and an 8-character password are required.",
  mismatch: "Passwords do not match. Type the same password in both boxes.",
  exists: "An account with this email already exists. Sign in instead.",
};

export function LoginForm({ errorCode }: { errorCode?: string }) {
  const error = errorCode ? LOGIN_ERRORS[errorCode] ?? "Could not sign in. Try again." : null;
  return (
    <form action="/auth/login" method="post" className="space-y-4">
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error ? <p className="text-sm text-[var(--huef-red)]">{error}</p> : null}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[var(--huef-green)] px-6 text-base font-semibold text-white hover:bg-[var(--huef-green-dark)]"
        type="submit"
      >
        Sign in
      </button>
    </form>
  );
}

export function RegisterForm({ errorCode }: { errorCode?: string }) {
  const [localError, setLocalError] = useState<string | null>(null);
  const error =
    localError ??
    (errorCode ? REGISTER_ERRORS[errorCode] ?? "Could not create the account. Try again." : null);

  return (
    <form
      action="/auth/register"
      method="post"
      className="space-y-4"
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const password = String(data.get("password") ?? "");
        const confirm = String(data.get("confirmPassword") ?? "");
        if (password !== confirm) {
          event.preventDefault();
          setLocalError(REGISTER_ERRORS.mismatch);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Given name" htmlFor="givenName" required>
          <Input id="givenName" name="givenName" required className="uppercase" />
        </Field>
        <Field label="Surname" htmlFor="surname" required>
          <Input id="surname" name="surname" required className="uppercase" />
        </Field>
      </div>
      <Field
        label="Email"
        htmlFor="email"
        required
        hint="Use an email you can check. This is how you sign back in to see your status."
      >
        <Input id="email" name="email" type="email" required />
      </Field>
      <Field label="Contact number" htmlFor="phone" required>
        <Input id="phone" name="phone" required />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        required
        hint="At least 8 characters. Type the same password in both boxes."
      >
        <Input id="password" name="password" type="password" minLength={8} required />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" required>
        <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
      </Field>
      {error ? <p className="text-sm text-[var(--huef-red)]">{error}</p> : null}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[var(--huef-green)] px-6 text-base font-semibold text-white hover:bg-[var(--huef-green-dark)]"
        type="submit"
      >
        Create student account
      </button>
    </form>
  );
}
