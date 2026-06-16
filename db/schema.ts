import { doublePrecision, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { Verdict } from "@/schemas/verdict";
import type { FinanceAssessment } from "@/schemas/finance";
import type { ReconciliationResult } from "@/lib/finance/reconcile";

/** SSOT for the database schema (PostgreSQL). Drizzle infers row types from these tables. */

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  zone: text("zone").notNull(),
  source: text("source").notNull(), // 'frame' | 'upload'
  overallStatus: text("overall_status").notNull(), // SopStatus
  complianceScore: doublePrecision("compliance_score").notNull(),
  summary: text("summary").notNull(),
  verdict: jsonb("verdict").$type<Verdict>().notNull(),
});

export const financeEvents = pgTable("finance_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  scenarioId: text("scenario_id").notNull(),
  kitchen: text("kitchen").notNull(),
  dateIso: text("date_iso").notNull(),
  overallRisk: text("overall_risk").notNull(),
  totalLeakageIdr: doublePrecision("total_leakage_idr").notNull(),
  summary: text("summary").notNull(),
  reconciliation: jsonb("reconciliation").$type<ReconciliationResult>().notNull(),
  assessment: jsonb("assessment").$type<FinanceAssessment>().notNull(),
});

/**
 * Append-only, hash-chained audit ledger. Each row binds a content hash to the
 * previous row's hash, so any retroactive edit breaks the chain (Act 4 tamper demo).
 */
export const ledger = pgTable("ledger", {
  seq: serial("seq").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  kind: text("kind").notNull(), // 'sop_event' | 'finance_event'
  refId: text("ref_id"),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
});

/** Simple key/value app settings (e.g. the active Claude model). */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type LedgerRow = typeof ledger.$inferSelect;
export type FinanceEventRow = typeof financeEvents.$inferSelect;
