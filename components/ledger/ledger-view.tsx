"use client";

import { useCallback, useEffect, useState } from "react";
import { RISK_STYLE, STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import type { LedgerBadge, LedgerStateView } from "@/lib/ledger-view";
import type { Messages } from "@/lib/i18n/dictionary";

function badgeView(badge: LedgerBadge, m: Messages) {
  if (badge.type === "status") return { label: m.status[badge.value], style: STATUS_STYLE[badge.value] };
  return { label: m.risk[badge.value], style: RISK_STYLE[badge.value] };
}

export function LedgerView() {
  const m = useMessages();
  const [state, setState] = useState<LedgerStateView | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/ledger", { cache: "no-store" });
    if (res.ok) setState((await res.json()) as LedgerStateView);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (action: "tamper" | "restore") => {
      setBusy(true);
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) setState((await res.json()) as LedgerStateView);
      setBusy(false);
    },
    [],
  );

  if (!state) return <div className="text-sm text-muted">…</div>;

  const { entries, verification } = state;
  const broken = !verification.ok;
  const brokenSeq = verification.brokenSeq;

  return (
    <div className="space-y-4">
      {/* verification banner */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
          broken ? "border-fail/40 bg-fail-soft" : "border-pass/40 bg-pass-soft",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 rounded-full", broken ? "bg-fail" : "bg-pass")} />
          <div>
            <div className={cn("text-sm font-semibold", broken ? "text-fail" : "text-pass")}>
              {broken ? m.ledgerPage.tampered : m.ledgerPage.intact}
            </div>
            {broken && brokenSeq != null && (
              <div className="text-xs text-fail">
                {m.ledgerPage.tamperedAt(brokenSeq)} · {m.ledgerPage.reasonAltered}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => act("tamper")}
            disabled={busy || entries.length === 0}
            className="rounded-lg border border-fail/40 px-3 py-1.5 text-sm text-fail transition hover:bg-fail/10 disabled:opacity-40"
          >
            {m.ledgerPage.simulate}
          </button>
          <button
            type="button"
            onClick={() => act("restore")}
            disabled={busy || !broken}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-40"
          >
            {m.ledgerPage.restore}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
          {m.ledgerPage.empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-surface">
          {entries.map((e) => {
            const compromised = broken && brokenSeq != null && e.seq >= brokenSeq;
            const badge = e.badge ? badgeView(e.badge, m) : null;
            const kindLabel = e.kind === "sop_event" ? m.ledgerPage.kindSop : m.ledgerPage.kindFinance;
            return (
              <div
                key={e.seq}
                className={cn("flex items-start gap-3 border-b p-3 last:border-b-0", compromised && "bg-fail-soft")}
              >
                <div className="w-8 shrink-0 pt-0.5 text-center font-mono text-xs text-muted">{e.seq}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                      {kindLabel}
                    </span>
                    <span className="truncate text-[13px] font-medium">{e.title}</span>
                    {badge && (
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", badge.style.bg, badge.style.text)}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted" title={e.detail}>
                    {e.detail}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10px] text-muted">
                    <span className={cn(compromised && "text-fail")}>hash {e.hash.slice(0, 12)}…</span>
                    <span>
                      {m.ledgerPage.prevLabel} {e.prevHash.slice(0, 12)}…
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted">{m.ledgerPage.note}</p>
    </div>
  );
}
