import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, FileSearch, FolderOpen, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSession();
  const applyHref =
    user?.role === "ADMIN" ? "/admin" : user?.role === "COORDINATOR" ? "/coordinator" : user ? "/student" : "/register";

  return (
    <div>
      <section className="relative overflow-hidden bg-[var(--huef-green)] text-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--huef-gold)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--huef-gold)]">
              Hela Provincial Government · 2026 TFA
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">
              Apply for HUEF sponsorship in one place. Track it until a decision is made.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#e9f6ee] sm:text-lg">
              Students from Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, and Magarima — and children of public servants who have served in Hela for more than three years — can lodge a 2026 Tuition Fee Assistance application without travelling to Tari or emailing a pile of PDFs.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href={applyHref}>{user ? "Go to dashboard" : "Create a student account"}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white bg-transparent text-white hover:bg-white/10">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-white p-3 shadow-2xl">
              <Image
                src="/huef-logo.png"
                alt="Hela Undialu Education Foundation emblem"
                width={320}
                height={320}
                className="h-56 w-56 object-contain sm:h-72 sm:w-72"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e0d8c8] bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:grid-cols-3">
          <Stat label="Districts covered" value="4" detail="Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, Magarima" />
          <Stat label="Nominated institutions" value="100+" detail="Universities, colleges, national high schools, and overseas study" />
          <Stat label="Programme since" value="2018" detail="Governor Philip Undialu’s Hela student sponsorship" />
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold text-[var(--huef-green-dark)] sm:text-3xl">How the new process works</h2>
        <p className="mt-2 max-w-2xl text-[#5c564c]">
          The old process mixed email, paper envelopes, and folders on a computer. This portal keeps every application in one database, with its documents attached, and shows the student the status.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Register", text: "Create an account with your name, phone, and email — or sign in with Google, then complete HUEF-specific details." },
            { icon: GraduationCap, title: "Fill the 2026 form", text: "Personal details, origin, institution, programme, and fee information — in block letters, on a phone or a computer." },
            { icon: FolderOpen, title: "Upload documents", text: "The system checks that every required file is attached and runs a preliminary screening before you can finish." },
            { icon: FileSearch, title: "Coordinator decides", text: "DeepSeek briefs the officer on gaps, mismatches, and duplicates. A HUEF official still records Approved, Rejected, or more information." },
          ].map((item) => (
            <Card key={item.title}>
              <CardBody>
                <item.icon className="h-8 w-8 text-[var(--huef-green)]" />
                <h3 className="mt-3 font-bold text-[var(--huef-green-dark)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c564c]">{item.text}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section id="eligibility" className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-[var(--huef-green-dark)] sm:text-3xl">Who can apply</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#3f3a34]">
              {[
                "You are of Hela origin by blood and custom, regardless of social grouping, language, or political affiliation; or",
                "You are not of Hela origin, but a parent has served as a public servant in Hela for more than three years; or",
                "You yourself have served in Hela for more than three years under a public sector department.",
                "You are not already on a corporate sponsor (HUEF does not double-dip).",
                "Your institution is on the 2026 nominated list (categories A–I).",
              ].map((text) => (
                <li key={text} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--huef-green)]" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card>
            <CardBody>
              <h3 className="font-bold text-[var(--huef-green-dark)]">Documents you must attach</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--huef-green)]">New intake</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#5c564c]">
                    <li>Passport-size photo</li>
                    <li>Acceptance letter</li>
                    <li>Grade 10 and Grade 12 certificates</li>
                    <li>2026 fee structure / invoice</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--huef-green)]">Continuing</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#5c564c]">
                    <li>Passport-size photo</li>
                    <li>Confirmation letter (year level)</li>
                    <li>Latest transcript</li>
                    <li>Valid student ID</li>
                    <li>2026 fee structure / invoice</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-[#5c564c]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                Hard copies can still be lodged at the HUEF office in Tari. This portal is the single online channel that replaces scattering files across inboxes.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <p className="text-3xl font-extrabold text-[var(--huef-green)]">{value}</p>
      <p className="font-semibold text-[var(--huef-green-dark)]">{label}</p>
      <p className="text-sm text-[#6f675c]">{detail}</p>
    </div>
  );
}
