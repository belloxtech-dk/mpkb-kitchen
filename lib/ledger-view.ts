import type { SopStatus } from "@/schemas/verdict";
import type { OverallRisk } from "@/schemas/finance";

/** Shared (server-produced, client-rendered) shape for the Ledger page. */

export type LedgerKind = "sop_event" | "finance_event";

export type LedgerBadge = { type: "status"; value: SopStatus } | { type: "risk"; value: OverallRisk };

export interface LedgerEntryView {
  seq: number;
  createdAt: number; // epoch ms
  kind: LedgerKind;
  hash: string;
  prevHash: string;
  title: string;
  detail: string;
  badge: LedgerBadge | null;
}

export interface LedgerVerification {
  ok: boolean;
  brokenSeq?: number;
  reason?: string;
}

export interface LedgerStateView {
  entries: LedgerEntryView[];
  verification: LedgerVerification;
}
