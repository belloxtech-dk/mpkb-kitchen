import type { SopStatus, Severity } from "@/schemas/verdict";

/** SSOT for mapping verdict statuses/severities to themed classes + labels. */

export const STATUS_STYLE: Record<SopStatus, { label: string; text: string; bg: string; dot: string }> = {
  pass: { label: "PASS", text: "text-pass", bg: "bg-pass-soft", dot: "bg-pass" },
  warn: { label: "WARN", text: "text-warn", bg: "bg-warn-soft", dot: "bg-warn" },
  fail: { label: "FAIL", text: "text-fail", bg: "bg-fail-soft", dot: "bg-fail" },
};

export const SEVERITY_STYLE: Record<Severity, { label: string; text: string; bg: string }> = {
  low: { label: "LOW", text: "text-muted", bg: "bg-panel" },
  medium: { label: "MEDIUM", text: "text-warn", bg: "bg-warn-soft" },
  high: { label: "HIGH", text: "text-fail", bg: "bg-fail-soft" },
};

export function scoreColor(score: number): string {
  if (score >= 85) return "text-pass";
  if (score >= 60) return "text-warn";
  return "text-fail";
}
