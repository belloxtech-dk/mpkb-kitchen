'use client';

import { useState } from 'react';
import { BellOff, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 20;

/* ── Status helpers ───────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  warn: 'Peringatan',
  fail: 'Gagal',
};
const STATUS_COLOR: Record<string, string> = {
  warn: 'text-warn bg-warn-soft border-warn/30',
  fail: 'text-fail bg-fail-soft border-fail/30',
};
const STATUS_BORDER: Record<string, string> = {
  warn: 'border-l-warn/60',
  fail: 'border-l-fail/60',
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export interface AlertRow {
  id: string;
  createdAt: Date | string;
  zone: string;
  overallStatus: string;
  complianceScore: number;
  summary: string;
}

export function AlertsView({ violations }: { violations: AlertRow[] }) {
  const [shown, setShown] = useState(PAGE_SIZE);

  if (violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-panel text-4xl ring-1 ring-border">
          <BellOff className="size-8 text-muted" />
        </div>
        <div>
          <p className="text-base font-semibold text-fg">Belum ada peringatan</p>
          <p className="mt-1 text-sm text-muted">Semua inspeksi SOP lulus dengan baik.</p>
        </div>
      </div>
    );
  }

  const visible = violations.slice(0, shown);
  const hasMore = shown < violations.length;

  return (
    <div className="space-y-3">
      {/* Stats strip */}
      <div className="flex flex-wrap gap-3 mb-2">
        <StatChip
          label="Total Pelanggaran"
          value={violations.length}
          cls="text-fg bg-panel"
        />
        <StatChip
          label="Gagal"
          value={violations.filter((v) => v.overallStatus === 'fail').length}
          cls="text-fail bg-fail-soft"
        />
        <StatChip
          label="Peringatan"
          value={violations.filter((v) => v.overallStatus === 'warn').length}
          cls="text-warn bg-warn-soft"
        />
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {visible.map((v) => (
          <AlertItem key={v.id} v={v} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE_SIZE)}
            className="flex items-center gap-2 rounded-lg border border-border bg-panel px-5 py-2.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-fg"
          >
            <ChevronDown className="size-4" />
            Muat lebih banyak ({violations.length - shown} tersisa)
          </button>
        </div>
      )}

      {/* End note */}
      {!hasMore && violations.length > PAGE_SIZE && (
        <p className="text-center text-xs text-muted pt-2">
          Semua {violations.length} pelanggaran telah ditampilkan.
        </p>
      )}
    </div>
  );
}

function AlertItem({ v }: { v: AlertRow }) {
  const [expanded, setExpanded] = useState(false);
  const borderClass = STATUS_BORDER[v.overallStatus] ?? 'border-l-border';
  const badgeClass  = STATUS_COLOR[v.overallStatus]  ?? 'text-muted bg-panel border-border/30';
  const scoreColor  =
    v.complianceScore >= 80 ? 'text-pass' :
    v.complianceScore >= 60 ? 'text-warn' : 'text-fail';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface border-l-4 transition-all duration-150',
        borderClass,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: zone + date */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={cn(
                  'rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  badgeClass,
                )}
              >
                {STATUS_LABEL[v.overallStatus] ?? v.overallStatus}
              </span>
              <span className="text-xs font-medium truncate text-fg">{v.zone}</span>
            </div>
            <p className="text-[11px] text-muted">{fmtDate(v.createdAt)}</p>
          </div>

          {/* Right: score */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className={cn('font-mono text-xl font-bold tabular-nums', scoreColor)}>
              {Math.round(v.complianceScore)}
            </span>
            <span className="text-[10px] text-muted">/ 100</span>
          </div>
        </div>

        {/* Summary preview */}
        <p className={cn('mt-2 text-xs text-muted line-clamp-2', expanded && 'line-clamp-none')}>
          {v.summary}
        </p>
      </button>
    </div>
  );
}

function StatChip({
  label, value, cls,
}: { label: string; value: number; cls: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold', cls)}>
      <span className="font-mono tabular-nums">{value}</span>
      <span className="text-xs font-normal opacity-80">{label}</span>
    </div>
  );
}
