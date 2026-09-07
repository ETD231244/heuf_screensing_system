# HUEF Online Application Screening — PHP / MySQL edition

This folder is the same HUEF 2026 Tuition Fee Assistance system as the Next.js app, rewritten in **HTML, CSS, JavaScript, PHP, and SQL** so it can run on ordinary hosting (XAMPP, InfinityFree, cPanel).

The Next.js project under `sponso-ai-github/` is unchanged. Use this folder when you need PHP + MySQL.

## What it does

Applicants register, complete a profile, fill the 2026 TFA form, and upload required documents. Rule-based screening (and optional DeepSeek) briefs the coordinator. **Officials still record Approve, Reject, or More information.** AI does not make the award.

## Create the database

1. Create an empty MySQL / MariaDB database (utf8mb4).
2. Import **in this order** in phpMyAdmin, or from a terminal:

```bash
mysql -u USER -p DATABASE_NAME < sql/schema.sql
mysql -u USER -p DATABASE_NAME < sql/seed.sql
```

- `sql/schema.sql` — tables for districts, LLGs, institutions, programmes, users, applicants, applications, documents, screening history, notifications, announcements, audit logs, periods, document types, and settings.
- `sql/seed.sql` — Hela districts/LLGs, nominated institutions, demo accounts, and sample 2026 files.

## Configure PHP

1. Copy `config.example.php` to `config.php`.
2. Enter host, database name, user, and password from your host (InfinityFree shows these in the control panel).
3. Set `app.base_url` if the site is in a subfolder, for example `https://yoursite.infinityfreeapp.com`.
4. Make sure `storage/uploads` is writable (`chmod 775` on Linux).

## Demo logins (after seed.sql)

| Role | Email | Password |
|---|---|---|
| Administrator | admin@huef.pg | HUEF2026! |
| Coordinator | coordinator@huef.pg | HUEF2026! |
| Applicant | student@huef.pg | student123 |

Other seeded students also use `student123`.

## Run locally (XAMPP / PHP built-in server)

Place this folder in `htdocs/huef-php` (XAMPP) and open `http://localhost/huef-php/`.

Or from this directory, after MySQL is running and `config.php` is filled in:

```bash
php -S localhost:8080
```

Then open `http://localhost:8080/`.

PHP 8.0+ with PDO MySQL and the fileinfo / cURL extensions is recommended. DeepSeek needs cURL and an API key under Admin → Settings.

## InfinityFree

Upload the contents of `huef-php/` (not the Next.js app). InfinityFree does not run Node. Import the two SQL files in phpMyAdmin, then edit `config.php` with the MySQL host they give you (often not `localhost`).

Do not upload `config.php` to a public Git repo. Keep uploads under `storage/uploads` (blocked by `.htaccess`).

## Optional DeepSeek

Add the key in **Admin → Settings**. Coordinators can click **Ask DeepSeek to screen**. If the key is missing, rule checks still run.
