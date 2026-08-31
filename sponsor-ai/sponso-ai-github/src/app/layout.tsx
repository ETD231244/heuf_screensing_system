import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { SiteFooter, SiteHeader } from "@/components/layout/chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUEF Online Application Screening and Management System",
  description:
    "Apply online for Hela Undialu Education Foundation tuition fee assistance and track your application status.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col antialiased">
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
