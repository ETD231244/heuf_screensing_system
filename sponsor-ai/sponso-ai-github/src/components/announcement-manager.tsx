"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSaveAnnouncement } from "@/app/staff-actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatDateTime } from "@/lib/utils";

export function AnnouncementManager({
  items,
}: {
  items: Array<{ id: string; title: string; body: string; audience: string; createdAt: Date | string; deadlineAt: Date | string | null }>;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Publish an announcement</CardTitle></CardHeader>
        <CardBody>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              start(async () => {
                await adminSaveAnnouncement(new FormData(form));
                form.reset();
                router.refresh();
              });
            }}
          >
            <Field label="Title" htmlFor="title" required>
              <Input id="title" name="title" required placeholder="e.g. 2026 TFA closing date" />
            </Field>
            <Field label="Message" htmlFor="body" required>
              <Textarea id="body" name="body" required placeholder="Important HUEF announcement or deadline." />
            </Field>
            <Field label="Audience" htmlFor="audience">
              <Select id="audience" name="audience" defaultValue="STUDENT">
                <option value="ALL">Everyone</option>
                <option value="STUDENT">Applicants</option>
                <option value="COORDINATOR">Coordinators</option>
              </Select>
            </Field>
            <Field label="Deadline (optional)" htmlFor="deadlineAt">
              <Input id="deadlineAt" name="deadlineAt" type="datetime-local" />
            </Field>
            <Button type="submit">Publish</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Published</CardTitle></CardHeader>
        <CardBody className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-[#eee6d6] px-3 py-2">
              <p className="font-semibold">{item.title}</p>
              <p className="text-[#5c564c]">{item.body}</p>
              <p className="text-xs text-[#6f675c]">
                {item.audience} · {formatDateTime(item.createdAt)}
                {item.deadlineAt ? ` · deadline ${formatDateTime(item.deadlineAt)}` : ""}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
