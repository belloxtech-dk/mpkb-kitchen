"use client";

import { SEVERITY_STYLE } from "@/lib/status-styles";
import { formatIdr } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import type { ComputedFinding } from "@/lib/finance/reconcile";
import type { AssessedFinding } from "@/schemas/finance";

export function FindingCard({
  computed,
  assessed,
  pending,
}: {
  computed: ComputedFinding;
  assessed: AssessedFinding | undefined;
  pending: boolean;
}) {
  const m = useMessages();
  const sev = assessed ? SEVERITY_STYLE[assessed.severity] : null;
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-wide text-muted uppercase">{m.findingKind[computed.kind]}</div>
          <div className="text-sm font-medium">{computed.title}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {computed.leakageIdr > 0 && (
            <div className="font-mono text-sm font-semibold tabular-nums text-fail">{formatIdr(computed.leakageIdr)}</div>
          )}
          {sev && assessed ? (
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", sev.bg, sev.text)}>
              {m.severity[assessed.severity]}
            </span>
          ) : pending ? (
            <span className="text-[10px] text-muted">{m.books.judging}</span>
          ) : null}
        </div>
      </div>

      <dl className="space-y-0.5 border-t pt-2 text-xs">
        {computed.evidence.map((e, i) => (
          <div key={i} className="flex justify-between gap-3">
            <dt className="text-muted">{e.label}</dt>
            <dd className="text-right tabular-nums">{e.value}</dd>
          </div>
        ))}
      </dl>

      {assessed && (
        <div className="mt-2 space-y-1 border-t pt-2">
          <p className="text-xs text-fg">{assessed.explanation}</p>
          <p className="text-xs text-muted">→ {assessed.recommendedAction}</p>
        </div>
      )}
    </div>
  );
}
