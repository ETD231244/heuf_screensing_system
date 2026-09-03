export function profileCompletion(options: {
  givenName?: string | null;
  surname?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  districtId?: string | null;
  llgName?: string | null;
  wardVillage?: string | null;
  clanName?: string | null;
  hasPhoto?: boolean;
}) {
  const checks = [
    Boolean(options.givenName?.trim()),
    Boolean(options.surname?.trim()),
    Boolean(options.gender && options.gender !== "U"),
    Boolean(options.dateOfBirth),
    Boolean(options.phone?.trim()),
    Boolean(options.districtId),
    Boolean(options.llgName?.trim()),
    Boolean(options.wardVillage?.trim()),
    Boolean(options.clanName?.trim()),
    Boolean(options.hasPhoto),
  ];
  const done = checks.filter(Boolean).length;
  return {
    done,
    total: checks.length,
    percent: Math.round((done / checks.length) * 100),
  };
}

export function applicationCompletion(options: {
  profilePercent: number;
  hasInstitution: boolean;
  hasProgram: boolean;
  hasYear: boolean;
  uploaded: number;
  required: number;
  declared: boolean;
  submitted: boolean;
}) {
  const parts = [
    options.profilePercent >= 70,
    options.hasInstitution,
    options.hasProgram,
    options.hasYear,
    options.required > 0 ? options.uploaded >= options.required : false,
    options.declared || options.submitted,
  ];
  const extra = options.required > 0 ? Math.min(1, options.uploaded / options.required) : 0;
  const base = parts.filter(Boolean).length / parts.length;
  const percent = Math.round((base * 0.85 + extra * 0.15) * 100);
  return Math.max(0, Math.min(100, options.submitted ? Math.max(percent, 90) : percent));
}
