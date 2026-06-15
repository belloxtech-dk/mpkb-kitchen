import { ReasoningStream } from "../reasoning-stream";
import { FindingCard } from "./finding-card";
import { RISK_STYLE } from "@/lib/status-styles";
import { formatIdr } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AuditState } from "@/lib/use-audit";

export function AuditPanel({ audit }: { audit: AuditState }) {
  const { reconciliation, assessment } = audit;
  const auditing = audit.status === "auditing";
  const assessedByKind = new Map(assessment?.findings.map((f) => [f.kind, f]) ?? []);
  const risk = assessment ? RISK_STYLE[assessment.overallRisk] : null;

  const headline =
    assessment?.summary ??
    (reconciliation
      ? reconciliation.findings.length > 0
        ? `${reconciliation.findings.length} issue(s) computed — awaiting AI judgement…`
        : "No irregularities computed for this day."
      : "Run an audit to reconcile the books.");

  return (
    <div className="space-y-3">
      <ReasoningStream
        text={audit.reasoning}
        active={auditing}
        label="AI auditor"
        activePlaceholder="Reviewing the books…"
        idlePlaceholder="Run an audit to see the AI's reasoning."
      />

      {reconciliation && (
        <div className="rounded-xl border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium tracking-wide text-muted uppercase">Audit result</div>
              <p className="mt-1 text-[13px]">{headline}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-2xl font-semibold tabular-nums text-fail">
                {formatIdr(reconciliation.totalLeakageIdr)}
              </div>
              <div className="text-[10px] tracking-wide text-muted uppercase">est. leakage</div>
            </div>
          </div>
          {risk && (
            <div className="mt-2">
              <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold", risk.bg, risk.text)}>{risk.label}</span>
            </div>
          )}
        </div>
      )}

      {reconciliation?.findings.map((f) => (
        <FindingCard key={f.kind} computed={f} assessed={assessedByKind.get(f.kind)} pending={auditing} />
      ))}

      {reconciliation && reconciliation.findings.length === 0 && !auditing && (
        <div className="rounded-xl border border-pass/30 bg-pass-soft p-4 text-sm text-pass">
          Books reconcile cleanly — no irregularities found for this day.
        </div>
      )}

      {audit.ledger && (
        <div className="flex items-center gap-2 rounded-xl border bg-surface px-4 py-3 text-[11px] text-muted">
          <span className="rounded bg-pass-soft px-1.5 py-0.5 font-semibold text-pass">LEDGER #{audit.ledger.seq}</span>
          <span className="font-mono">sealed · {audit.ledger.hash.slice(0, 16)}…</span>
        </div>
      )}

      {audit.error && (
        <div className="rounded-xl border border-fail/30 bg-fail-soft p-3 text-sm text-fail">{audit.error}</div>
      )}
    </div>
  );
}
