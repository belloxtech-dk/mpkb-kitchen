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

/** Receipt scan + price verification results. */
export const receiptScans = pgTable("receipt_scans", {
  id:             text("id").primaryKey(),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  kitchen:        text("kitchen").notNull(),
  supplier:       text("supplier"),
  receiptDate:    text("receipt_date"),
  receiptNumber:  text("receipt_number"),
  totalIdr:       doublePrecision("total_idr").notNull().default(0),
  overpaymentIdr: doublePrecision("overpayment_idr").notNull().default(0),
  riskLevel:      text("risk_level").notNull().default("low"),
  itemCount:      serial("item_count").notNull(),
  flaggedCount:   serial("flagged_count").notNull(),
  items:          jsonb("items").notNull().default([]),
  checks:         jsonb("checks").notNull().default([]),
  summary:        text("summary").notNull().default(""),
  imageHash:      text("image_hash"),
  waPhone:        text("wa_phone"),
  source:         text("source").notNull().default("web"),
});

export type ReceiptScanRow = typeof receiptScans.$inferSelect;

/** WA bot session state per phone number */
export const waSessions = pgTable("wa_sessions", {
  id:        text("id").primaryKey(),
  waPhone:   text("wa_phone").notNull().unique(),
  kitchenId: text("kitchen_id"),
  userId:    text("user_id"),
  state:     text("state").notNull().default("idle"),
  lastSeen:  timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Real market prices collected from submitted receipts */
export const priceIntelligence = pgTable("price_intelligence", {
  id:        text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  kitchenId: text("kitchen_id").notNull(),
  itemName:  text("item_name").notNull(),
  unit:      text("unit").notNull(),
  priceIdr:  doublePrecision("price_idr").notNull(),
  supplier:  text("supplier"),
  receiptId: text("receipt_id"),
  source:    text("source").default("receipt"),
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
