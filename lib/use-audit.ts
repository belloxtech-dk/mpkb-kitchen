"use client";

import { useCallback, useRef, useState } from "react";
import type { FinanceEvent, LedgerStamp } from "@/lib/events";
import type { ReconciliationResult } from "@/lib/finance/reconcile";
import type { FinanceAssessment } from "@/schemas/finance";

export type AuditStatus = "idle" | "auditing" | "done" | "error";

export interface AuditState {
  status: AuditStatus;
  scenarioId: string | null;
  reasoning: string;
  reconciliation: ReconciliationResult | null;
  assessment: FinanceAssessment | null;
  ledger: LedgerStamp | null;
  error: string | null;
}

const INITIAL: AuditState = {
  status: "idle",
  scenarioId: null,
  reasoning: "",
  reconciliation: null,
  assessment: null,
  ledger: null,
  error: null,
};

/** Drives one streaming finance audit and exposes its live state. */
export function useAudit() {
  const [state, setState] = useState<AuditState>(INITIAL);
  const runningRef = useRef(false);

  const run = useCallback(async (scenarioId: string) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setState({ ...INITIAL, status: "auditing", scenarioId });

    const apply = (event: FinanceEvent) => {
      switch (event.type) {
        case "reasoning_delta":
          setState((s) => ({ ...s, reasoning: s.reasoning + event.text }));
          break;
        case "reconciliation":
          setState((s) => ({ ...s, reconciliation: event.result }));
          break;
        case "assessment":
          setState((s) => ({ ...s, assessment: event.assessment, ledger: event.ledger }));
          break;
        case "error":
          setState((s) => ({ ...s, status: "error", error: event.message }));
          break;
        case "done":
          setState((s) => (s.status === "error" ? s : { ...s, status: "done" }));
          break;
      }
    };

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      if (!res.ok || !res.body) {
        setState((s) => ({ ...s, status: "error", error: `Request failed (${res.status})` }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (json) apply(JSON.parse(json) as FinanceEvent);
        }
      }
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: err instanceof Error ? err.message : String(err) }));
    } finally {
      runningRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    if (!runningRef.current) setState(INITIAL);
  }, []);

  return { ...state, run, reset };
}
