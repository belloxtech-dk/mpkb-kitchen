"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import { FLEET_KITCHENS, FLEET_STATS, pilotKitchen } from "@/lib/fleet/kitchens";

/**
 * Fleet context bar (UI illusion of a national network of kitchens).
 * The pilot is the only live kitchen; selecting any other shows the
 * pilot-only note instead of navigating.
 */
export function FleetBar() {
  const m = useMessages();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lockedTried, setLockedTried] = useState(false);
  const pilot = pilotKitchen();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FLEET_KITCHENS;
    return FLEET_KITCHENS.filter((k) => `${k.label} ${k.province}`.toLowerCase().includes(q));
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setLockedTried(false);
  };

  return (
    <div className="border-b bg-panel/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition hover:bg-surface"
          >
            <span className="size-2 rounded-full bg-pass" />
            <span className="font-medium">{pilot.label}</span>
            <span className="text-xs text-muted">▾</span>
          </button>

          {open && (
            <>
              <button aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={close} />
              <div className="absolute left-0 z-40 mt-1 w-80 rounded-xl border bg-surface p-2 shadow-lg">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={m.fleet.searchPlaceholder}
                  autoFocus
                  className="w-full rounded-lg border bg-panel px-2.5 py-1.5 text-sm outline-none focus:border-accent"
                />
                <div className="px-1 py-1.5 text-[11px] text-muted">
                  {m.fleet.scaleLine(formatNumber(FLEET_STATS.registered), String(FLEET_STATS.provinces))}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {filtered.length === 0 && (
                    <div className="px-2 py-3 text-center text-xs text-muted">{m.fleet.noResults}</div>
                  )}
                  {filtered.map((k) =>
                    k.pilot ? (
                      <button
                        key={k.id}
                        type="button"
                        onClick={close}
                        className="flex w-full items-center justify-between gap-2 rounded-lg bg-pass-soft px-2 py-2 text-left"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium">
                            <span className="size-1.5 shrink-0 rounded-full bg-pass" />
                            {k.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">{k.province}</span>
                        </span>
                        <span className="shrink-0 rounded bg-pass px-1.5 py-0.5 text-[9px] font-semibold text-accent-fg">
                          {m.fleet.pilotBadge}
                        </span>
                      </button>
                    ) : (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setLockedTried(true)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-panel"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-muted">🔒 {k.label}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">{k.province}</span>
                        </span>
                        <span className="shrink-0 text-[10px] text-muted">{m.fleet.notActive}</span>
                      </button>
                    ),
                  )}
                </div>

                {lockedTried && (
                  <div className="mt-1 rounded-lg border border-warn/30 bg-warn-soft px-2.5 py-2 text-[11px] leading-relaxed text-fg">
                    {m.fleet.lockedNote}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-xs text-muted">
          <span className="font-mono text-fg">
            {formatNumber(FLEET_STATS.live)} / {formatNumber(FLEET_STATS.registered)}
          </span>{" "}
          {m.fleet.activeLabel}
        </div>
      </div>
    </div>
  );
}
