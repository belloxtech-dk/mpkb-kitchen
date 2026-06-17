# MPKB · Kitchen Integrity

A bilingual (Bahasa Indonesia / English) web app that uses Claude to monitor a school‑meal (MBG) kitchen for integrity:

- **Floor** — SOP/hygiene compliance on CCTV‑style frames (streamed AI reasoning + verdict).
- **Books** — financial‑integrity auditing of procurement (ghost meals, markups, duplicate invoices, …).
- **Ledger** — a tamper‑evident, hash‑chained record that seals every AI judgement.

Access is invite‑only via magic link, with `superadmin` / `admin` / `user` roles.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM + PostgreSQL · Better Auth · Zod · Anthropic SDK.

## Prerequisites

- **Node 22** (pinned in `.nvmrc` — run `nvm use`)
- **pnpm** 10+
- **PostgreSQL** running locally
- An **Anthropic API key**

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create the database
createdb mpkb_kitchen          # or: psql -c 'CREATE DATABASE mpkb_kitchen;'

# 3. Configure env
cp .env.example .env.local
#   then edit .env.local and set at least:
#     ANTHROPIC_API_KEY=sk-ant-...                       (required)
#     BETTER_AUTH_SECRET=...        (required — `openssl rand -base64 32`)
#     SUPERADMIN_EMAIL=you@example.com   (so you can sign in — see below)
#   DATABASE_URL defaults to postgresql://localhost:5432/mpkb_kitchen; set it only if different.

# 4. Create tables + seed your superadmin
pnpm db:migrate
pnpm seed

# 5. Run
pnpm dev                       # http://localhost:3786
```

## Signing in (dev)

The app is **invite‑only via magic link**, and with no email provider configured the sign‑in link is **printed to the `pnpm dev` terminal**.

1. Open the app → you're sent to `/landing`.
2. Enter the email you seeded (`SUPERADMIN_EMAIL`) → **Send sign‑in link**.
3. Copy the `🔗 [magic-link] …` URL from the `pnpm dev` terminal into your browser.

(To send real emails instead, set `BREVO_API_KEY` + `EMAIL_FROM` in `.env.local`.)

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start` — dev / build / production (port 3786)
- `pnpm db:generate` — generate a migration after editing `db/schema.ts`
- `pnpm db:migrate` — apply migrations
- `pnpm seed` — make `SUPERADMIN_EMAIL` a superadmin (idempotent)
- `pnpm db:studio` — open Drizzle Studio

## Layout

- `app/` — routes: `(authed)/` (gated app), `landing/` (public sign‑in), `api/`
- `components/` — UI · `lib/` — `auth`, `i18n`, `vision`, `finance`, config · `db/` — Drizzle schema + migrations
- `public/frames/` — staged CCTV frames (`manifest.json` + per‑zone images)
