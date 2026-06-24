"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatIdr } from "@/lib/format";
import {
  PRICE_BENCHMARKS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type PriceBenchmark,
} from "@/lib/finance/benchmarks";

/** Row for one benchmark item, with an optional injected actual price. */
interface PriceRow extends PriceBenchmark {
  actualIdr?: number;
}

interface PriceTableProps {
  /** Optionally inject actual prices from invoice data (keyed by item name). */
  actualPrices?: Record<string, number>;
}

function statusFor(row: PriceRow): 'pass' | 'warn' | 'fail' | 'none' {
  if (row.actualIdr === undefined) return 'none';
  const pct = ((row.actualIdr - row.referenceIdr) / row.referenceIdr) * 100;
  if (pct >= row.failThresholdPct) return 'fail';
  if (pct >= row.warnThresholdPct) return 'warn';
  return 'pass';
}

const STATUS_CLS = {
  pass: 'text-pass',
  warn: 'text-warn',
  fail: 'text-fail',
  none: 'text-muted',
} as const;

const STATUS_BADGE = {
  pass: 'bg-pass-soft text-pass',
  warn: 'bg-warn-soft text-warn',
  fail: 'bg-fail-soft text-fail',
  none: '',
} as const;

export function PriceTable({ actualPrices = {} }: PriceTableProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PriceBenchmark['category'] | 'all'>('all');

  const rows: PriceRow[] = useMemo(
    () =>
      PRICE_BENCHMARKS.map((b) => ({
        ...b,
        actualIdr: actualPrices[b.item],
      })),
    [actualPrices],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return rows.filter((r) => {
      const matchQuery = !q || r.item.toLowerCase().includes(q) || r.unit.includes(q);
      const matchCat = activeCategory === 'all' || r.category === activeCategory;
      return matchQuery && matchCat;
    });
  }, [rows, query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<PriceBenchmark['category'], PriceRow[]>();
    for (const row of filtered) {
      const arr = map.get(row.category) ?? [];
      arr.push(row);
      map.set(row.category, arr);
    }
    return map;
  }, [filtered]);

  const visibleCategories = CATEGORY_ORDER.filter((cat) => grouped.has(cat));

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari bahan..."
            className="w-full rounded-lg border bg-panel py-1.5 pr-3 pl-8 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...CATEGORY_ORDER] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition',
                activeCategory === cat
                  ? 'bg-accent text-accent-fg'
                  : 'bg-panel text-muted hover:text-fg',
              )}
            >
              {cat === 'all' ? 'Semua' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-pass inline-block" />
          Sesuai referensi
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-warn inline-block" />
          Di atas referensi (+10%)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-fail inline-block" />
          Pelanggaran (+20%)
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {visibleCategories.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Tidak ada data yang cocok.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-panel text-left text-[11px] font-semibold tracking-wide text-muted uppercase">
                <th className="px-3 py-2">Bahan</th>
                <th className="px-3 py-2">Satuan</th>
                <th className="px-3 py-2 text-right">Harga Referensi</th>
                <th className="px-3 py-2 text-right">Peringatan</th>
                <th className="px-3 py-2 text-right">Pelanggaran</th>
                {Object.keys(actualPrices).length > 0 && (
                  <>
                    <th className="px-3 py-2 text-right">Harga Aktual</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((cat) => {
                const catRows = grouped.get(cat)!;
                return (
                  <React.Fragment key={cat}>
                    {/* Category header row */}
                    <tr className="border-b bg-surface/60">
                      <td
                        colSpan={Object.keys(actualPrices).length > 0 ? 7 : 5}
                        className="px-3 py-1.5"
                      >
                        <span className="text-[10px] font-semibold tracking-wider text-accent uppercase">
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </td>
                    </tr>

                    {/* Item rows */}
                    {catRows.map((row) => {
                      const status = statusFor(row);
                      return (
                        <tr
                          key={row.item}
                          className="border-b border-border/50 transition hover:bg-panel/40"
                        >
                          <td className="px-3 py-2 font-medium">{row.item}</td>
                          <td className="px-3 py-2 text-muted">{row.unit}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {formatIdr(row.referenceIdr)}
                          </td>
                          <td className="px-3 py-2 text-right text-warn">
                            +{row.warnThresholdPct}%
                          </td>
                          <td className="px-3 py-2 text-right text-fail">
                            +{row.failThresholdPct}%
                          </td>
                          {Object.keys(actualPrices).length > 0 && (
                            <>
                              <td
                                className={cn(
                                  'px-3 py-2 text-right font-mono tabular-nums',
                                  STATUS_CLS[status],
                                )}
                              >
                                {row.actualIdr !== undefined
                                  ? formatIdr(row.actualIdr)
                                  : <span className="text-muted">—</span>}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {status !== 'none' && (
                                  <span
                                    className={cn(
                                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                      STATUS_BADGE[status],
                                    )}
                                  >
                                    {status === 'pass' ? 'OK'
                                      : status === 'warn' ? 'WASPADA'
                                      : 'LANGGAR'}
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-muted">
        * Harga referensi berdasarkan survei pasar Yogyakarta, 2026. Ambang batas peringatan dan pelanggaran dapat disesuaikan per item.
      </p>
    </div>
  );
}
