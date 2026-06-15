import { SOP_RULES } from "@/lib/sop";
import { STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import type { Verdict } from "@/schemas/verdict";

/** The fixed SOP rule list, annotated with the model's per-rule results. */
export function SopChecklist({ verdict }: { verdict: Verdict | null }) {
  const byId = new Map(verdict?.checks.map((c) => [c.id, c]) ?? []);

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {SOP_RULES.map((rule) => {
        const check = byId.get(rule.id);
        const style = check ? STATUS_STYLE[check.status] : null;
        return (
          <div
            key={rule.id}
            className="flex items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2"
          >
            <span className="truncate text-[13px]" title={rule.description}>
              {rule.label}
            </span>
            {style ? (
              <span
                className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide", style.bg, style.text)}
                title={check ? `${Math.round(check.confidence * 100)}% · ${check.note}` : undefined}
              >
                {style.label}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-muted">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
