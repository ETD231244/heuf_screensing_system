"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions";
import { Badge, Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

type Notice = {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  createdAt: Date | string;
  readAt: Date | string | null;
  sender: { email: string } | null;
  application: { id: string; programName: string } | null;
};

function tone(type: string): "green" | "red" | "amber" | "blue" | "neutral" {
  if (type === "SUCCESS") return "green";
  if (type === "ERROR") return "red";
  if (type === "WARNING") return "amber";
  if (type === "ANNOUNCEMENT") return "blue";
  return "neutral";
}

export function NotificationList({ items }: { items: Notice[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(items);

  function markOne(id: string) {
    start(async () => {
      await markNotificationRead(id);
      setLocal((rows) => rows.map((row) => (row.id === id ? { ...row, readAt: new Date() } : row)));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markAllNotificationsRead();
              setLocal((rows) => rows.map((row) => ({ ...row, readAt: row.readAt ?? new Date() })));
              router.refresh();
            })
          }
        >
          Mark all as read
        </Button>
      </div>
      {local.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-[#6f675c]">You have no notices yet.</CardBody>
        </Card>
      ) : (
        <ul className="space-y-3">
          {local.map((item) => (
            <li key={item.id}>
              <Card className={item.readAt ? "" : "ring-1 ring-[var(--huef-gold)]"}>
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[var(--huef-green-dark)]">{item.title}</p>
                      <p className="text-xs text-[#6f675c]">
                        {item.sender?.email ?? "HUEF system"} · {formatDateTime(item.createdAt)}
                        {item.application ? ` · ${item.application.programName}` : ""}
                      </p>
                    </div>
                    <Badge tone={tone(item.type)}>{item.readAt ? "Read" : "Unread"}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-[#3f3a34]">{item.message}</p>
                  {!item.readAt ? (
                    <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => markOne(item.id)}>
                      Mark as read
                    </Button>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
