import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { events, financeEvents, ledger, type EventRow, type FinanceEventRow, type LedgerRow } from "./schema";
import { chainHash, GENESIS_HASH, hashPayload } from "@/lib/ledger-hash";
import type { LedgerStamp } from "@/lib/events";
import type { Verdict, SopStatus } from "@/schemas/verdict";
import type { FinanceAssessment, OverallRisk, ProcurementScenario } from "@/schemas/finance";
import type { ReconciliationResult } from "@/lib/finance/reconcile";
import type { LedgerStateView, LedgerEntryView } from "@/lib/ledger-view";

/**
 * Repository = the only place that reads/writes domain tables. Keeps DB access
 * DRY and centralizes the ledger-chaining invariant so callers can't forget it.
 */

export interface RecordSopEventInput {
  zone: string;
  source: string;
  verdict: Verdict;
}

/** The canonical content that gets hashed into the ledger for an SOP event. */
function sopPayload(row: { id: string; zone: string; source: string; createdAtMs: number; verdict: Verdict }) {
  return {
    kind: "sop_event",
    refId: row.id,
    zone: row.zone,
    source: row.source,
    createdAt: row.createdAtMs,
    verdict: row.verdict,
  };
}

/** Persist an SOP verdict and append a chained ledger stamp, atomically. */
export function recordSopEvent(input: RecordSopEventInput): { event: EventRow; stamp: LedgerStamp } {
  return db.transaction((tx) => {
    const id = randomUUID();
    const createdAt = new Date();

    const event = tx
      .insert(events)
      .values({
        id,
        createdAt,
        zone: input.zone,
        source: input.source,
        overallStatus: input.verdict.overallStatus,
        complianceScore: input.verdict.complianceScore,
        summary: input.verdict.summary,
        verdict: input.verdict,
      })
      .returning()
      .get();

    const prev = tx.select().from(ledger).orderBy(desc(ledger.seq)).limit(1).get();
    const prevHash = prev?.hash ?? GENESIS_HASH;
    const payloadHash = hashPayload(
      sopPayload({ id, zone: input.zone, source: input.source, createdAtMs: createdAt.getTime(), verdict: input.verdict }),
    );
    const hash = chainHash(prevHash, payloadHash);

    const stamp = tx
      .insert(ledger)
      .values({ createdAt, kind: "sop_event", refId: id, payloadHash, prevHash, hash })
      .returning()
      .get();

    return { event, stamp: { seq: stamp.seq, hash, prevHash } };
  });
}

export interface RecordFinanceEventInput {
  scenario: ProcurementScenario;
  reconciliation: ReconciliationResult;
  assessment: FinanceAssessment;
}

/** The canonical content hashed into the ledger for a finance audit. */
function financePayload(row: {
  id: string;
  scenarioId: string;
  kitchen: string;
  dateIso: string;
  createdAtMs: number;
  reconciliation: ReconciliationResult;
  assessment: FinanceAssessment;
}) {
  return {
    kind: "finance_event",
    refId: row.id,
    scenarioId: row.scenarioId,
    kitchen: row.kitchen,
    dateIso: row.dateIso,
    createdAt: row.createdAtMs,
    reconciliation: row.reconciliation,
    assessment: row.assessment,
  };
}

/** Persist a finance audit and append a chained ledger stamp, atomically. */
export function recordFinanceEvent(input: RecordFinanceEventInput): { event: FinanceEventRow; stamp: LedgerStamp } {
  const { scenario, reconciliation, assessment } = input;
  return db.transaction((tx) => {
    const id = randomUUID();
    const createdAt = new Date();

    const event = tx
      .insert(financeEvents)
      .values({
        id,
        createdAt,
        scenarioId: scenario.id,
        kitchen: scenario.kitchen,
        dateIso: scenario.dateIso,
        overallRisk: assessment.overallRisk,
        totalLeakageIdr: reconciliation.totalLeakageIdr,
        summary: assessment.summary,
        reconciliation,
        assessment,
      })
      .returning()
      .get();

    const prev = tx.select().from(ledger).orderBy(desc(ledger.seq)).limit(1).get();
    const prevHash = prev?.hash ?? GENESIS_HASH;
    const payloadHash = hashPayload(
      financePayload({
        id,
        scenarioId: scenario.id,
        kitchen: scenario.kitchen,
        dateIso: scenario.dateIso,
        createdAtMs: createdAt.getTime(),
        reconciliation,
        assessment,
      }),
    );
    const hash = chainHash(prevHash, payloadHash);

    const stamp = tx
      .insert(ledger)
      .values({ createdAt, kind: "finance_event", refId: id, payloadHash, prevHash, hash })
      .returning()
      .get();

    return { event, stamp: { seq: stamp.seq, hash, prevHash } };
  });
}

export function getRecentEvents(limit = 50): EventRow[] {
  return db.select().from(events).orderBy(desc(events.createdAt)).limit(limit).all();
}

export function getLedger(): LedgerRow[] {
  return db.select().from(ledger).orderBy(ledger.seq).all();
}

/**
 * Recompute the chain and the per-event content hashes. Returns the first seq
 * where the chain is broken (used by the Act 4 tamper demo).
 */
export function verifyLedger(): { ok: boolean; brokenSeq?: number; reason?: string } {
  const rows = getLedger();
  let prevHash = GENESIS_HASH;

  for (const row of rows) {
    if (row.prevHash !== prevHash || chainHash(prevHash, row.payloadHash) !== row.hash) {
      return { ok: false, brokenSeq: row.seq, reason: "chain link mismatch" };
    }

    if (row.kind === "sop_event" && row.refId) {
      const ev = db.select().from(events).where(eq(events.id, row.refId)).get();
      if (ev) {
        const recomputed = hashPayload(
          sopPayload({
            id: ev.id,
            zone: ev.zone,
            source: ev.source,
            createdAtMs: ev.createdAt.getTime(),
            verdict: ev.verdict,
          }),
        );
        if (recomputed !== row.payloadHash) {
          return { ok: false, brokenSeq: row.seq, reason: "event content altered after stamping" };
        }
      }
    }

    if (row.kind === "finance_event" && row.refId) {
      const ev = db.select().from(financeEvents).where(eq(financeEvents.id, row.refId)).get();
      if (ev) {
        const recomputed = hashPayload(
          financePayload({
            id: ev.id,
            scenarioId: ev.scenarioId,
            kitchen: ev.kitchen,
            dateIso: ev.dateIso,
            createdAtMs: ev.createdAt.getTime(),
            reconciliation: ev.reconciliation,
            assessment: ev.assessment,
          }),
        );
        if (recomputed !== row.payloadHash) {
          return { ok: false, brokenSeq: row.seq, reason: "finance event content altered after stamping" };
        }
      }
    }

    prevHash = row.hash;
  }

  return { ok: true };
}

/*
 * Tamper demo (Act 4). We need a reversible way to "edit a sealed record" that
 * changes the HASHED content so verifyLedger() catches it. We flip the verdict/
 * risk to look clean and stash the original inside the summary behind a sentinel,
 * so restore is exact with no extra storage.
 */
const TAMPER_SENTINEL = "§T§";

function packTamper(original: string, summary: string): string {
  return `${TAMPER_SENTINEL}${original}§${summary}`;
}

function unpackTamper(summary: string): { original: string; summary: string } | null {
  if (!summary.startsWith(TAMPER_SENTINEL)) return null;
  const rest = summary.slice(TAMPER_SENTINEL.length);
  const sep = rest.indexOf("§");
  if (sep < 0) return null;
  return { original: rest.slice(0, sep), summary: rest.slice(sep + 1) };
}

function displaySummary(summary: string): string {
  return unpackTamper(summary)?.summary ?? summary;
}

/** Build the full chain view + verification for the Ledger page. */
export function getLedgerState(): LedgerStateView {
  const rows = getLedger();
  const entries: LedgerEntryView[] = rows.map((row) => {
    const base = {
      seq: row.seq,
      createdAt: row.createdAt.getTime(),
      hash: row.hash,
      prevHash: row.prevHash,
    };

    if (row.kind === "sop_event" && row.refId) {
      const ev = db.select().from(events).where(eq(events.id, row.refId)).get();
      if (ev) {
        return {
          ...base,
          kind: "sop_event",
          title: ev.zone,
          detail: displaySummary(ev.verdict.summary),
          badge: { type: "status", value: ev.verdict.overallStatus },
        };
      }
    }

    if (row.kind === "finance_event" && row.refId) {
      const ev = db.select().from(financeEvents).where(eq(financeEvents.id, row.refId)).get();
      if (ev) {
        return {
          ...base,
          kind: "finance_event",
          title: `${ev.kitchen} · ${ev.dateIso}`,
          detail: displaySummary(ev.assessment.summary),
          badge: { type: "risk", value: ev.assessment.overallRisk },
        };
      }
    }

    return { ...base, kind: row.kind as LedgerEntryView["kind"], title: row.kind, detail: "", badge: null };
  });

  return { entries, verification: verifyLedger() };
}

/** Silently alter the most recent sealed record (prefer a finance audit) to look clean. */
export function tamperLedger(): { tampered: boolean } {
  const rows = getLedger();
  const finance = [...rows].reverse().find((r) => r.kind === "finance_event" && r.refId);
  const sop = [...rows].reverse().find((r) => r.kind === "sop_event" && r.refId);
  const target = finance ?? sop;
  if (!target?.refId) return { tampered: false };

  if (target.kind === "finance_event") {
    const ev = db.select().from(financeEvents).where(eq(financeEvents.id, target.refId)).get();
    if (!ev || unpackTamper(ev.assessment.summary)) return { tampered: Boolean(ev) };
    const assessment: FinanceAssessment = {
      ...ev.assessment,
      overallRisk: "low",
      summary: packTamper(ev.assessment.overallRisk, ev.assessment.summary),
    };
    db.update(financeEvents).set({ assessment, overallRisk: "low" }).where(eq(financeEvents.id, ev.id)).run();
    return { tampered: true };
  }

  const ev = db.select().from(events).where(eq(events.id, target.refId)).get();
  if (!ev || unpackTamper(ev.verdict.summary)) return { tampered: Boolean(ev) };
  const verdict: Verdict = {
    ...ev.verdict,
    overallStatus: "pass",
    summary: packTamper(ev.verdict.overallStatus, ev.verdict.summary),
  };
  db.update(events).set({ verdict, overallStatus: "pass" }).where(eq(events.id, ev.id)).run();
  return { tampered: true };
}

/** Revert any tampered records to their original sealed content. */
export function restoreLedger(): void {
  for (const ev of db.select().from(financeEvents).all()) {
    const u = unpackTamper(ev.assessment.summary);
    if (!u) continue;
    const assessment: FinanceAssessment = { ...ev.assessment, overallRisk: u.original as OverallRisk, summary: u.summary };
    db.update(financeEvents).set({ assessment, overallRisk: u.original }).where(eq(financeEvents.id, ev.id)).run();
  }
  for (const ev of db.select().from(events).all()) {
    const u = unpackTamper(ev.verdict.summary);
    if (!u) continue;
    const verdict: Verdict = { ...ev.verdict, overallStatus: u.original as SopStatus, summary: u.summary };
    db.update(events).set({ verdict, overallStatus: u.original }).where(eq(events.id, ev.id)).run();
  }
}
