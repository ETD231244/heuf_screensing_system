# HUEF Online Application Screening and Management System

A web portal for the **Hela Undialu Education Foundation** (Hela Provincial Government) so students can lodge 2026 Tuition Fee Assistance applications online, and the Sponsorship Coordinator can screen, sort, and decide them in one place.

It replaces the current mix of email, hand delivery, and folders with:

- a student account and the official 2026 application form
- required document uploads (blocked from submitting if a file is missing)
- a coordinator dashboard filterable by district, institution, and status
- a screening assistant that checks completeness, Hela/public-servant eligibility, corporate double-dipping, and possible duplicates
- a student status page so applicants do not have to phone Tari to ask whether a file arrived

The final award always stays with the human Coordinator.

## Run locally

You need Node.js 20+.

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Coordinator | coordinator@huef.pg | HUEF2026! |
| Student (draft form) | student@huef.pg | student123 |
| Other seeded students | e.g. henene.agibe@student.pg | student123 |

Copy `.env.example` to `.env` if you are not using the values already in the repo’s local setup.

`AUTH_SECRET` signs login cookies. `DATABASE_URL` points at a local SQLite file (`prisma/dev.db`). Uploaded documents are stored under `storage/documents/`.

## What students can do

1. Register and sign in.
2. Complete the 2026 form (personal details, origin, eligibility, education, fees, declaration).
3. Upload the documents required for a new intake or a continuing student.
4. Submit only when the form and files are complete.
5. Sign back in later and see Pending, Approved, or Not successful.

## What the Coordinator can do

1. See every submitted application in one list.
2. Filter by Hela district, nominated institution, and status.
3. Open a file, read the attached PDFs/photos, and view district counts.
4. Use the screening assistant as a first pass — then Approve, Reject, or keep Pending, with an optional note the student can read.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Prisma. Local Preview uses SQLite. Production is meant to use **PostgreSQL** (Neon or Supabase). Uploaded documents are stored in the database so Vercel does not need a separate file server.

Firebase Firestore is not used: it would mean rewriting the data layer. Postgres is the same SQL style Prisma already uses.

## Deploy (easiest path)

1. Create a free Postgres database at [Neon](https://neon.tech) (or Supabase). Copy the connection string.
2. Click **Publish** in Cursor to deploy to Vercel, or import the GitHub/Origin repo in Vercel.
3. In Vercel → Settings → Environment Variables, set:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
AUTH_SECRET=a-long-random-string
```

4. Redeploy. Then, once, against that same `DATABASE_URL`:

```bash
npx prisma db push
npm run db:seed
```

Change the demo coordinator password before real students use the site.

## Production notes

- HTTPS comes with Vercel.
- Do not use the SQLite file (`file:./dev.db`) on Vercel — it will be empty after each deploy.
- The screening score is a recommendation only. The Coordinator still decides.
