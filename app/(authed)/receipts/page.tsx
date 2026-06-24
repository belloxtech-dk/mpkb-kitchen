import { db } from "@/db";
import { receiptScans } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { getAppSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cn } from "@/lib/cn";
import { ReceiptScanner } from "@/components/receipt/receipt-scanner";
import { ScanLine, ShieldX, ShieldAlert, ShieldCheck } from "lucide-react";

function fmtIdr(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const RISK_STYLE: Record<string, { cls: string; label: string }> = {
  low:      { cls: "text-pass bg-pass-soft",  label: "Rendah" },
  medium:   { cls: "text-warn bg-warn-soft",  label: "Sedang" },
  high:     { cls: "text-fail bg-fail-soft",  label: "Tinggi" },
  critical: { cls: "text-fail bg-fail-soft",  label: "KRITIS" },
};

export default async function ReceiptsPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");

  const [recentScans, stats] = await Promise.all([
    db.select({
      id:             receiptScans.id,
      createdAt:      receiptScans.createdAt,
      supplier:       receiptScans.supplier,
      receiptDate:    receiptScans.receiptDate,
      totalIdr:       receiptScans.totalIdr,
      overpaymentIdr: receiptScans.overpaymentIdr,
      riskLevel:      receiptScans.riskLevel,
      itemCount:      receiptScans.itemCount,
      flaggedCount:   receiptScans.flaggedCount,
      summary:        receiptScans.summary,
    })
      .from(receiptScans)
      .orderBy(desc(receiptScans.createdAt))
      .limit(20),

    db.select({
      total:           sql<number>`count(*)::int`,
      totalOverpay:    sql<number>`coalesce(sum(overpayment_idr),0)`,
      highRiskCount:   sql<number>`sum(case when risk_level in ('high','critical') then 1 else 0 end)::int`,
      flaggedItems:    sql<number>`coalesce(sum(flagged_count),0)::int`,
    }).from(receiptScans),
  ]);

  const s = stats[0] ?? { total: 0, totalOverpay: 0, highRiskCount: 0, flaggedItems: 0 };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30">
            🧾
          </span>
          Verifikasi Struk
        </h1>
        <p className="mt-1 text-sm text-muted">
          Foto struk — AI baca & bandingkan harga dengan pasar Yogyakarta secara otomatis
        </p>
      </div>

      {/* Stats */}
      {s.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Struk"       value={String(s.total)}               sub="diverifikasi" />
          <StatCard label="Kelebihan Bayar"   value={fmtIdr(Number(s.totalOverpay))} sub="estimasi total"
            valueClass={s.totalOverpay > 0 ? "text-fail" : "text-pass"} />
          <StatCard label="Struk Bermasalah"  value={String(s.highRiskCount)}        sub="risiko tinggi/kritis"
            valueClass={s.highRiskCount > 0 ? "text-fail" : "text-pass"} />
          <StatCard label="Item Ditandai"     value={String(s.flaggedItems)}         sub="harga tidak wajar"
            valueClass={s.flaggedItems > 0 ? "text-warn" : "text-pass"} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Scanner */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
            <ScanLine className="size-4 text-accent" />
            Scan Struk Baru
          </h2>
          <ReceiptScanner />
        </div>

        {/* History */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Riwayat Pemindaian</h2>

          {recentScans.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-sm font-medium text-fg">Belum ada struk</p>
              <p className="text-xs text-muted mt-1">Scan struk pertama untuk mulai memverifikasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((scan) => {
                const risk = RISK_STYLE[scan.riskLevel] ?? RISK_STYLE["low"]!;
                return (
                  <div key={scan.id} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-fg truncate">
                            {scan.supplier ?? "Pemasok tidak diketahui"}
                          </span>
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", risk?.cls)}>
                            {risk?.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">{fmtDate(scan.createdAt)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-sm font-semibold text-fg">{fmtIdr(scan.totalIdr)}</div>
                        {scan.overpaymentIdr > 0 && (
                          <div className="text-[11px] text-fail font-medium">
                            +{fmtIdr(scan.overpaymentIdr)} lebih
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      <span>{scan.itemCount} item</span>
                      {scan.flaggedCount > 0 && (
                        <span className="text-warn">{scan.flaggedCount} ditandai</span>
                      )}
                      <span className="ml-auto font-mono opacity-60">{scan.id.slice(0, 8)}…</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, sub, valueClass }: {
  label: string; value: string; sub: string; valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className={cn("font-mono text-2xl font-bold tabular-nums", valueClass ?? "text-fg")}>{value}</div>
      <div className="mt-1 text-xs font-semibold text-fg">{label}</div>
      <div className="mt-0.5 text-[11px] text-muted">{sub}</div>
    </div>
  );
}
