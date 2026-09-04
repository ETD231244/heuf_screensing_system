import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { unreadNotificationCount } from "@/lib/notify";
import { SiteFooter, SiteHeader } from "@/components/layout/chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUEF Online Application Screening and Management System",
  description:
    "Apply online for Hela Undialu Education Foundation tuition fee assistance and track your application status.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSession();
  const unread = user ? await unreadNotificationCount(user.id) : 0;
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col antialiased">
        <SiteHeader user={user} unreadCount={unread} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
