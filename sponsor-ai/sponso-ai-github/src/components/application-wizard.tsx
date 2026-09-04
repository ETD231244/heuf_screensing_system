"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, Trash2, Upload } from "lucide-react";
import { saveDraft, submitApplication, uploadDocument, removeDocument } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import {
  COMMON_PROGRAMS,
  ELIGIBILITY_LABELS,
  FEE_CATEGORY_LABELS,
  HELA_DISTRICTS,
  PNG_PROVINCES,
  SCREENING_STATUS_LABELS,
  STUDY_LEVEL_LABELS,
  YEAR_LEVELS,
  documentLabel,
  llgsForDistrict,
  requiredDocuments,
  type DocumentTypeRule,
} from "@/lib/constants";
import { fileSizeLabel } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";

type Institution = { id: string; code: string; name: string; category: string };
type Doc = {
  id: string;
  type: string;
  originalName: string;
  sizeBytes: number;
  screeningStatus?: string | null;
};

export type WizardValues = {
  givenName: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  age: string;
  phone: string;
  email: string;
  studentId: string;
  clanName: string;
  wardVillage: string;
  llgName: string;
  districtName: string;
  province: string;
  fatherFullName: string;
  fatherOccupation: string;
  fatherClan: string;
  fatherWard: string;
  fatherDistrict: string;
  fatherProvince: string;
  fatherPhone: string;
  motherFullName: string;
  motherOccupation: string;
  motherClan: string;
  motherWard: string;
  motherDistrict: string;
  motherProvince: string;
  motherPhone: string;
  eligibilityPath: string;
  publicServantWho: string;
  publicServantDepartment: string;
  publicServantOccupation: string;
  publicServantYears: string;
  publicServantSupervisor: string;
  publicServantSupervisorPhone: string;
  institutionId: string;
  programName: string;
  studyType: string;
  studyLevel: string;
  yearOfStudy: string;
  expectedCompletion: string;
  institutionProvince: string;
  registrarPhone: string;
  registrarEmail: string;
  applicantType: string;
  lastSecondarySchool: string;
  yearCompleted: string;
  feeCategory: string;
  otherFeeType: string;
  tuitionFees: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankBranch: string;
  witnessName: string;
  witnessTitle: string;
  witnessVillage: string;
  witnessDistrict: string;
  witnessPhone: string;
};

const STEPS = [
  "Personal",
  "Family & origin",
  "Eligibility",
  "Education",
  "Fees",
  "Documents",
  "Review",
];

export function ApplicationWizard({
  initial,
  institutions,
  programs = [],
  documentTypes = [],
  documents: initialDocuments,
}: {
  initial: WizardValues;
  institutions: Institution[];
  programs?: Array<{ id: string; name: string; institutionId: string | null }>;
  documentTypes?: DocumentTypeRule[];
  documents: Doc[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initial);
  const [documents, setDocuments] = useState(initialDocuments);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [declaration, setDeclaration] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof WizardValues>(key: K, value: WizardValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function asFormData(extra?: Record<string, string>) {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.set(key, value));
    if (declaration) data.set("declaration", "yes");
    Object.entries(extra ?? {}).forEach(([key, value]) => data.set(key, value));
    return data;
  }

  const needed = requiredDocuments(values.applicantType, values.eligibilityPath, documentTypes);
  const have = new Set(documents.map((doc) => doc.type));
  const missing = needed.filter((type) => !have.has(type));
  const llgs = llgsForDistrict(values.districtName);
  const programChoices = useMemo(() => {
    const fromInstitution = programs
      .filter((item) => !item.institutionId || item.institutionId === values.institutionId)
      .map((item) => item.name);
    return [...new Set([...fromInstitution, ...COMMON_PROGRAMS])];
  }, [programs, values.institutionId]);
  const groupedInstitutions = useMemo(() => {
    const groups = new Map<string, Institution[]>();
    for (const item of institutions) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return groups;
  }, [institutions]);

  function save(next?: number) {
    setError(null);
    startTransition(async () => {
      const result = await saveDraft(asFormData());
      if (result && "error" in result) {
        setError(result.error ?? "Could not save the draft.");
        return;
      }
      setMessage("Draft saved.");
      if (typeof next === "number") setStep(next);
      router.refresh();
    });
  }

  function onUpload(type: string, file: File) {
    setError(null);
    setWarning(null);
    const data = asFormData();
    data.set("type", type);
    data.set("file", file);
    startTransition(async () => {
      await saveDraft(asFormData());
      const result = await uploadDocument(data);
      if (result && "error" in result) {
        setError(result.error ?? "This document could not be verified. Please review the highlighted issue or upload the correct document.");
        return;
      }
      if (result && "warning" in result && result.warning) {
        setWarning(result.warning);
      } else {
        setMessage(result?.message ?? `${documentLabel(type, documentTypes)} was uploaded successfully and is awaiting screening.`);
      }
      router.refresh();
      setDocuments((current) => {
        const without = current.filter((doc) => doc.type !== type);
        return [
          ...without,
          {
            id: `tmp-${type}`,
            type,
            originalName: file.name,
            sizeBytes: file.size,
            screeningStatus: result && "status" in result ? result.status : null,
          },
        ];
      });
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      const result = await removeDocument(id);
      if (result && "error" in result) {
        setError(result.error ?? "Could not remove that file.");
        return;
      }
      setDocuments((current) => current.filter((doc) => doc.id !== id));
      router.refresh();
    });
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitApplication(asFormData());
      if (result && "error" in result) {
        setError(result.error ?? "Could not submit the application.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`w-full rounded-lg border px-2 py-2 text-left text-xs font-semibold ${
                index === step
                  ? "border-[var(--huef-gold)] bg-[var(--huef-green)] text-white"
                  : index < step
                    ? "border-[#c8e3d2] bg-[#eef7f1] text-[var(--huef-green)]"
                    : "border-[#e0d8c8] bg-white text-[#6f675c]"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wide opacity-80">
                Step {index + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : null}
      {warning && !error ? <Alert tone="warning">{warning}</Alert> : null}
      {message && !error && !warning ? (
        <Alert tone="success">{message}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Given name" htmlFor="givenName" required>
                <Input id="givenName" value={values.givenName} onChange={(e) => set("givenName", e.target.value)} className="uppercase" placeholder="e.g. John T." />
              </Field>
              <Field label="Surname" htmlFor="surname" required>
                <Input id="surname" value={values.surname} onChange={(e) => set("surname", e.target.value)} className="uppercase" placeholder="e.g. Doe" />
              </Field>
              <Field label="Gender" htmlFor="gender" required>
                <Select id="gender" value={values.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </Select>
              </Field>
              <Field label="Date of birth" htmlFor="dateOfBirth" required>
                <Input id="dateOfBirth" type="date" value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Age" htmlFor="age">
                <Input id="age" inputMode="numeric" value={values.age} onChange={(e) => set("age", e.target.value)} />
              </Field>
              <Field label="Contact number" htmlFor="phone" required hint="e.g. +675 7XX XXX XX">
                <Input id="phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. +675 7XX XXX XX" />
              </Field>
              <Field label="Student ID" htmlFor="studentId" optional>
                <Input id="studentId" value={values.studentId} onChange={(e) => set("studentId", e.target.value)} placeholder="Student ID Number" />
              </Field>
              <Field label="Email address" htmlFor="email" hint="This is the email on your HUEF account.">
                <Input id="email" value={values.email} disabled placeholder="e.g. john.doe@example.com" />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--huef-green)]">Your origin</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Clan name" htmlFor="clanName" required>
                    <Input id="clanName" value={values.clanName} onChange={(e) => set("clanName", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Ward / village" htmlFor="wardVillage" required>
                    <Input id="wardVillage" value={values.wardVillage} onChange={(e) => set("wardVillage", e.target.value)} className="uppercase" placeholder="Enter your ward or village" />
                  </Field>
                  <Field label="District" htmlFor="districtName" required>
                    <Select
                      id="districtName"
                      value={values.districtName}
                      onChange={(e) => {
                        set("districtName", e.target.value);
                        set("llgName", "");
                      }}
                    >
                      <option value="">Select your district</option>
                      {HELA_DISTRICTS.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="LLG" htmlFor="llgName" required>
                    <Select id="llgName" value={values.llgName} onChange={(e) => set("llgName", e.target.value)}>
                      <option value="">Select your LLG</option>
                      {llgs.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Province" htmlFor="province">
                    <Select id="province" value={values.province} onChange={(e) => set("province", e.target.value)}>
                      {PNG_PROVINCES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--huef-green)]">Father</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Father’s full name" htmlFor="fatherFullName" required>
                    <Input id="fatherFullName" value={values.fatherFullName} onChange={(e) => set("fatherFullName", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Occupation" htmlFor="fatherOccupation">
                    <Input id="fatherOccupation" value={values.fatherOccupation} onChange={(e) => set("fatherOccupation", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Clan" htmlFor="fatherClan">
                    <Input id="fatherClan" value={values.fatherClan} onChange={(e) => set("fatherClan", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Ward / village" htmlFor="fatherWard">
                    <Input id="fatherWard" value={values.fatherWard} onChange={(e) => set("fatherWard", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="District" htmlFor="fatherDistrict">
                    <Input id="fatherDistrict" value={values.fatherDistrict} onChange={(e) => set("fatherDistrict", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Province" htmlFor="fatherProvince">
                    <Select id="fatherProvince" value={values.fatherProvince} onChange={(e) => set("fatherProvince", e.target.value)}>
                      <option value="">Select</option>
                      {PNG_PROVINCES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Contact number" htmlFor="fatherPhone">
                    <Input id="fatherPhone" value={values.fatherPhone} onChange={(e) => set("fatherPhone", e.target.value)} />
                  </Field>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--huef-green)]">Mother</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mother’s full name" htmlFor="motherFullName" required>
                    <Input id="motherFullName" value={values.motherFullName} onChange={(e) => set("motherFullName", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Occupation" htmlFor="motherOccupation">
                    <Input id="motherOccupation" value={values.motherOccupation} onChange={(e) => set("motherOccupation", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Clan" htmlFor="motherClan">
                    <Input id="motherClan" value={values.motherClan} onChange={(e) => set("motherClan", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Ward / village" htmlFor="motherWard">
                    <Input id="motherWard" value={values.motherWard} onChange={(e) => set("motherWard", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="District" htmlFor="motherDistrict">
                    <Input id="motherDistrict" value={values.motherDistrict} onChange={(e) => set("motherDistrict", e.target.value)} className="uppercase" />
                  </Field>
                  <Field label="Province" htmlFor="motherProvince">
                    <Select id="motherProvince" value={values.motherProvince} onChange={(e) => set("motherProvince", e.target.value)}>
                      <option value="">Select</option>
                      {PNG_PROVINCES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Contact number" htmlFor="motherPhone">
                    <Input id="motherPhone" value={values.motherPhone} onChange={(e) => set("motherPhone", e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Field label="How are you eligible for HUEF?" htmlFor="eligibilityPath" required>
                <Select id="eligibilityPath" value={values.eligibilityPath} onChange={(e) => set("eligibilityPath", e.target.value)}>
                  {Object.entries(ELIGIBILITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
              {values.eligibilityPath !== "HELA_ORIGIN" ? (
                <div className="grid gap-4 rounded-lg border border-[#ffe08a] bg-[#fff8dc] p-4 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-sm text-[#6a5200]">
                    If you are not of Hela origin, a parent (or you) must have served as a public servant in Hela for more than three years. Attach a support letter on the Documents step.
                  </p>
                  <Field label="Who is the public servant?" htmlFor="publicServantWho">
                    <Select id="publicServantWho" value={values.publicServantWho} onChange={(e) => set("publicServantWho", e.target.value)}>
                      <option value="">Select</option>
                      <option value="SELF">Myself</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                    </Select>
                  </Field>
                  <Field label="Department" htmlFor="publicServantDepartment">
                    <Input id="publicServantDepartment" value={values.publicServantDepartment} onChange={(e) => set("publicServantDepartment", e.target.value)} />
                  </Field>
                  <Field label="Occupation and location" htmlFor="publicServantOccupation">
                    <Input id="publicServantOccupation" value={values.publicServantOccupation} onChange={(e) => set("publicServantOccupation", e.target.value)} />
                  </Field>
                  <Field label="Years working in Hela" htmlFor="publicServantYears" required>
                    <Input id="publicServantYears" inputMode="numeric" value={values.publicServantYears} onChange={(e) => set("publicServantYears", e.target.value)} />
                  </Field>
                  <Field label="Departmental supervisor" htmlFor="publicServantSupervisor">
                    <Input id="publicServantSupervisor" value={values.publicServantSupervisor} onChange={(e) => set("publicServantSupervisor", e.target.value)} />
                  </Field>
                  <Field label="Supervisor phone" htmlFor="publicServantSupervisorPhone">
                    <Input id="publicServantSupervisorPhone" value={values.publicServantSupervisorPhone} onChange={(e) => set("publicServantSupervisorPhone", e.target.value)} />
                  </Field>
                </div>
              ) : (
                <p className="rounded-lg bg-[#eef7f1] px-4 py-3 text-sm text-[var(--huef-green-dark)]">
                  Hela-origin applicants must be of Hela origin by blood and custom, regardless of social grouping, language, or political affiliation.
                </p>
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Applicant type" htmlFor="applicantType" required>
                <Select id="applicantType" value={values.applicantType} onChange={(e) => set("applicantType", e.target.value)}>
                  <option value="NEW_INTAKE">New intake / first year</option>
                  <option value="CONTINUING">Continuing / re-enrolling</option>
                </Select>
              </Field>
              <Field label="Institution (2026 nominated list)" htmlFor="institutionId" required>
                <Select
                  id="institutionId"
                  value={values.institutionId}
                  onChange={(e) => {
                    set("institutionId", e.target.value);
                    set("programName", "");
                  }}
                >
                  <option value="">Select institution</option>
                  {[...groupedInstitutions.entries()].map(([category, items]) => (
                    <optgroup key={category} label={category}>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} — {item.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field label="Programme / course" htmlFor="programName" required hint="Choose a programme listed for this institution, or type your exact course name.">
                <Input id="programName" value={values.programName} onChange={(e) => set("programName", e.target.value)} list="huef-programs" placeholder="Select or enter your program" />
                <datalist id="huef-programs">
                  {programChoices.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </Field>
              <Field label="Study level" htmlFor="studyLevel">
                <Select id="studyLevel" value={values.studyLevel} onChange={(e) => set("studyLevel", e.target.value)}>
                  {Object.entries(STUDY_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Type of study" htmlFor="studyType">
                <Select id="studyType" value={values.studyType} onChange={(e) => set("studyType", e.target.value)}>
                  <option value="">Select</option>
                  <option value="Full time">Full time</option>
                  <option value="Part time">Part time</option>
                  <option value="DFL">Distance / flexible learning</option>
                </Select>
              </Field>
              <Field label="Year of study in 2026" htmlFor="yearOfStudy" required>
                <Select id="yearOfStudy" value={values.yearOfStudy} onChange={(e) => set("yearOfStudy", e.target.value)}>
                  <option value="">Select your current year</option>
                  {YEAR_LEVELS.map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Expected completion year" htmlFor="expectedCompletion">
                <Input id="expectedCompletion" value={values.expectedCompletion} onChange={(e) => set("expectedCompletion", e.target.value)} />
              </Field>
              <Field label="Province of the institution" htmlFor="institutionProvince">
                <Select id="institutionProvince" value={values.institutionProvince} onChange={(e) => set("institutionProvince", e.target.value)}>
                  <option value="">Select</option>
                  {PNG_PROVINCES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="School registrar phone" htmlFor="registrarPhone">
                <Input id="registrarPhone" value={values.registrarPhone} onChange={(e) => set("registrarPhone", e.target.value)} />
              </Field>
              <Field label="School registrar email" htmlFor="registrarEmail">
                <Input id="registrarEmail" type="email" value={values.registrarEmail} onChange={(e) => set("registrarEmail", e.target.value)} />
              </Field>
              {values.applicantType === "NEW_INTAKE" ? (
                <>
                  <Field label="Last secondary / national high school" htmlFor="lastSecondarySchool">
                    <Input id="lastSecondarySchool" value={values.lastSecondarySchool} onChange={(e) => set("lastSecondarySchool", e.target.value)} />
                  </Field>
                  <Field label="Year completed" htmlFor="yearCompleted">
                    <Input id="yearCompleted" value={values.yearCompleted} onChange={(e) => set("yearCompleted", e.target.value)} />
                  </Field>
                </>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fee payment category" htmlFor="feeCategory" required hint="Corporate sponsorship is treated as double-dipping and is not assisted.">
                <Select id="feeCategory" value={values.feeCategory} onChange={(e) => set("feeCategory", e.target.value)}>
                  {Object.entries(FEE_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Other sponsor type (if any)" htmlFor="otherFeeType">
                <Input id="otherFeeType" value={values.otherFeeType} onChange={(e) => set("otherFeeType", e.target.value)} />
              </Field>
              <Field label="Tuition fees charged for 2026 (PGK)" htmlFor="tuitionFees" required>
                <Input id="tuitionFees" value={values.tuitionFees} onChange={(e) => set("tuitionFees", e.target.value)} placeholder="e.g. 12500.00" />
              </Field>
              <Field label="Institution account name" htmlFor="accountName">
                <Input id="accountName" value={values.accountName} onChange={(e) => set("accountName", e.target.value)} />
              </Field>
              <Field label="Account number" htmlFor="accountNumber">
                <Input id="accountNumber" value={values.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
              </Field>
              <Field label="Bank" htmlFor="bankName">
                <Select id="bankName" value={values.bankName} onChange={(e) => set("bankName", e.target.value)}>
                  <option value="">Select</option>
                  <option>BSP</option>
                  <option>Kina Bank</option>
                  <option>Westpac</option>
                  <option>ANZ</option>
                  <option>Other</option>
                </Select>
              </Field>
              <Field label="Branch" htmlFor="bankBranch" hint="e.g. Tari, Boroko, Mt Hagen">
                <Input id="bankBranch" value={values.bankBranch} onChange={(e) => set("bankBranch", e.target.value)} />
              </Field>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <p className="text-sm text-[#5c564c]">
                Upload PDF, JPG, or PNG files up to 5 MB each. New intakes and continuing students have different required files. The system will not let you submit until every required file is attached.
              </p>
              {needed.map((type) => {
                const existing = documents.find((doc) => doc.type === type);
                return (
                  <div key={type} className="rounded-lg border border-[#e0d8c8] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--huef-green-dark)]">{documentLabel(type, documentTypes)}</p>
                        {existing ? (
                          <p className="mt-1 text-sm text-[#5c564c]">
                            {existing.originalName} · {fileSizeLabel(existing.sizeBytes)}
                            {existing.screeningStatus
                              ? ` · ${SCREENING_STATUS_LABELS[existing.screeningStatus as keyof typeof SCREENING_STATUS_LABELS] ?? existing.screeningStatus}`
                              : ""}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-[var(--huef-red)]">Not uploaded yet</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[var(--huef-green)] px-3 text-sm font-semibold text-white">
                          <Upload className="h-4 w-4" />
                          {existing ? "Replace" : "Upload"}
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) onUpload(type, file);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        {existing && !existing.id.startsWith("tmp-") ? (
                          <Button type="button" variant="outline" onClick={() => onRemove(existing.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <ReviewRow label="Applicant" value={`${values.givenName} ${values.surname}`} />
                <ReviewRow label="Contact" value={values.phone} />
                <ReviewRow label="District" value={values.districtName || "—"} />
                <ReviewRow label="Eligibility" value={ELIGIBILITY_LABELS[values.eligibilityPath]} />
                <ReviewRow label="Applicant type" value={values.applicantType === "CONTINUING" ? "Continuing" : "New intake"} />
                <ReviewRow label="Programme" value={values.programName || "—"} />
                <ReviewRow label="Year of study" value={values.yearOfStudy || "—"} />
                <ReviewRow label="Fee category" value={FEE_CATEGORY_LABELS[values.feeCategory]} />
                <ReviewRow label="Documents still missing" value={missing.length ? missing.map((t) => documentLabel(t, documentTypes)).join(", ") : "None"} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Witness name (councillor, pastor, or community leader)" htmlFor="witnessName" required>
                  <Input id="witnessName" value={values.witnessName} onChange={(e) => set("witnessName", e.target.value)} />
                </Field>
                <Field label="Title" htmlFor="witnessTitle">
                  <Input id="witnessTitle" value={values.witnessTitle} onChange={(e) => set("witnessTitle", e.target.value)} />
                </Field>
                <Field label="Village / church" htmlFor="witnessVillage">
                  <Input id="witnessVillage" value={values.witnessVillage} onChange={(e) => set("witnessVillage", e.target.value)} />
                </Field>
                <Field label="Witness district" htmlFor="witnessDistrict">
                  <Input id="witnessDistrict" value={values.witnessDistrict} onChange={(e) => set("witnessDistrict", e.target.value)} />
                </Field>
                <Field label="Witness phone" htmlFor="witnessPhone">
                  <Input id="witnessPhone" value={values.witnessPhone} onChange={(e) => set("witnessPhone", e.target.value)} />
                </Field>
              </div>
              <label className="flex items-start gap-3 rounded-lg bg-[var(--huef-cream)] p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                />
                <span>
                  I declare that the details on this application are true. I understand that incomplete or false information can cause my application to be omitted from 2026 HUEF Tuition Fee Assistance, and that the Coordinator makes the final decision.
                </span>
              </label>
              <p className="text-xs text-[#6f675c]">
                After you submit, you can still log in to see the status. You cannot edit a submitted file unless the Coordinator returns it to pending after speaking with you.
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" disabled={pending} onClick={() => save()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save draft
        </Button>
        <div className="flex gap-3">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep((n) => n - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button type="button" disabled={pending} onClick={() => save(step + 1)}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" disabled={pending || !declaration} onClick={onSubmit}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Submit application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--huef-cream)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7266]">{label}</p>
      <p className="font-medium text-[var(--huef-ink)]">{value || "—"}</p>
    </div>
  );
}
