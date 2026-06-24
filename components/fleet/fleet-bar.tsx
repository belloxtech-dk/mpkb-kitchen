"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Lock, Search, Radio } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import { FLEET_KITCHENS, FLEET_STATS, pilotKitchen } from "@/lib/fleet/kitchens";

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

  const close = () => { setOpen(false); setQuery(""); setLockedTried(false); };

  return (
    <div className="relative z-30 border-b border-border/60 bg-bg/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">

        <div className="relative min-w-0 flex-1 sm:flex-none">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition hover:border-accent/60 sm:w-auto"
          >
            {/* live indicator */}
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pass opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-pass" />
            </span>
            <span className="truncate font-medium text-fg">{pilot.label}</span>
            <ChevronDown className={cn("size-3.5 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")} />
          </button>

          {open && (
            <>
              <button aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={close} />
              <div className="absolute left-0 z-40 mt-1.5 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-2 shadow-2xl shadow-black/60">

                {/* Search */}
                <div className="relative mb-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={m.fleet.searchPlaceholder}
                    autoFocus
                    className="w-full rounded-lg border border-border bg-panel py-1.5 pr-3 pl-8 text-sm text-fg outline-none focus:border-accent placeholder:text-muted"
                  />
                </div>

                <div className="px-1 py-1 text-[11px] text-muted">
                  {m.fleet.scaleLine(formatNumber(FLEET_STATS.registered), String(FLEET_STATS.provinces))}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {filtered.length === 0 && (
                    <div className="px-2 py-3 text-center text-xs text-muted">{m.fleet.noResults}</div>
                  )}
                  {filtered.map((k) =>
                    k.pilot ? (
                      <button
                        key={k.id}
                        type="button"
                        onClick={close}
                        className="flex w-full items-center justify-between gap-2 rounded-lg bg-pass/10 border border-pass/20 px-2.5 py-2 text-left"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-[13px] font-semibold text-fg">
                            <Radio className="size-3 text-pass" />
                            {k.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">{k.province}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-pass px-2 py-0.5 text-[9px] font-bold tracking-wider text-bg uppercase">
                          {m.fleet.pilotBadge}
                        </span>
                      </button>
                    ) : (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setLockedTried(true)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-panel"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Lock className="size-3 shrink-0 text-muted/50" />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] text-muted">{k.label}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-muted/60">{k.province}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-muted/50">{m.fleet.notActive}</span>
                      </button>
                    ),
                  )}
                </div>

                {lockedTried && (
                  <div className="mt-1.5 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] leading-relaxed text-warn">
                    {m.fleet.lockedNote}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="hidden shrink-0 items-center gap-3 text-xs text-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-pass font-semibold">{formatNumber(FLEET_STATS.live)}</span>
            <span>live</span>
            <span className="text-muted/40">·</span>
            <span className="font-mono text-fg">{formatNumber(FLEET_STATS.registered)}</span>
            <span>terdaftar</span>
          </span>
          <span className="hidden lg:inline text-muted/40">·</span>
          <span className="hidden lg:inline">{FLEET_STATS.provinces} provinsi</span>
        </div>
      </div>
    </div>
  );
}
