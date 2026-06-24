"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, TrendingUp, Hash } from "lucide-react";
import { cn } from "@/lib/cn";

type CheckStatus = "pass" | "warn" | "fail" | "unknown";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface Check {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  matchedBenchmark: string | null;
  referencePrice: number | null;
  pctAboveRef: number | null;
  overpaymentIdr: number;
  status: CheckStatus;
  flag: string | null;
}

interface ScanResult {
  id: string;
  extraction: {
    supplierName: string;
    receiptDate?: string;
    receiptNumber?: string;
    total: number;
    confidence: string;
    notes?: string;
  };
  check: {
    checks: Check[];
    totalIdr: number;
    overpaymentIdr: number;
    flaggedCount: number;
    riskLevel: RiskLevel;
    summary: string;
  };
  imageHash: string;
}

function fmtIdr(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  low:      { label: "Risiko Rendah",   cls: "text-pass bg-pass-soft border-pass/30",  icon: ShieldCheck },
  medium:   { label: "Risiko Sedang",   cls: "text-warn bg-warn-soft border-warn/30",  icon: ShieldAlert },
  high:     { label: "Risiko Tinggi",   cls: "text-fail bg-fail-soft border-fail/30",  icon: ShieldX },
  critical: { label: "KRITIS",          cls: "text-fail bg-fail-soft border-fail/30",  icon: ShieldX },
};

const STATUS_ROW: Record<CheckStatus, string> = {
  pass:    "bg-pass-soft/30",
  warn:    "bg-warn-soft/40 border-l-2 border-l-warn/60",
  fail:    "bg-fail-soft/40 border-l-2 border-l-fail/60",
  unknown: "",
};

const STATUS_BADGE: Record<CheckStatus, string> = {
  pass:    "bg-pass-soft text-pass",
  warn:    "bg-warn-soft text-warn",
  fail:    "bg-fail-soft text-fail",
  unknown: "bg-panel text-muted",
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass:    "OK",
  warn:    "WASPADA",
  fail:    "LANGGAR",
  unknown: "—",
};

export function ReceiptResults({ result }: { result: ScanResult }) {
  const [showAll, setShowAll] = useState(false);
  const { extraction, check, imageHash } = result;
  const risk = RISK_CONFIG[check.riskLevel];
  const RiskIcon = risk.icon;

  const displayed = showAll ? check.checks : check.checks.slice(0, 8);
  const hasMore = check.checks.length > 8;

  return (
    <div className="space-y-3">
      {/* Risk banner */}
      <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", risk.cls)}>
        <RiskIcon className="size-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{risk.label}</span>
            <span className="text-xs opacity-80">·</span>
            <span className="text-xs opacity-80">{extraction.supplierName}</span>
            {extraction.receiptDate && (
              <>
                <span className="text-xs opacity-60">·</span>
                <span className="text-xs opacity-80">{extraction.receiptDate}</span>
              </>
            )}
          </div>
          <p className="mt-0.5 text-xs opacity-90 line-clamp-2">{check.summary}</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Total Struk"     value={fmtIdr(check.totalIdr)}       sub={`${check.checks.length} item`} />
        <Kpi label="Kelebihan Bayar" value={fmtIdr(check.overpaymentIdr)} sub="estimasi"
          valueClass={check.overpaymentIdr > 0 ? "text-fail" : "text-pass"} />
        <Kpi label="Item Ditandai"   value={String(check.flaggedCount)}    sub={`dari ${check.checks.length}`}
          valueClass={check.flaggedCount > 0 ? "text-warn" : "text-pass"} />
        <Kpi label="Kepercayaan OCR" value={extraction.confidence === "high" ? "Tinggi" : extraction.confidence === "medium" ? "Sedang" : "Rendah"}
          sub="akurasi baca" valueClass={extraction.confidence === "high" ? "text-pass" : "text-warn"} />
      </div>

      {/* Item table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
          <span className="text-xs font-semibold text-fg">Detail Item</span>
          <span className="text-[11px] text-muted">{check.checks.length} item ditemukan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-[10px] font-semibold tracking-wide text-muted uppercase bg-panel/50">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Harga / satuan</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">Ref. Harga</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">Selisih</th>
                <th className="px-3 py-2 text-right">Lebih Bayar</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {displayed.map((c, i) => (
                <tr key={i} className={cn("transition-colors", STATUS_ROW[c.status])}>
                  <td className="px-3 py-2.5 font-medium max-w-[140px]">
                    <div className="truncate">{c.itemName}</div>
                    {c.flag && (
                      <div className="text-[10px] text-fail mt-0.5 line-clamp-1">{c.flag}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted whitespace-nowrap">
                    {c.quantity} {c.unit}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                    {fmtIdr(c.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted font-mono tabular-nums whitespace-nowrap hidden sm:table-cell">
                    {c.referencePrice ? fmtIdr(c.referencePrice) : "—"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap hidden sm:table-cell",
                    c.pctAboveRef !== null && c.pctAboveRef > 0 ? "text-fail" : "text-pass"
                  )}>
                    {c.pctAboveRef !== null
                      ? `${c.pctAboveRef > 0 ? "+" : ""}${c.pctAboveRef.toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap",
                    c.overpaymentIdr > 0 ? "text-fail font-semibold" : "text-muted"
                  )}>
                    {c.overpaymentIdr > 0 ? fmtIdr(c.overpaymentIdr) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", STATUS_BADGE[c.status])}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted hover:text-fg transition border-t border-border/50 bg-panel/30"
          >
            {showAll ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {showAll ? "Sembunyikan" : `Lihat ${check.checks.length - 8} item lainnya`}
          </button>
        )}
      </div>

      {/* Ledger stamp */}
      <div className="flex items-center gap-2 rounded-lg border border-pass/20 bg-pass/5 px-3 py-2 text-[11px] text-muted">
        <Hash className="size-3.5 text-pass shrink-0" />
        <span>Tersegel · ID: <span className="font-mono text-fg">{result.id.slice(0, 8)}…</span></span>
        <span className="text-border">·</span>
        <span>Hash gambar: <span className="font-mono">{imageHash.slice(0, 12)}…</span></span>
        <TrendingUp className="size-3 text-pass ml-auto shrink-0" />
      </div>

      {/* Extraction notes */}
      {extraction.notes && (
        <p className="text-[11px] text-muted px-1">
          ℹ️ Catatan OCR: {extraction.notes}
        </p>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className={cn("font-mono text-lg font-bold tabular-nums", valueClass ?? "text-fg")}>{value}</div>
      <div className="text-[11px] font-medium text-fg mt-0.5">{label}</div>
      <div className="text-[10px] text-muted">{sub}</div>
    </div>
  );
}
