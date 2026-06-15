import { SOP_RULES } from "@/lib/sop";
import { STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useLocale, useMessages } from "@/lib/i18n/context";
import type { Verdict } from "@/schemas/verdict";

/** The fixed SOP rule list, annotated with the model's per-rule results. */
export function SopChecklist({ verdict }: { verdict: Verdict | null }) {
  const m = useMessages();
  const locale = useLocale();
  const byId = new Map(verdict?.checks.map((c) => [c.id, c]) ?? []);

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {SOP_RULES.map((rule) => {
        const check = byId.get(rule.id);
        const style = check ? STATUS_STYLE[check.status] : null;
        const ruleLabel = locale === "id" ? rule.labelId : rule.label;
        return (
          <div
            key={rule.id}
            className="flex items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2"
          >
            <span className="truncate text-[13px]" title={rule.description}>
              {ruleLabel}
            </span>
            {style && check ? (
              <span
                className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide", style.bg, style.text)}
                title={`${Math.round(check.confidence * 100)}% · ${check.note}`}
              >
                {m.status[check.status]}
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
