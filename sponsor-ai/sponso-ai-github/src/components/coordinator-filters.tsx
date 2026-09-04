"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/field";
import { HELA_DISTRICTS, SCREENING_STATUS_LABELS, YEAR_LEVELS, llgsForDistrict } from "@/lib/constants";

export function CoordinatorFilters({
  institutions,
  initial,
}: {
  institutions: Array<{ id: string; code: string; name: string }>;
  initial: {
    district?: string;
    llg?: string;
    institution?: string;
    status?: string;
    screening?: string;
    year?: string;
    q?: string;
  };
}) {
  const [district, setDistrict] = useState(initial.district ?? "");
  const [llg, setLlg] = useState(initial.llg ?? "");
  const llgs = useMemo(() => llgsForDistrict(district), [district]);

  return (
    <form className="grid gap-3 rounded-xl border border-[#e0d8c8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <input
        name="q"
        defaultValue={initial.q ?? ""}
        placeholder="Search name, email, programme"
        className="h-11 rounded-md border border-[#cfc6b4] px-3"
      />
      <Select
        name="district"
        value={district}
        onChange={(e) => {
          setDistrict(e.target.value);
          setLlg("");
        }}
      >
        <option value="">All districts</option>
        {HELA_DISTRICTS.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </Select>
      <Select name="llg" value={llg} onChange={(e) => setLlg(e.target.value)}>
        <option value="">All LLGs</option>
        {llgs.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </Select>
      <Select name="institution" defaultValue={initial.institution ?? ""}>
        <option value="">All institutions</option>
        {institutions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.code} — {item.name}
          </option>
        ))}
      </Select>
      <Select name="year" defaultValue={initial.year ?? ""}>
        <option value="">All year levels</option>
        {YEAR_LEVELS.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </Select>
      <Select name="status" defaultValue={initial.status ?? ""}>
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="MORE_INFO">More information</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Not successful</option>
      </Select>
      <Select name="screening" defaultValue={initial.screening ?? ""}>
        <option value="">All screening results</option>
        {Object.entries(SCREENING_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>
      <button type="submit" className="h-11 rounded-md bg-[var(--huef-green)] px-4 text-sm font-semibold text-white">
        Filter
      </button>
    </form>
  );
}
