export { DISTRICT_LLGS, HELA_DISTRICTS, llgsForDistrict, type HelaDistrict } from "./geo";

export const ACADEMIC_YEAR = "2026";
export const SESSION_COOKIE = "huef_session";
export const FLASH_COOKIE = "huef_flash";
export const GOOGLE_STATE_COOKIE = "huef_google_oauth";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const APPLICATION_DEADLINE_LABEL = "Friday 13 February 2026";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const YEAR_LEVELS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "5th year / final",
  "Grade 11",
  "Grade 12",
  "Postgraduate",
] as const;

export const COMMON_PROGRAMS = [
  "Bachelor of Education",
  "Bachelor of Information Systems",
  "Bachelor of Science",
  "Bachelor of Arts",
  "Bachelor of Business",
  "Bachelor of Engineering (Civil)",
  "Bachelor of Nursing",
  "Diploma of Primary Teaching",
  "Certificate in Community Health Work",
  "Grade 11",
  "Grade 12",
  "Other / not listed",
] as const;

export const USER_ROLES = ["STUDENT", "COORDINATOR", "ADMIN"] as const;

export const SCREENING_STATUSES = [
  "PASSED_INITIAL",
  "NEEDS_REVIEW",
  "INFORMATION_MISMATCH",
  "INCORRECT_DOCUMENT",
  "UNREADABLE_DOCUMENT",
  "MISSING_REQUIRED",
  "POTENTIAL_DUPLICATE",
  "UNABLE_TO_DETERMINE",
] as const;

export type ScreeningStatus = (typeof SCREENING_STATUSES)[number];

export const SCREENING_STATUS_LABELS: Record<ScreeningStatus, string> = {
  PASSED_INITIAL: "Passed Initial Screening",
  NEEDS_REVIEW: "Needs Review",
  INFORMATION_MISMATCH: "Information Mismatch",
  INCORRECT_DOCUMENT: "Incorrect Document",
  UNREADABLE_DOCUMENT: "Unreadable Document",
  MISSING_REQUIRED: "Missing Required Document",
  POTENTIAL_DUPLICATE: "Potential Duplicate",
  UNABLE_TO_DETERMINE: "AI Unable to Determine",
};

export const PNG_PROVINCES = [
  "Hela",
  "Southern Highlands",
  "Enga",
  "Western Highlands",
  "Jiwaka",
  "Simbu",
  "Eastern Highlands",
  "Morobe",
  "Madang",
  "East Sepik",
  "West Sepik",
  "Manus",
  "New Ireland",
  "East New Britain",
  "West New Britain",
  "Bougainville",
  "Oro",
  "Milne Bay",
  "Central",
  "Gulf",
  "Western",
  "NCD",
  "Other / Overseas",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  MORE_INFO: "More information requested",
  APPROVED: "Approved",
  REJECTED: "Not successful",
};

export const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Applicant",
  COORDINATOR: "Coordinator",
  ADMIN: "Administrator",
};

export const ELIGIBILITY_LABELS: Record<string, string> = {
  HELA_ORIGIN: "Hela origin by blood and custom",
  PUBLIC_SERVANT_CHILD: "Child of a public servant serving in Hela (3+ years)",
  PUBLIC_SERVANT_SELF: "Public servant serving in Hela (3+ years)",
};

export const FEE_CATEGORY_LABELS: Record<string, string> = {
  HUEF_TFA: "HUEF Tuition Fee Assistance",
  SELF_SPONSOR: "Self sponsor",
  CORPORATE: "Corporate sponsor",
  HECAS_TESA: "HECAS / TESA",
  OTHER: "Other",
};

export const STUDY_LEVEL_LABELS: Record<string, string> = {
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  NATIONAL_HIGH_SCHOOL: "National High School",
  OVERSEAS: "Overseas studies",
};

export const DOCUMENT_LABELS: Record<string, string> = {
  PASSPORT_PHOTO: "Passport-size photo",
  ACCEPTANCE_LETTER: "Acceptance / offer letter",
  GRADE_10: "Grade 10 certificate",
  GRADE_12: "Grade 12 certificate",
  FEE_STRUCTURE: "2026 school fee structure / invoice",
  CONFIRMATION_LETTER: "Confirmation letter (year level)",
  TRANSCRIPT: "Latest academic transcript",
  STUDENT_ID: "Valid student ID",
  SUPPORT_LETTER: "Support letter (non-Hela origin)",
};

export function requiredDocuments(applicantType: string, eligibilityPath: string) {
  const docs =
    applicantType === "CONTINUING"
      ? [
          "PASSPORT_PHOTO",
          "CONFIRMATION_LETTER",
          "FEE_STRUCTURE",
          "TRANSCRIPT",
          "STUDENT_ID",
        ]
      : [
          "PASSPORT_PHOTO",
          "ACCEPTANCE_LETTER",
          "GRADE_10",
          "GRADE_12",
          "FEE_STRUCTURE",
        ];

  if (eligibilityPath !== "HELA_ORIGIN") {
    docs.push("SUPPORT_LETTER");
  }
  return docs;
}

export const INSTITUTIONS = [
  { code: "A1", name: "University of Papua New Guinea (UPNG)", category: "Major universities" },
  { code: "A2", name: "University of Goroka (UOG)", category: "Major universities" },
  { code: "A3", name: "PNG University of Technology (UNITECH)", category: "Major universities" },
  { code: "A4", name: "Pacific Adventist University (PAU)", category: "Major universities" },
  { code: "A5", name: "Divine Word University (DWU)", category: "Major universities" },
  { code: "A6", name: "Don Bosco Technological Institute", category: "Major universities" },
  { code: "A7", name: "University of Natural Resources & Environment (UNRE)", category: "Major universities" },
  { code: "A8", name: "IBS University", category: "Major universities" },
  { code: "B1", name: "Dauli Teachers College", category: "Teachers colleges" },
  { code: "B2", name: "Holy Trinity Teachers College", category: "Teachers colleges" },
  { code: "B3", name: "Simbu Teachers College", category: "Teachers colleges" },
  { code: "B4", name: "Telua (Goroka) Teachers College", category: "Teachers colleges" },
  { code: "B5", name: "Madang Teachers College", category: "Teachers colleges" },
  { code: "B6", name: "Balob Teachers College", category: "Teachers colleges" },
  { code: "B7", name: "PNG Education Institute", category: "Teachers colleges" },
  { code: "B8", name: "Melanesian Nazarene Teachers College", category: "Teachers colleges" },
  { code: "B9", name: "Sonoma Adventist College", category: "Teachers colleges" },
  { code: "B10", name: "Peter Channel College of Secondary Teacher Education", category: "Teachers colleges" },
  { code: "B11", name: "Innovative University of Enga", category: "Teachers colleges" },
  { code: "B12", name: "Gaulim Teachers College", category: "Teachers colleges" },
  { code: "B13", name: "Kabaleo Teachers College", category: "Teachers colleges" },
  { code: "B14", name: "Kelua Teachers College", category: "Teachers colleges" },
  { code: "B15", name: "Katagu Lutheran Teachers College", category: "Teachers colleges" },
  { code: "B16", name: "EA Jiwaka Teachers College", category: "Teachers colleges" },
  { code: "B17", name: "Rev. Maru Teachers College", category: "Teachers colleges" },
  { code: "B18", name: "Southern Highlands Teachers College", category: "Teachers colleges" },
  { code: "B19", name: "UOG DFL — Hela", category: "Teachers colleges" },
  { code: "B20", name: "Mesauka Teachers College", category: "Teachers colleges" },
  { code: "B21", name: "Nuku Teachers College", category: "Teachers colleges" },
  { code: "B22", name: "Sacred Heart Teachers College", category: "Teachers colleges" },
  { code: "B23", name: "AOG Jubilee Higher Learning Institute", category: "Teachers colleges" },
  { code: "C1", name: "Mendi School of Nursing", category: "Nursing colleges" },
  { code: "C2", name: "St. Barnabas Nursing College", category: "Nursing colleges" },
  { code: "C3", name: "Tombil CHW", category: "Nursing colleges" },
  { code: "C4", name: "Highlands Regional Nursing College", category: "Nursing colleges" },
  { code: "C5", name: "Rumginae Nursing College", category: "Nursing colleges" },
  { code: "C6", name: "Kumin CHW", category: "Nursing colleges" },
  { code: "C7", name: "St. Gerard’s CHW Training College", category: "Nursing colleges" },
  { code: "C8", name: "St. Mary’s Vunapope Nursing College", category: "Nursing colleges" },
  { code: "C9", name: "Raihu (Aitape) CHW Training College", category: "Nursing colleges" },
  { code: "C10", name: "Kundiawa College of Nursing", category: "Nursing colleges" },
  { code: "C11", name: "Professional Accelerate Institute — School of Nursing", category: "Nursing colleges" },
  { code: "C12", name: "West New Britain School of Nursing", category: "Nursing colleges" },
  { code: "C13", name: "Telefomin CHW Training College", category: "Nursing colleges" },
  { code: "C14", name: "Kundiawa CHW Training College", category: "Nursing colleges" },
  { code: "C15", name: "Tinsley CHW Training College", category: "Nursing colleges" },
  { code: "C16", name: "Tuna Bay School of Nursing", category: "Nursing colleges" },
  { code: "C17", name: "Rabaul CHW Training School", category: "Nursing colleges" },
  { code: "C18", name: "Kwikila CHW Training School", category: "Nursing colleges" },
  { code: "C19", name: "Lae School of Nursing", category: "Nursing colleges" },
  { code: "C20", name: "Kumgumanda 4Square CHW Training College", category: "Nursing colleges" },
  { code: "C21", name: "East Sepik School of Nursing", category: "Nursing colleges" },
  { code: "C22", name: "Career Training Institute (CTI)", category: "Nursing colleges" },
  { code: "C23", name: "Tari CHW Training College", category: "Nursing colleges" },
  { code: "C24", name: "Bulu (Karkar Island) CHW Training College", category: "Nursing colleges" },
  { code: "D1", name: "Mt. Hagen Technical College", category: "Technical & business colleges" },
  { code: "D2", name: "Goroka Technical College", category: "Technical & business colleges" },
  { code: "D3", name: "National Polytechnic College", category: "Technical & business colleges" },
  { code: "D4", name: "Port Moresby Technical College", category: "Technical & business colleges" },
  { code: "D5", name: "Port Moresby Business College", category: "Technical & business colleges" },
  { code: "D6A", name: "Don Bosco Technical College — Gabutu", category: "Technical & business colleges" },
  { code: "D6B", name: "Don Bosco Technical College — Simbu", category: "Technical & business colleges" },
  { code: "D7", name: "Madang Technical College", category: "Technical & business colleges" },
  { code: "D8", name: "Highlands Agricultural College", category: "Technical & business colleges" },
  { code: "D9", name: "Kokopo Business College", category: "Technical & business colleges" },
  { code: "E1", name: "Somare Institute of Leadership & Governance", category: "Major private institutions" },
  { code: "E2", name: "Asia Pacific Institute of Applied Science", category: "Major private institutions" },
  { code: "E3", name: "International Training Institute (ITI)", category: "Major private institutions" },
  { code: "E4", name: "DATEC — POM & Lae", category: "Major private institutions" },
  { code: "E5", name: "Mapex Training Institute", category: "Major private institutions" },
  { code: "E6", name: "Kumul Training Institute", category: "Major private institutions" },
  { code: "E7", name: "Acatech Aviation College", category: "Major private institutions" },
  { code: "E8", name: "Highlands Youth & Rehabilitation", category: "Major private institutions" },
  { code: "E9", name: "PNG Power College", category: "Major private institutions" },
  { code: "F1", name: "Institute of Banking & Business Management (IBBM)", category: "Minor private institutions" },
  { code: "F2", name: "Lenerg PNG Computers & Health Science Institute", category: "Minor private institutions" },
  { code: "F3", name: "IEA College of TAFE", category: "Minor private institutions" },
  { code: "F4", name: "PNG Human Resources Institute", category: "Minor private institutions" },
  { code: "F5", name: "Hewate TVET", category: "Minor private institutions" },
  { code: "F6", name: "Ipau TVET", category: "Minor private institutions" },
  { code: "F7", name: "Auwi TVET", category: "Minor private institutions" },
  { code: "F8", name: "Homaria TVET", category: "Minor private institutions" },
  { code: "G1", name: "Christian Leadership Training College", category: "Theological / Bible colleges" },
  { code: "G2", name: "Rarotonga Theological College", category: "Theological / Bible colleges" },
  { code: "G3", name: "Omaura School of Ministry", category: "Theological / Bible colleges" },
  { code: "G4", name: "Maria Bible Skul", category: "Theological / Bible colleges" },
  { code: "G5", name: "St. Paul’s Bible College", category: "Theological / Bible colleges" },
  { code: "G6", name: "Ambassadors Bible College", category: "Theological / Bible colleges" },
  { code: "H1", name: "Aiyura National High School", category: "National high schools" },
  { code: "H2", name: "Sogeri National High School", category: "National high schools" },
  { code: "H3", name: "Wawin National High School", category: "National high schools" },
  { code: "H4", name: "Kerevat National High School", category: "National high schools" },
  { code: "H5", name: "Passam National High School", category: "National high schools" },
  { code: "I1", name: "Australia (overseas studies)", category: "Overseas studies" },
  { code: "I2", name: "China (overseas studies)", category: "Overseas studies" },
  { code: "I3", name: "Fiji (overseas studies)", category: "Overseas studies" },
  { code: "I4", name: "New Zealand (overseas studies)", category: "Overseas studies" },
  { code: "I5", name: "Philippines (overseas studies)", category: "Overseas studies" },
  { code: "I6", name: "USA (overseas studies)", category: "Overseas studies" },
  { code: "I7", name: "Other overseas studies", category: "Overseas studies" },
] as const;
