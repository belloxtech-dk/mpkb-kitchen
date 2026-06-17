import { Loader2 } from "lucide-react";
import { SopChecklist } from "./sop-checklist";
import { getSopRule } from "@/lib/sop";
import { SEVERITY_STYLE, scoreColor, STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useLocale, useMessages } from "@/lib/i18n/context";
import type { LedgerStamp } from "@/lib/events";
import type { Verdict } from "@/schemas/verdict";

export function VerdictPanel({
  verdict,
  ledger,
  analyzing = false,
}: {
  verdict: Verdict | null;
  ledger: LedgerStamp | null;
  analyzing?: boolean;
}) {
  const m = useMessages();
  const locale = useLocale();
  // The verdict event arrives last (after the reasoning stream), so show a working
  // state here meanwhile — keeps eyes on the checklist while the model is judging.
  const pending = analyzing && !verdict;

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">{m.verdict.title}</div>
          <p className={cn("mt-1 text-[13px]", pending ? "animate-pulse text-muted" : "text-fg")}>
            {verdict?.summary ?? (pending ? m.verdict.analyzing : m.verdict.empty)}
          </p>
        </div>
        {verdict ? (
          <div className="shrink-0 text-right">
            <div className={cn("font-mono text-2xl font-semibold tabular-nums", scoreColor(verdict.complianceScore))}>
              {Math.round(verdict.complianceScore)}
            </div>
            <div className="text-[10px] tracking-wide text-muted uppercase">{m.verdict.score}</div>
          </div>
        ) : pending ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-accent" />
        ) : null}
      </div>

      <SopChecklist verdict={verdict} pending={pending} />

      {verdict && verdict.violations.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">{m.verdict.violations}</div>
          {verdict.violations.map((v, i) => {
            const sev = SEVERITY_STYLE[v.severity];
            const rule = getSopRule(v.ruleId);
            const ruleLabel = (locale === "id" ? rule?.labelId : rule?.label) ?? v.ruleId;
            return (
              <div key={`${v.ruleId}-${i}`} className="rounded-lg border bg-panel p-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", sev.bg, sev.text)}>
                    {m.severity[v.severity]}
                  </span>
                  <span className="text-[13px] font-medium">{ruleLabel}</span>
                </div>
                <p className="mt-1 text-xs text-fg">{v.detail}</p>
                <p className="mt-0.5 text-xs text-muted">→ {v.recommendedAction}</p>
              </div>
            );
          })}
        </div>
      )}

      {ledger && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3 text-[11px] text-muted">
          <span className={cn("rounded px-1.5 py-0.5 font-semibold", STATUS_STYLE.pass.bg, STATUS_STYLE.pass.text)}>
            {m.ledger.tag} #{ledger.seq}
          </span>
          <span className="font-mono">
            {m.ledger.sealed} · {ledger.hash.slice(0, 16)}…
          </span>
        </div>
      )}
    </div>
  );
}
