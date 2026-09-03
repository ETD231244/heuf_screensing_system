"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminSaveDocumentType,
  adminSaveInstitution,
  adminSaveLlg,
  adminSavePeriod,
  adminSaveProgram,
} from "@/app/staff-actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { HELA_DISTRICTS, PNG_PROVINCES } from "@/lib/constants";

export function LookupsManager({
  institutions,
  programs,
  districts,
  documentTypes,
  period,
}: {
  institutions: Array<{ id: string; code: string; name: string; category: string }>;
  programs: Array<{ id: string; name: string }>;
  districts: Array<{ id: string; name: string; llgs: Array<{ id: string; name: string }> }>;
  documentTypes: Array<{ id: string; code: string; label: string }>;
  period: { academicYear: string; title: string; opensAt: string; closesAt: string } | null;
}) {
  const router = useRouter();
  const [, start] = useTransition();

  function submit(action: (data: FormData) => Promise<unknown>, form: HTMLFormElement) {
    start(async () => {
      await action(new FormData(form));
      form.reset();
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Application period</CardTitle></CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(adminSavePeriod, e.currentTarget); }}>
            <Field label="Academic year" htmlFor="academicYear"><Input id="academicYear" name="academicYear" defaultValue={period?.academicYear ?? "2026"} /></Field>
            <Field label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={period?.title ?? "2026 Tuition Fee Assistance"} /></Field>
            <Field label="Opens" htmlFor="opensAt"><Input id="opensAt" name="opensAt" type="datetime-local" defaultValue={period?.opensAt} /></Field>
            <Field label="Closes" htmlFor="closesAt"><Input id="closesAt" name="closesAt" type="datetime-local" defaultValue={period?.closesAt} /></Field>
            <Button type="submit">Save period</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Institution</CardTitle></CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(adminSaveInstitution, e.currentTarget); }}>
            <Field label="Code" htmlFor="code"><Input id="code" name="code" required placeholder="e.g. A5" /></Field>
            <Field label="Name" htmlFor="name"><Input id="name" name="name" required placeholder="Select your institution" /></Field>
            <Field label="Category" htmlFor="category"><Input id="category" name="category" placeholder="Major universities" /></Field>
            <Field label="Province" htmlFor="province">
              <Select id="province" name="province" defaultValue=""><option value="">Select</option>{PNG_PROVINCES.map((name) => <option key={name}>{name}</option>)}</Select>
            </Field>
            <Button type="submit">Save institution</Button>
          </form>
          <p className="mt-3 text-xs text-[#6f675c]">{institutions.length} institutions on the nominated list.</p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Programme</CardTitle></CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(adminSaveProgram, e.currentTarget); }}>
            <Field label="Programme / course" htmlFor="name"><Input id="name" name="name" required placeholder="Select or enter your program" /></Field>
            <Button type="submit">Add programme</Button>
          </form>
          <ul className="mt-3 max-h-40 overflow-auto text-sm text-[#5c564c]">
            {programs.map((item) => <li key={item.id}>{item.name}</li>)}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Districts and LLGs</CardTitle></CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(adminSaveLlg, e.currentTarget); }}>
            <Field label="District" htmlFor="districtId">
              <Select id="districtId" name="districtId" required>
                <option value="">Select your district</option>
                {districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="LLG name" htmlFor="name"><Input id="name" name="name" required placeholder="Select your LLG" /></Field>
            <Button type="submit">Add LLG</Button>
          </form>
          <div className="mt-3 space-y-2 text-sm">
            {districts.map((district) => (
              <div key={district.id}>
                <p className="font-semibold">{district.name}</p>
                <p className="text-[#6f675c]">{district.llgs.map((llg) => llg.name).join(", ") || "No LLGs yet"}</p>
              </div>
            ))}
            <p className="text-xs text-[#6f675c]">Canonical districts: {HELA_DISTRICTS.join(", ")}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Required document types</CardTitle></CardHeader>
        <CardBody>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(adminSaveDocumentType, e.currentTarget); }}>
            <Field label="Code" htmlFor="code"><Input id="code" name="code" required placeholder="TRANSCRIPT" /></Field>
            <Field label="Label" htmlFor="label"><Input id="label" name="label" required placeholder="Latest academic transcript" /></Field>
            <label className="text-sm"><input type="checkbox" name="requiredForNew" className="mr-2" /> Required for new intake</label>
            <label className="text-sm"><input type="checkbox" name="requiredForContinuing" className="mr-2" /> Required for continuing</label>
            <label className="text-sm"><input type="checkbox" name="requiredForNonHela" className="mr-2" /> Required if not Hela origin</label>
            <div className="sm:col-span-2"><Button type="submit">Save document type</Button></div>
          </form>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {documentTypes.map((item) => (
              <li key={item.id} className="rounded-md bg-[var(--huef-cream)] px-3 py-2">{item.code} — {item.label}</li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
