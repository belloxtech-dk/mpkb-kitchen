"use client";

import { useCallback, useRef, useState } from "react";
import type { AnalysisEvent, KitchenAlert, LedgerStamp } from "@/lib/events";
import type { ImageMediaType } from "@/schemas/analyze";
import type { Verdict } from "@/schemas/verdict";
import type { Locale } from "@/lib/i18n/locale";

export interface AnalysisInput {
  zone: string;
  source: "frame" | "upload";
  imageBase64: string;
  mediaType: ImageMediaType;
  locale: Locale;
}

export type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

/** The full outcome of one analysis — enough to re-display a zone's inspector later. */
export interface AnalysisResult {
  verdict: Verdict;
  reasoning: string;
  alert: KitchenAlert | null;
  ledger: LedgerStamp | null;
}

export interface AnalysisState {
  status: AnalysisStatus;
  activeZone: string | null;
  reasoning: string;
  verdict: Verdict | null;
  alert: KitchenAlert | null;
  ledger: LedgerStamp | null;
  error: string | null;
}

const INITIAL: AnalysisState = {
  status: "idle",
  activeZone: null,
  reasoning: "",
  verdict: null,
  alert: null,
  ledger: null,
  error: null,
};

/** Drives one streaming analysis at a time and exposes its live state. */
export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(INITIAL);
  const runningRef = useRef(false);

  const run = useCallback(async (input: AnalysisInput): Promise<AnalysisResult | null> => {
    if (runningRef.current) return null;
    runningRef.current = true;

    setState({ ...INITIAL, status: "analyzing", activeZone: input.zone });

    let finalVerdict: Verdict | null = null;
    let reasoning = "";
    let alert: KitchenAlert | null = null;
    let ledger: LedgerStamp | null = null;

    const apply = (event: AnalysisEvent) => {
      switch (event.type) {
        case "reasoning_delta":
          reasoning += event.text;
          setState((s) => ({ ...s, reasoning: s.reasoning + event.text }));
          break;
        case "verdict":
          finalVerdict = event.verdict;
          ledger = event.ledger;
          setState((s) => ({ ...s, verdict: event.verdict, ledger: event.ledger }));
          break;
        case "alert":
          alert = event.alert;
          setState((s) => ({ ...s, alert: event.alert }));
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
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok || !res.body) {
        setState((s) => ({ ...s, status: "error", error: `Request failed (${res.status})` }));
        return null;
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
          if (json) apply(JSON.parse(json) as AnalysisEvent);
        }
      }
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: err instanceof Error ? err.message : String(err) }));
    } finally {
      runningRef.current = false;
    }

    return finalVerdict ? { verdict: finalVerdict, reasoning, alert, ledger } : null;
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, run, reset };
}
