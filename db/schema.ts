import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Verdict } from "@/schemas/verdict";
import type { FinanceAssessment } from "@/schemas/finance";
import type { ReconciliationResult } from "@/lib/finance/reconcile";

/** SSOT for the database schema. Drizzle infers all row types from these tables. */

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  zone: text("zone").notNull(),
  source: text("source").notNull(), // 'frame' | 'upload'
  overallStatus: text("overall_status").notNull(), // SopStatus
  complianceScore: real("compliance_score").notNull(),
  summary: text("summary").notNull(),
  verdict: text("verdict", { mode: "json" }).notNull().$type<Verdict>(),
});

/**
 * Append-only, hash-chained audit ledger. Each row binds a content hash to the
 * previous row's hash, so any retroactive edit breaks the chain (Act 4 tamper demo).
 */
export const ledger = sqliteTable("ledger", {
  seq: integer("seq").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  kind: text("kind").notNull(), // 'sop_event' | 'finance_event'
  refId: text("ref_id"), // id of the referenced domain record
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
});

export const financeEvents = sqliteTable("finance_events", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  scenarioId: text("scenario_id").notNull(),
  kitchen: text("kitchen").notNull(),
  dateIso: text("date_iso").notNull(),
  overallRisk: text("overall_risk").notNull(),
  totalLeakageIdr: real("total_leakage_idr").notNull(),
  summary: text("summary").notNull(),
  reconciliation: text("reconciliation", { mode: "json" }).notNull().$type<ReconciliationResult>(),
  assessment: text("assessment", { mode: "json" }).notNull().$type<FinanceAssessment>(),
});

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type LedgerRow = typeof ledger.$inferSelect;
export type FinanceEventRow = typeof financeEvents.$inferSelect;
