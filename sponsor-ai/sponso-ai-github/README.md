# HUEF Online Application Screening and Management System

A web portal for the **Hela Undialu Education Foundation** (Hela Provincial Government) so students can lodge 2026 Tuition Fee Assistance applications online, and Coordinators and Administrators can screen, decide, notify, and report in one place.

Workflow:

**Account Registration → Applicant Profile → HUEF Application → Document Upload → AI Preliminary Screening → Coordinator Review → Decision/Status Update → Applicant Notification → Reporting & Audit**

The AI engine is assistive only. Authorised HUEF officials make the final verification and award decision.

## Run locally

You need Node.js 20+.

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@huef.pg | HUEF2026! |
| Coordinator | coordinator@huef.pg | HUEF2026! |
| Student (draft form) | student@huef.pg | student123 |
| Other seeded students | e.g. henene.agibe@student.pg | student123 |

`AUTH_SECRET` signs login cookies. `DATABASE_URL` points at a local SQLite file (`prisma/dev.db`). Uploaded documents are stored under `storage/documents/` and in the database.

### Google sign-in

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` and add the callback URL `{origin}/auth/google/callback` in the Google Cloud console. Email/password sign-in remains available. If a Google email already belongs to a HUEF account, the existing account is used (no duplicate). New Google users must still complete HUEF-specific profile fields.

## What applicants can do

1. Register with realistic HUEF fields, or continue with Google.
2. Upload a profile photograph and complete origin details (District → LLG).
3. Fill the 2026 form and upload required documents.
4. See application completion, missing documents, and screening issues on the dashboard.
5. Receive notices about submission, missing files, AI flags, coordinator requests, decisions, and announcements.

## What Coordinators can do

1. Work from a screening desk: totals, AI-flagged files, incomplete files, and manual review.
2. Filter by institution, district, LLG, year level, status, and screening result.
3. Open an applicant with profile photo, form data, documents, AI findings, and screening history together.
4. Override an AI recommendation with a recorded reason, request more information, approve, or reject.
5. Send notices to one applicant, a district, pending applicants, or all applicants.
6. Export reports (CSV) by institution, district, LLG, programme, year, status, and screening outcome.

## What Administrators can do

Manage users and roles, institutions, programmes, districts and LLGs, application periods, required document types, announcements, system settings, reports, and the audit trail.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Prisma. Local Preview uses SQLite. Production is meant to use **PostgreSQL** (Neon or Supabase). Uploaded documents are stored in the database so Vercel does not need a separate file server.

## Deploy

1. Create a Postgres database (Neon or Supabase). Copy the connection string.
2. Deploy to Vercel and set:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
AUTH_SECRET=a-long-random-string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

3. Against that same `DATABASE_URL`:

```bash
npx prisma db push
npm run db:seed
```

Change demo passwords before real students use the site. The screening score is a recommendation only.
