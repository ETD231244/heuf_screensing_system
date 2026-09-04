"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut, Menu, Shield, X } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { homeForNav, navForRole, navItemActive, pageTitleFor, workspaceLabel } from "@/lib/nav";

export function AppShell({
  user,
  unreadCount = 0,
  children,
}: {
  user: SessionUser;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = navForRole(user.role);
  const home = homeForNav(user.role);
  const title = pageTitleFor(pathname, user.role);
  const displayName = [user.givenName, user.surname].filter(Boolean).join(" ") || user.email;

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Workspace">
      {links.map((item) => {
        const Icon = item.icon;
        const active = navItemActive(pathname, item);
        const showBadge = item.href === "/notifications" && unreadCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_var(--huef-gold)]"
                : "text-[#d9eadf] hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[var(--huef-gold)]" : "text-[#b7d4c2]")} />
            <span className="flex-1 truncate">{item.label}</span>
            {showBadge ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--huef-gold)] px-1.5 text-[10px] font-bold text-[var(--huef-green-dark)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href={home} className="flex items-center gap-3 px-4 py-5" onClick={() => setOpen(false)}>
      <Image
        src="/huef-logo.png"
        alt="HUEF emblem"
        width={44}
        height={44}
        className="h-11 w-11 rounded-full bg-white object-contain p-0.5"
      />
      <span className="min-w-0">
        <span className="block text-lg font-extrabold tracking-wide text-white">HUEF</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f3e7b0]">
          {workspaceLabel(user.role)} desk
        </span>
      </span>
    </Link>
  );

  const account = (
    <div className="mt-auto border-t border-white/10 p-3">
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[var(--huef-gold)]">
          <Shield className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
          <span className="block truncate text-[11px] text-[#c5dccb]">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </span>
      </div>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white/10 text-sm font-semibold text-white hover:bg-white/20"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-full bg-[#f3efe4]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[var(--huef-green)] text-white lg:flex">
        <div className="h-1.5 bg-[var(--huef-gold)]" />
        {brand}
        <p className="px-6 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9fbfab]">
          Navigation
        </p>
        {nav}
        {account}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,86vw)] flex-col bg-[var(--huef-green)] text-white shadow-2xl">
            <div className="h-1.5 bg-[var(--huef-gold)]" />
            <div className="flex items-center justify-between pr-2">
              {brand}
              <button type="button" className="mr-3 rounded-md p-2" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {account}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#e0d8c8] bg-white/95 px-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 text-[var(--huef-green-dark)] lg:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--huef-green-dark)] sm:text-base">{title}</p>
              <p className="hidden truncate text-[11px] text-[#7a7266] sm:block">
                Hela Undialu Education Foundation · 2026 TFA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-[var(--huef-green-dark)] hover:bg-[var(--huef-cream)]"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--huef-gold)]" />
              ) : null}
            </Link>
            <span className="hidden max-w-48 truncate px-2 text-xs font-medium text-[#5c564c] sm:inline">
              {user.email}
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#e8e0d0] px-4 py-3 text-center text-[11px] text-[#7a7266]">
          Hela Provincial Government · Sponsorship records are confidential and used only to assess TFA.
        </footer>
      </div>
    </div>
  );
}
