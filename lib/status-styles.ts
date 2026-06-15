import type { SopStatus, Severity } from "@/schemas/verdict";
import type { OverallRisk } from "@/schemas/finance";

/**
 * SSOT for mapping verdict statuses/severities/risk to themed classes.
 * Display labels are NOT here — they live in the i18n dictionary (keyed by the
 * same enum values), so this stays purely about colour.
 */

export const STATUS_STYLE: Record<SopStatus, { text: string; bg: string; dot: string }> = {
  pass: { text: "text-pass", bg: "bg-pass-soft", dot: "bg-pass" },
  warn: { text: "text-warn", bg: "bg-warn-soft", dot: "bg-warn" },
  fail: { text: "text-fail", bg: "bg-fail-soft", dot: "bg-fail" },
};

export const SEVERITY_STYLE: Record<Severity, { text: string; bg: string }> = {
  low: { text: "text-muted", bg: "bg-panel" },
  medium: { text: "text-warn", bg: "bg-warn-soft" },
  high: { text: "text-fail", bg: "bg-fail-soft" },
};

export const RISK_STYLE: Record<OverallRisk, { text: string; bg: string }> = {
  low: { text: "text-pass", bg: "bg-pass-soft" },
  medium: { text: "text-warn", bg: "bg-warn-soft" },
  high: { text: "text-fail", bg: "bg-fail-soft" },
  critical: { text: "text-fail", bg: "bg-fail-soft" },
};

export function scoreColor(score: number): string {
  if (score >= 85) return "text-pass";
  if (score >= 60) return "text-warn";
  return "text-fail";
}
