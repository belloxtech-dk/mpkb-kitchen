import type { Verdict } from "@/schemas/verdict";
import type { FinanceAssessment } from "@/schemas/finance";
import type { ReconciliationResult } from "@/lib/finance/reconcile";

/**
 * SSOT for the Server-Sent Events streamed from the analysis/audit routes.
 * Shared by the routes (producers) and the useAnalysis / useAudit hooks (consumers).
 */

export interface KitchenAlert {
  zone: string;
  /** Short headline, English. */
  title: string;
  /** Bahasa Indonesia message body, as it would arrive on Telegram/WhatsApp. */
  messageId: string;
  severity: "low" | "medium" | "high";
  delivered: boolean;
}

export interface LedgerStamp {
  seq: number;
  hash: string;
  prevHash: string;
}

export type AnalysisEvent =
  | { type: "status"; state: "started"; zone: string; source: string }
  | { type: "reasoning_delta"; text: string }
  | { type: "verdict"; eventId: string; verdict: Verdict; ledger: LedgerStamp }
  | { type: "alert"; alert: KitchenAlert }
  | { type: "error"; message: string }
  | { type: "done" };

/** Act 3 — financial-integrity audit stream. */
export type FinanceEvent =
  | { type: "status"; state: "started"; scenarioId: string }
  | { type: "reasoning_delta"; text: string }
  | { type: "reconciliation"; result: ReconciliationResult }
  | { type: "assessment"; eventId: string; assessment: FinanceAssessment; ledger: LedgerStamp }
  | { type: "error"; message: string }
  | { type: "done" };

export const SSE_DELIMITER = "\n\n";

/** Encode any event object as an SSE `data:` frame. */
export function encodeSse(event: AnalysisEvent | FinanceEvent): string {
  return `data: ${JSON.stringify(event)}${SSE_DELIMITER}`;
}
