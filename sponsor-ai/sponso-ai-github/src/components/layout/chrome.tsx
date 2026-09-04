"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#eligibility", label: "Eligibility" },
    { href: "/#how-it-works", label: "How to apply" },
    { href: "/login", label: "Sign in" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9c98a] bg-[var(--huef-green)] text-white">
      <div className="h-1.5 bg-[var(--huef-gold)]" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
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
            <Link key={link.href} href={link.href} className="hover:text-[var(--huef-gold)]">
              {link.label}
            </Link>
          ))}
          <Button asChild variant="gold" size="sm">
            <Link href="/register">Create account</Link>
          </Button>
        </nav>

        <button
          type="button"
          className="rounded-md p-2 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-white/15 px-4 py-4 text-sm lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Button asChild variant="gold" className="w-full">
            <Link href="/register">Create account</Link>
          </Button>
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
