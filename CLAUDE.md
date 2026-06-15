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
- Tamper-evident ledger = SQLite + ~50 lines of hash-chaining (don't adopt a library).
- Telegram bot (~20 lines TS) for the real phone alert; skip WhatsApp setup for the demo.
- Use the latest capable Claude model for vision + reasoning.
- Rough plan: Day 1 = scaffold + Act 1 streaming vision. Day 2 = Act 2 upload + Act 3 financials.
  Day 3 = Act 4 ledger/tamper + Telegram + polish.

### Need from Andrea (for authenticity)
- 10–15 kitchen photos: mix of compliant + violations (no hairnet, bare hands on raw food, spill, food
  left uncovered). Scaffold with placeholders/stock until they arrive.
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

## Stack (as built)
TypeScript throughout. **Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 (CSS-first
`@theme`) · Drizzle ORM + drizzle-kit + better-sqlite3 (SQLite) · Zod 4 · Anthropic TS SDK** (streaming +
vision + tool-use). Model via `ANTHROPIC_MODEL` env (default `claude-sonnet-4-6` for dev; swap to an Opus
id for the real demo). Telegram alert optional via env.

## Running the demo (IMPORTANT: Node is not on PATH by default)
This machine has no global `node`/`npm`; Node lives under nvm. For every shell command, prepend:
`export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` (pinned in `.nvmrc`). `pnpm` is the package
manager. Then:
1. Create `.env.local` from `.env.example` and add `ANTHROPIC_API_KEY` (Jason provides a project key).
2. `pnpm install` → `pnpm db:migrate` (creates `mpkb.db`) → `pnpm dev`.
3. Open the app, drop a kitchen photo on a zone tile (or click Add frame) → watch Claude narrate and the
   SOP checklist fill in. "Run sweep" analyzes all populated zones.
- Staged auto-cycling: drop photos into `public/frames/` and list them in `public/frames/manifest.json`.
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
- ✅ Act 1 built and verified: streaming Claude vision over uploaded/dropped frames, CCTV-wall UI,
  SOP checklist, phone-alert card, hash-chained ledger stamp per verdict (foundation for Act 4).
- ⬜ Act 2 — dedicated "shoot/drag a fresh photo" interactive moment (mostly covered by current upload).
- ⬜ Act 3 — financial integrity: ingest synthetic procurement (invoice + delivery + attendance + meal
  counts), reconcile (ghost meals, markup vs reference, duplicates, supplier concentration) via Claude,
  show the arithmetic. Reuse the same SSE/ledger/SSOT patterns. Needs `db` finance tables + `seed.ts`.
- ⬜ Act 4 — ledger ticker UI + live tamper demo (verifyLedger already implemented in `db/repo.ts`).
- ⬜ Swap model to Opus + style polish before the real demo.
