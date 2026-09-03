"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";

export function SiteHeader({
  user,
  unreadCount = 0,
}: {
  user: SessionUser | null;
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const home =
    user?.role === "ADMIN" ? "/admin" : user?.role === "COORDINATOR" ? "/coordinator" : user ? "/student" : "/";

  const links =
    !user
      ? [
          { href: "/#eligibility", label: "Eligibility" },
          { href: "/#how-it-works", label: "How to apply" },
          { href: "/login", label: "Sign in" },
        ]
      : user.role === "ADMIN"
        ? [
            { href: "/admin", label: "Admin" },
            { href: "/coordinator", label: "Applications" },
            { href: "/admin/reports", label: "Reports" },
            { href: "/notifications", label: "Notices" },
          ]
        : user.role === "COORDINATOR"
          ? [
              { href: "/coordinator", label: "Applications" },
              { href: "/coordinator/notices", label: "Send notice" },
              { href: "/coordinator/reports", label: "Reports" },
              { href: "/notifications", label: "Notices" },
            ]
          : [
              { href: "/student", label: "Dashboard" },
              { href: "/student/apply", label: "Apply" },
              { href: "/student/profile", label: "Profile" },
              { href: "/notifications", label: "Notices" },
            ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9c98a] bg-[var(--huef-green)] text-white">
      <div className="h-1.5 bg-[var(--huef-gold)]" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href={home} className="flex min-w-0 items-center gap-3">
          <Image
            src="/huef-logo.png"
            alt="Hela Undialu Education Foundation logo"
            width={56}
            height={56}
            className="h-12 w-12 rounded-full bg-white object-contain p-0.5 sm:h-14 sm:w-14"
          />
          <span className="min-w-0">
            <span className="block text-lg font-extrabold tracking-wide sm:text-xl">HUEF</span>
            <span className="hidden truncate text-[11px] uppercase tracking-[0.14em] text-[#f3e7b0] sm:block">
              Empowering education — transforming futures
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="relative hover:text-[var(--huef-gold)]">
              {link.label}
              {link.href === "/notifications" && unreadCount > 0 ? (
                <span className="absolute -right-3 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--huef-gold)] px-1 text-[10px] font-bold text-[var(--huef-green-dark)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ))}
          {user ? (
            <form action="/auth/logout" method="post">
              <Button variant="gold" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild variant="gold" size="sm">
              <Link href="/register">Create account</Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          {user ? (
            <Link
              href="/notifications"
              className="relative rounded-md p-2"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--huef-gold)]" />
              ) : null}
            </Link>
          ) : null}
          <button
            type="button"
            className="rounded-md p-2"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-white/15 px-4 py-4 text-sm lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block" onClick={() => setOpen(false)}>
              {link.label}
              {link.href === "/notifications" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Link>
          ))}
          {user ? (
            <form action="/auth/logout" method="post">
              <Button variant="gold" className="w-full" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild variant="gold" className="w-full">
              <Link href="/register">Create account</Link>
            </Button>
          )}
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#d9c98a] bg-[var(--huef-green-dark)] text-[#f4ecd7]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold tracking-wide text-white">HUEF</p>
          <p className="mt-2 text-sm leading-6">
            Hela Undialu Education Foundation — the Hela Provincial Government’s tuition fee
            assistance for Hela students at universities, colleges, and national high schools.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--huef-gold)]">
            Coordinator
          </p>
          <p className="mt-2 text-sm leading-6">
            Mr David Liyago
            <br />
            Phone: 7412 2491
            <br />
            huefsponsorship@gmail.com
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--huef-gold)]">Office</p>
          <p className="mt-2 text-sm leading-6">
            Education Department Building, next to White House
            <br />
            Tari, Hela Province
            <br />
            Monday–Friday, 8:00am–4:00pm
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-[#d9c98a]">
        Hela Provincial Government · Sponsorship records are confidential and used only to assess TFA.
      </div>
    </footer>
  );
}
