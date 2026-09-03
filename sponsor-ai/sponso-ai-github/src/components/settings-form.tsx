"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSaveSetting } from "@/app/staff-actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export function SettingsForm({ settings }: { settings: Array<{ key: string; value: string }> }) {
  const router = useRouter();
  const [, start] = useTransition();
  const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));
  return (
    <Card>
      <CardHeader><CardTitle>Operational settings</CardTitle></CardHeader>
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              for (const key of ["support_phone", "support_email", "deadline_label", "office_hours"]) {
                const data = new FormData();
                data.set("key", key);
                data.set("value", String(form.get(key) ?? ""));
                await adminSaveSetting(data);
              }
              router.refresh();
            });
          }}
        >
          <Field label="Support phone" htmlFor="support_phone">
            <Input id="support_phone" name="support_phone" defaultValue={map.support_phone ?? "7412 2491"} />
          </Field>
          <Field label="Support email" htmlFor="support_email">
            <Input id="support_email" name="support_email" defaultValue={map.support_email ?? "huefsponsorship@gmail.com"} />
          </Field>
          <Field label="Public deadline label" htmlFor="deadline_label">
            <Input id="deadline_label" name="deadline_label" defaultValue={map.deadline_label ?? "Friday 13 February 2026"} />
          </Field>
          <Field label="Office hours" htmlFor="office_hours">
            <Input id="office_hours" name="office_hours" defaultValue={map.office_hours ?? "Monday–Friday, 8:00am–4:00pm"} />
          </Field>
          <Button type="submit">Save settings</Button>
        </form>
      </CardBody>
    </Card>
  );
}
