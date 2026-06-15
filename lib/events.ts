import type { Verdict } from "@/schemas/verdict";

/**
 * SSOT for the Server-Sent Events streamed from /api/analyze to the client.
 * Shared by the route (producer) and the useAnalysis hook (consumer).
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

export const SSE_DELIMITER = "\n\n";

/** Encode an event as an SSE `data:` frame. */
export function encodeSse(event: AnalysisEvent): string {
  return `data: ${JSON.stringify(event)}${SSE_DELIMITER}`;
}
