"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSaveSetting } from "@/app/staff-actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { DEFAULT_DEEPSEEK_MODEL } from "@/lib/constants";

export function SettingsForm({
  settings,
  deepSeekConfigured,
}: {
  settings: Array<{ key: string; value: string }>;
  deepSeekConfigured: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));
  return (
    <div className="space-y-5">
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

      <Card>
        <CardHeader>
          <CardTitle>DeepSeek AI screening</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-[#5c564c]">
            DeepSeek reads each submitted application and drafts a briefing for the coordinator. Get an API key from{" "}
            <a className="font-semibold text-[var(--huef-green)] underline" href="https://platform.deepseek.com" target="_blank" rel="noreferrer">
              platform.deepseek.com
            </a>
            . The official decision still stays with HUEF staff.
          </p>
          <p className="mb-4 text-sm font-semibold text-[var(--huef-green-dark)]">
            {deepSeekConfigured ? "DeepSeek is connected." : "DeepSeek is not connected yet."}
          </p>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              start(async () => {
                for (const key of ["deepseek_api_key", "deepseek_model"]) {
                  const data = new FormData();
                  data.set("key", key);
                  data.set("value", String(form.get(key) ?? ""));
                  await adminSaveSetting(data);
                }
                router.refresh();
              });
            }}
          >
            <Field label="DeepSeek API key" htmlFor="deepseek_api_key">
              <PasswordInput
                id="deepseek_api_key"
                name="deepseek_api_key"
                autoComplete="off"
                placeholder={deepSeekConfigured ? "Saved — paste a new key only if you need to replace it" : "sk-..."}
              />
            </Field>
            <Field label="Model" htmlFor="deepseek_model">
              <Select id="deepseek_model" name="deepseek_model" defaultValue={map.deepseek_model || DEFAULT_DEEPSEEK_MODEL}>
                <option value="deepseek-v4-flash">deepseek-v4-flash (fast, recommended)</option>
                <option value="deepseek-v4-pro">deepseek-v4-pro (stronger reasoning)</option>
              </Select>
            </Field>
            <Button type="submit">Save DeepSeek settings</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
