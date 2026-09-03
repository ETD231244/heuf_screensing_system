"use client";

import { useState, useTransition } from "react";
import { adminSaveUser } from "@/app/staff-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { ROLE_LABELS } from "@/lib/constants";

export function UserManager({
  users,
}: {
  users: Array<{ id: string; email: string; role: string; isActive: boolean }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(form: HTMLFormElement) {
    const data = new FormData(form);
    setError(null);
    start(async () => {
      const result = await adminSaveUser(data);
      if (result && "error" in result) {
        setError(result.error ?? "Could not save that account.");
        return;
      }
      setMessage(result.message);
      form.reset();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create or update a user</CardTitle>
        </CardHeader>
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(event.currentTarget);
            }}
          >
            {error ? <Alert tone="error">{error}</Alert> : null}
            {message ? <Alert tone="success">{message}</Alert> : null}
            <Field label="Existing account" htmlFor="id" optional>
              <Select id="id" name="id" defaultValue="">
                <option value="">Create a new account</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({ROLE_LABELS[user.role] ?? user.role})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Email address" htmlFor="email" required>
              <Input id="email" name="email" type="email" required placeholder="e.g. coordinator2@huef.pg" />
            </Field>
            <Field label="Role" htmlFor="role" required>
              <Select id="role" name="role" defaultValue="STUDENT">
                <option value="STUDENT">Applicant</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="ADMIN">Administrator</option>
              </Select>
            </Field>
            <Field label="Active" htmlFor="isActive">
              <Select id="isActive" name="isActive" defaultValue="true">
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </Select>
            </Field>
            <Field label="Password" htmlFor="password" hint="Required for new accounts. Leave blank to keep the current password.">
              <Input id="password" name="password" type="password" minLength={8} placeholder="At least 8 characters" />
            </Field>
            <Field label="Given name (new applicants)" htmlFor="givenName" optional>
              <Input id="givenName" name="givenName" placeholder="e.g. John T." />
            </Field>
            <Field label="Surname (new applicants)" htmlFor="surname" optional>
              <Input id="surname" name="surname" placeholder="e.g. Doe" />
            </Field>
            <Button type="submit" disabled={pending}>Save user</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#eee6d6] px-3 py-2">
              <div>
                <p className="font-semibold">{user.email}</p>
                <p className="text-xs text-[#6f675c]">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
              <span className="text-xs">{user.isActive ? "Active" : "Disabled"}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
