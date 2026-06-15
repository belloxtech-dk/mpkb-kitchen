import { SEVERITY_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import type { KitchenAlert } from "@/lib/events";

/** Telegram-style alert bubble shown when a violation triggers a phone alert. */
export function AlertCard({ alert }: { alert: KitchenAlert }) {
  const sev = SEVERITY_STYLE[alert.severity];
  return (
    <div className="rounded-xl border border-fail/30 bg-fail-soft p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-fail uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-fail opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-fail" />
          </span>
          Phone alert sent
        </div>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", sev.bg, sev.text)}>{sev.label}</span>
      </div>
      <div className="rounded-lg bg-surface p-3 shadow-sm">
        <div className="text-[13px] font-medium">{alert.title}</div>
        <p className="mt-1 text-[13px] text-fg">{alert.messageId}</p>
      </div>
      <div className="mt-2 text-[11px] text-muted">
        {alert.delivered ? "Delivered via Telegram ✓" : "Telegram not configured — shown in-app only"}
      </div>
    </div>
  );
}
