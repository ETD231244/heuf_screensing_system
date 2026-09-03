"use client";

import { useState, useTransition } from "react";
import { sendApplicantNotice } from "@/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { HELA_DISTRICTS } from "@/lib/constants";

export function NoticeForm({
  applicants,
}: {
  applicants: Array<{ id: string; name: string; email: string }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a notice</CardTitle>
      </CardHeader>
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setError(null);
            start(async () => {
              const result = await sendApplicantNotice(data);
              if (result && "error" in result) {
                setError(result.error ?? "Could not send that notice.");
                return;
              }
              setMessage(result.message ?? "Notice sent.");
              event.currentTarget.reset();
            });
          }}
        >
          {error ? <Alert tone="error">{error}</Alert> : null}
          {message ? <Alert tone="success">{message}</Alert> : null}
          <Field label="Audience" htmlFor="audience" required>
            <Select id="audience" name="audience" defaultValue="ONE">
              <option value="ONE">One applicant</option>
              <option value="PENDING">All pending applicants</option>
              <option value="DISTRICT">All applicants in a district</option>
              <option value="ALL_APPLICANTS">All applicants</option>
            </Select>
          </Field>
          <Field label="Applicant" htmlFor="userId" optional>
            <Select id="userId" name="userId" defaultValue="">
              <option value="">Select if sending to one person</option>
              {applicants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.email}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="District" htmlFor="districtName" optional>
            <Select id="districtName" name="districtName" defaultValue="">
              <option value="">Select if sending by district</option>
              {HELA_DISTRICTS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Title" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="e.g. Missing Grade 12 certificate" />
          </Field>
          <Field label="Message" htmlFor="message" required>
            <Textarea id="message" name="message" required placeholder="Write a clear notice the applicant will see in their Notification Centre." />
          </Field>
          <Button type="submit" disabled={pending}>
            Send notice
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
