# MPKB-Kitchen — CLAUDE.md

AI-driven monitoring for a commercial kitchen, framed as an **anti-corruption** system. Pilot site is
**Andrea's kitchen** on an Indonesian island, originally built for the government "free lunches"
(Makan Bergizi Gratis / MBG) program — which collapsed under a national corruption scandal before
approval. Repurposed goal: monitor every aspect of kitchen operation (food-prep SOPs, cleanliness, AND
the financials — markups, kickbacks, ghost meals) to make a certified kitchen demonstrably honest.

**Partners:** Jason (builds it) + Andrea (kitchen owner, pilot site). Andrea is technical and sharp —
the demo must show real intelligence/reasoning, not dumbed-down dashboards.

**Long-term vision (DEFERRED — not now):** sell to the government as a "system that manages systems" —
a multi-tenant control plane monitoring thousands of certified kitchens. We deliberately ignore fleet
scale until the demo proves the concept.

## Current focus: a throwaway WOW demo for Andrea (a few days out)

This demo is **explicitly disposable** — built for visual impact and to wow Andrea with the intelligence.
If it lands, we throw it away and rebuild the real thing fresh. Do NOT over-engineer for reuse/scale.

Decisions locked in (2026-06-15):
- **Stack:** TypeScript end-to-end. **Next.js + Tailwind + Anthropic TS SDK.** Single repo, single process.
- **OpenClaw: dropped for the demo.** It was considered as the orchestration core but is single-tenant
  personal-assistant-shaped; wrong fit for the fleet vision and not needed for a one-kitchen demo.
- **No OSS platform adopted.** Perplexity surfaced Frigate (CCTV — only useful for *real* cameras later,
  does object detection not SOP reasoning), checkmarble/marble (fraud rules engine — possible later for
  the financial layer, not for the demo), VoltAgent (TS agent framework — maybe for the future control
  plane). None shortcut the demo's hard part (LLM reasoning is ours regardless).
- **Inputs mocked/staged; every Claude call is REAL.** Genuine latency + genuine findings = authenticity.
- **Runs on laptop localhost** for the demo (only external dependency is the Anthropic API). VPS = backup.

### The demo: "Kitchen Integrity, live" — one screen, four acts
The wow = **streaming Claude's actual observations in real time** (show the reasoning, don't hide it).

1. **The Floor (vision)** — 3-zone CCTV wall, frames cycle under a scan line. Claude's reasoning streams
   in beside each frame; offending region highlighted; SOP checklist flips PASS/FAIL/WARN with cited rule,
   confidence, recommended action. Include one deliberately ambiguous frame → Claude returns calibrated
   "medium confidence, flagging for review" (impresses a sharp viewer). Real Telegram alert pings a phone
   (in Bahasa Indonesia).
2. **Interactive moment (trust-builder)** — Andrea drags in / shoots a fresh photo of his own kitchen;
   real-time analysis of a novel image proves it's not smoke-and-mirrors.
3. **The Books (anti-corruption gut-punch)** — staged procurement (invoice + delivery note + enrollment/
   attendance + meal counts). Agent reconciles with the arithmetic shown: ghost meals (billed > served),
   price markup vs reference, supplier concentration. No camera needed; strongest part of the pitch.
4. **The Ledger (close)** — every verdict writes to an append-only, **hash-chained** audit log shown as a
   live ticker. Edit a past entry on purpose → chain breaks → "TAMPER DETECTED". Mic-drop for an
   anti-corruption system.

### Build notes
- **Stream** Claude responses (SSE/WebSocket) so reasoning visibly types out — ~80% of the wow.
- Structured verdicts via tool-use / JSON schema drive the checklist + overlays.
- Tamper-evident ledger = hash-chained rows in Postgres + ~50 lines of hashing (don't adopt a library).
- Telegram bot (~20 lines TS) for the real phone alert; skip WhatsApp setup for the demo.
- Use the latest capable Claude model for vision + reasoning.
- Rough plan: Day 1 = scaffold + Act 1 streaming vision. Day 2 = Act 2 upload + Act 3 financials.
  Day 3 = Act 4 ledger/tamper + Telegram + polish.

### Need from Andrea (for authenticity)
- **9 kitchen frames: 3 per zone × 3 zones** (`public/frames/{a,b,c}{1,2,3}.jpg`, 16:9 ~1280×720). Per zone,
  the 3 frames are the SAME camera angle (slightly different moments) so the cycling reads as footage; plant
  a clear violation in one frame (e.g. frame 2). Currently sharp-generated **placeholders** — replace the
  files (same names) and they slot straight in. Listed in `public/frames/manifest.json` (frames-per-zone).
- One realistic day of procurement numbers: a supplier invoice, delivery note, enrollment + attendance,
  meal count. Real local prices/quantities make Act 3 land.

## Repo layout
- `docs/` — Andrea's source material. Use for the *business idea only*, NOT the tech prescriptions:
  - `mpkb-proposal-v2.html` — bilingual (ID/EN) proposal site describing a custom React+Node+Postgres
    build. Superseded on tech; useful for UI/feature reference and the demo's visual language.
  - `MPKB-cost-breakdown.txt` — old cost estimate (IDR). Budget intentionally ignored for now.
  - `OpenClaw_MBG_Presentation.pptx` — pitch deck (binary, not yet parsed).

## Conventions / notes
- Audience is Indonesian: IDR currency, Bahasa Indonesia for user-facing alert text where it adds realism
  (demo UI can be English). "MBG" = Makan Bergizi Gratis. "MPKB" = the proposal's product name.
- Use Context7 before any library/SDK work (Anthropic SDK, Next.js, etc.) — APIs move fast.
- No `PROJECT.md` yet (machine uses a CEO/PM convention under ~/Documents/Projects/). Offer to retrofit
  from `~/Documents/Projects/meta/templates/project-md.md` once past the demo.

## Engineering conventions (DRY / SSOT — follow these)
The codebase is built around single sources of truth. Before adding anything, reuse the existing SSOT:
- **Types come from Zod schemas**, never hand-written twice. `schemas/verdict.ts` and `schemas/analyze.ts`
  define shapes; infer TS types with `z.infer`. The same `VerdictSchema` is converted to the Anthropic
  tool input schema via `verdictJsonSchema()` — one shape drives validation, types, and the model contract.
- **SOP rules**: `lib/sop.ts` is the only list of kitchen rules (ids, labels, criticality). The prompt,
  the verdict enum, and the checklist UI all read from it. Add/adjust rules there only.
- **Design tokens**: `app/globals.css` `@theme` block (Tailwind v4 CSS-first) is the only place for
  colors/fonts. Utilities (`bg-pass`, `text-fail`, `font-mono`, …) derive from it. Status→class mapping
  lives once in `lib/status-styles.ts`. No hard-coded hex/colors in components.
- **Config**: `lib/config.ts` is the only reader of `process.env` (Zod-validated, lazy). Nothing else
  touches env directly. `lib/anthropic.ts` is the only Anthropic client.
- **DB access**: all reads/writes go through `db/repo.ts` (the abstraction layer); `db/index.ts` owns the
  single connection; `db/schema.ts` is the schema SSOT. Never open a second connection or inline SQL.
- **SSE contract**: `lib/events.ts` defines the event union shared by the route (producer) and
  `lib/use-analysis.ts` (consumer). Change the protocol in one place.
- Keep components presentational; put logic in `lib/`. Prefer small, composable modules. Don't duplicate —
  if you need a value/shape/style in two places, lift it to its SSOT module and import.

## Auth (Better Auth) — Push 2, done
Invite-only, magic-link sign-in. Roles **superadmin / admin / user** (hierarchy: superadmin ⊇ admin ⊇ user).
- `lib/auth.ts` (server: drizzleAdapter pg, `magicLink({disableSignUp:true})`, admin plugin, `nextCookies`),
  `lib/auth-client.ts` (browser), `lib/auth/{roles,permissions,session,email}.ts`. Auth tables in
  `db/auth-schema.ts` (user/session/account/verification). Handler at `app/api/auth/[...all]`.
- **Roles SSOT = `lib/auth/roles.ts`** (`isAdmin`, `isSuperadmin`, `assignableRoles`). Use these for gating.
- **Gating:** `proxy.ts` (Next 16 proxy convention) does the optimistic cookie redirect; the real check is
  server-side in `app/(authed)/layout.tsx` (redirect to `/landing` if no session). `/admin` (admin+super)
  and `/superadmin` (super only) re-check role in the page. App lives under `app/(authed)/`; public
  `/landing` has the magic-link form.
- **User list:** `/admin` shows all users (name/email/role/status/invited/last-sign-in/sign-ins). Status
  derived from fields: `emailVerified=false` → Invited, `true` → Active, `banned` → Banned. Sign-in metrics
  (`lastSignInAt`, `signInCount` on `user`) are bumped by a Better Auth `session.create` hook in `lib/auth.ts`
  (try/catch — never blocks auth). Query in `db/users.ts`.
- **Revoke/restore:** admin/superadmin can revoke (ban) any user **except superadmins or themselves** via
  `POST /api/admin/revoke`; uses `auth.api.banUser`/`unbanUser` (revokes sessions, blocks sign-in). Revoked
  users also get no magic-link email (the `sendMagicLink` gate skips `banned`). Reversible (Restore).
- **Invite:** admin/superadmin only, `POST /api/admin/invite` (`auth.api.createUser` + sends a magic link).
  admin can invite `user`; superadmin can invite `user`+`admin`. No public sign-up — magic link only signs in
  EXISTING (invited) users.
- **Bootstrap:** `pnpm seed` upserts jasongalvin@gmail.com as superadmin (idempotent, `db/seed.ts`).
- **Model switcher (superadmin):** `/superadmin` lets a superadmin pick the Claude model (Sonnet/Opus,
  SSOT `lib/models.ts`). Stored in the `app_settings` table; `getModel()` resolves DB setting → `ANTHROPIC_MODEL`
  env → default (Sonnet). `getModel()` is async — routes resolve it and pass `model` into vision/audit. The
  header shows a current-model badge (resolved in `app/(authed)/layout.tsx`). Flip to Opus for the demo with
  no redeploy.
- Email via Brevo HTTP API if `BREVO_API_KEY` set, else the link is console-logged (`lib/auth/email.ts`).
  `EMAIL_FROM` must use a Brevo-authenticated domain; `BETTER_AUTH_URL` builds the link, so in prod it must
  be `https://dapuramanah.com` (not localhost) or emailed links point to the wrong host.
- All auth UI is bilingual (dictionary `auth` section). Verified live: magic-link sign-in, role in session,
  invite, invite-only (uninvited email creates nothing), user blocked from /admin + /superadmin (403/redirect).

## Bilingual (i18n) — REQUIRED for all future work
The app is fully bilingual: **Bahasa Indonesia (default) + English**, toggled in the header (cookie
`mpkb_locale`, re-renders server + client). Every new feature MUST support both — no hardcoded
user-facing strings. Established pattern (keep DRY/SSOT):
- **UI strings:** add to BOTH `id` and `en` in `lib/i18n/dictionary.ts` (the `Messages` type enforces
  parity at compile time). Read via `useMessages()` (client) or `getServerMessages()` (server components /
  page titles). Interpolated strings are functions in the dictionary.
- **Enum labels:** the dictionary maps enum *values* → labels (`status`, `severity`, `risk`,
  `findingKind`). `lib/status-styles.ts` holds colour only — never labels.
- **AI text:** thread `locale` from the route into the prompt and append `messagesFor(locale).aiDirective`.
  Claude writes free-text fields in the locale but keeps JSON field names + enum values in English.
  Use generous `max_tokens` — Indonesian is ~1.5–2× more verbose; under-budgeting truncates the tool-call
  JSON and breaks Zod parsing (this bit us: bumped audit→3000, vision→2500).
- **Domain data with names:** carry both (`label`/`labelId`, as on SOP rules and finance scenarios); pick
  by `locale`.
- Files: `lib/i18n/{locale,dictionary,context,server}.ts`. Provider is wired in `app/layout.tsx`; toggle in
  `components/site-header.tsx`.

## Stack (as built)
TypeScript throughout. **Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 (CSS-first
`@theme`) · Drizzle ORM + drizzle-kit + node-postgres (PostgreSQL) · Zod 4 · Anthropic TS SDK** (streaming +
vision + tool-use). Model via `ANTHROPIC_MODEL` env (default `claude-sonnet-4-6` for dev; swap to an Opus
id for the real demo). Telegram alert optional via env.

## Running the demo (IMPORTANT: Node is not on PATH by default)
This machine has no global `node`/`npm`; Node lives under nvm. For every shell command, prepend:
`export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` (pinned in `.nvmrc`). `pnpm` is the package
manager. Then:
1. Create `.env.local` from `.env.example` and add `ANTHROPIC_API_KEY` (Jason provides a project key) and a
   `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).
2. `pnpm install`; ensure Postgres is running and create the DB (`createdb mpkb_kitchen`); set `DATABASE_URL`
   in `.env.local` if it isn't `postgresql://localhost:5432/mpkb_kitchen` (the default). Then `pnpm db:migrate`
   (creates the tables) → `pnpm seed` (makes jasongalvin@gmail.com a superadmin) → `pnpm dev`.
   - **Signing in (dev):** the app is invite-only/magic-link. With no `RESEND_API_KEY`, the sign-in link is
     **printed to the `pnpm dev` console** — copy it into the browser to sign in. Set `RESEND_API_KEY` to
     email real links.
3. Open the app, drop a kitchen photo on a zone tile (or click Add frame) → watch Claude narrate and the
   SOP checklist fill in. "Run sweep" analyzes all populated zones.
- CCTV feed: each zone cycles its frames (~2.2s) with a live timestamp/REC/scanline; click a tile to
  pause, Analyze freezes + inspects the current frame, upload replaces a zone's feed. Cosmetic only — still
  one Claude call on one frame. Frames in `public/frames/` per `manifest.json` (frames-per-zone).
- Verified working: typecheck clean, prod build green, SSE streams `status → reasoning_delta* → verdict →
  alert? → done`, and degrades to a clean `error` event if the key is missing.

## Project structure
- `app/` — `page.tsx` (Act 1 shell), `layout.tsx`, `globals.css` (theme SSOT), `api/analyze/route.ts` (SSE).
- `components/` — presentational: `kitchen-monitor` (parent), `zone-tile`, `reasoning-stream`,
  `sop-checklist`, `verdict-panel`, `alert-card`.
- `lib/` — `config`, `anthropic`, `vision` (prompt+tool+stream), `sop`, `events`, `status-styles`,
  `ledger-hash`, `frames`, `image-client`, `use-analysis` (client hook), `cn`.
- `schemas/` — Zod SSOT (`verdict`, `analyze`). `db/` — `schema`, `index`, `repo`, `migrate`, `migrations/`.

## Status & next steps
- ✅ Act 1 — `/` Floor: streaming Claude vision over uploaded/dropped frames, CCTV-wall UI, SOP checklist,
  phone-alert card, hash-chained ledger stamp per verdict. Verified live.
- ✅ Act 3 — `/books` Books: financial integrity. A **deterministic engine** (`lib/finance/reconcile.ts`)
  computes exact figures (ghost meals, markup vs reference, duplicate invoices, threshold-gaming, supplier
  concentration); **Claude narrates + judges** (severity, explanation, recommended action, overall risk).
  Streams `status → reconciliation → reasoning → assessment → done`; persists to `finance_events` + ledger.
  Verified live: flagged scenario computes Rp 12.434.000 leakage, AI returns critical risk, ledger sealed.
  Synthetic scenarios in `lib/finance/scenarios.ts` (one flagged, one clean control) — swap in Andrea's
  real numbers later.
- ✅ Act 4 — `/ledger`: tamper-evident audit trail. Lists the hash chain (SOP + finance), a verify banner,
  and a live "Simulate tampering" → flips a sealed record (e.g. finance risk critical→low to look clean) →
  `verifyLedger()` catches it → "TAMPER DETECTED" at the broken seq → "Restore" repairs it. Tamper is a
  reversible mutation of the hashed JSON (sentinel-packed original in the summary; no extra storage).
  Verified live: tamper broke seq 8, restore returned to ok. `getLedgerState/tamperLedger/restoreLedger`
  in `db/repo.ts`; `/api/ledger` GET/POST; `components/ledger/ledger-view.tsx`.
- ⬜ Act 2 — dedicated "shoot a fresh photo" moment (mostly covered by Act 1 upload). Low priority.
- ✅ Demo hardening: Act 1 drop zone hardened (non-file drops); "Reset demo data" control on the Ledger
  tab (clears events/finance/ledger via `TRUNCATE … RESTART IDENTITY`); fleet context bar (multi-kitchen
  illusion). ⬜ still: wire a real Telegram alert if creds provided.
- ✅ Push 1: PostgreSQL (pg + drizzle node-postgres; async repo).
- ✅ Push 2: Better Auth — invite-only, magic-link, roles superadmin/admin/user, gated app + admin/superadmin
  pages, superadmin seeded. See the Auth section above.
- ⬜ Polish: swap model to Opus for the demo; visual pass; Andrea's real photos + procurement numbers.

## Architecture note (applies to all acts)
The winning pattern, reused per act: **deterministic/structured facts + Claude for streamed reasoning &
judgement**, delivered over SSE, validated by Zod, sealed into the hash-chained ledger. Act 1 = vision
verdict; Act 3 = finance reconciliation. New acts should follow the same shape (route streams events from
`lib/events.ts`; a `use-*` hook consumes them; computed truth stays in TS, the LLM explains/judges).
