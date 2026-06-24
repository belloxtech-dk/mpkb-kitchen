import { db } from "@/db";
import { receiptScans } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getAppSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cn } from "@/lib/cn";
import { FLEET_KITCHENS } from "@/lib/fleet/kitchens";
import Link from "next/link";
import { Building2, TrendingUp, AlertTriangle, Receipt } from "lucide-react";

function fmtIdr(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function KitchensPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");

  // Aggregate receipt stats per kitchen
  const kitchenStats = await db
    .select({
      kitchen:       receiptScans.kitchen,
      totalScans:    sql<number>`count(*)::int`,
      totalSpend:    sql<number>`coalesce(sum(total_idr), 0)`,
      totalOverpay:  sql<number>`coalesce(sum(overpayment_idr), 0)`,
      highRisk:      sql<number>`sum(case when risk_level in ('high','critical') then 1 else 0 end)::int`,
      lastSubmitted: sql<Date>`max(created_at)`,
    })
    .from(receiptScans)
    .groupBy(receiptScans.kitchen);

  const statsMap = new Map(kitchenStats.map((s) => [s.kitchen, s]));

  const globalTotal = kitchenStats.reduce((acc, s) => ({
    scans:    acc.scans + s.totalScans,
    spend:    acc.spend + Number(s.totalSpend),
    overpay:  acc.overpay + Number(s.totalOverpay),
    highRisk: acc.highRisk + s.highRisk,
  }), { scans: 0, spend: 0, overpay: 0, highRisk: 0 });

  const recentScans = await db
    .select({
      id:             receiptScans.id,
      createdAt:      receiptScans.createdAt,
      kitchen:        receiptScans.kitchen,
      supplier:       receiptScans.supplier,
      totalIdr:       receiptScans.totalIdr,
      overpaymentIdr: receiptScans.overpaymentIdr,
      riskLevel:      receiptScans.riskLevel,
      source:         receiptScans.source,
      flaggedCount:   receiptScans.flaggedCount,
      itemCount:      receiptScans.itemCount,
    })
    .from(receiptScans)
    .orderBy(desc(receiptScans.createdAt))
    .limit(15);

  const RISK_CLS: Record<string, string> = {
    low:      "text-pass bg-pass-soft",
    medium:   "text-warn bg-warn-soft",
    high:     "text-fail bg-fail-soft",
    critical: "text-fail bg-fail-soft",
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30 text-base">🏛️</span>
            Dashboard Pengawasan Lintas Dapur
          </h1>
          <p className="mt-1 text-sm text-muted">Ringkasan akuntansi semua dapur SPPG · untuk pengawas pemerintah</p>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total Struk"       value={String(globalTotal.scans)}       sub="dikirim semua dapur" />
        <Kpi label="Total Belanja"     value={fmtIdr(globalTotal.spend)}        sub="estimasi keseluruhan" />
        <Kpi label="Est. Kelebihan"    value={fmtIdr(globalTotal.overpay)}      sub="dari seluruh dapur"
          valueClass={globalTotal.overpay > 0 ? "text-fail" : "text-pass"} />
        <Kpi label="Kasus Risiko Tinggi" value={String(globalTotal.highRisk)}   sub="butuh investigasi"
          valueClass={globalTotal.highRisk > 0 ? "text-fail" : "text-pass"} />
      </div>

      {/* Per-kitchen status grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
          <Building2 className="size-4 text-accent" />
          Status Per Dapur ({FLEET_KITCHENS.length} dapur terdaftar)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLEET_KITCHENS.map((kitchen) => {
            const s = statsMap.get(kitchen.label);
            const overpayRatio = s && Number(s.totalSpend) > 0
              ? (Number(s.totalOverpay) / Number(s.totalSpend)) * 100
              : 0;
            const riskColor = overpayRatio >= 20 ? "text-fail" : overpayRatio >= 10 ? "text-warn" : "text-pass";

            return (
              <div key={kitchen.id} className={cn(
                "rounded-xl border bg-surface p-4 space-y-3",
                kitchen.pilot ? "border-accent/30" : "border-border",
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("size-2 rounded-full shrink-0", kitchen.status === "live" ? "bg-pass" : "bg-muted")} />
                      <span className="text-sm font-semibold text-fg truncate">{kitchen.label}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{kitchen.province}</p>
                  </div>
                  {kitchen.pilot && (
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">Pilot</span>
                  )}
                </div>

                {s ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-panel px-2.5 py-2">
                      <div className="text-[10px] text-muted">Struk</div>
                      <div className="font-mono text-base font-bold text-fg">{s.totalScans}</div>
                    </div>
                    <div className="rounded-lg bg-panel px-2.5 py-2">
                      <div className="text-[10px] text-muted">Total Belanja</div>
                      <div className="font-mono text-sm font-bold text-fg">{fmtIdr(Number(s.totalSpend))}</div>
                    </div>
                    <div className="rounded-lg bg-panel px-2.5 py-2">
                      <div className="text-[10px] text-muted">Kelebihan Bayar</div>
                      <div className={cn("font-mono text-sm font-bold", Number(s.totalOverpay) > 0 ? "text-fail" : "text-pass")}>
                        {fmtIdr(Number(s.totalOverpay))}
                      </div>
                    </div>
                    <div className="rounded-lg bg-panel px-2.5 py-2">
                      <div className="text-[10px] text-muted">% Markup</div>
                      <div className={cn("font-mono text-sm font-bold", riskColor)}>
                        {overpayRatio.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-panel px-3 py-3 text-center text-xs text-muted">
                    {kitchen.status === "locked" ? "🔒 Belum aktif" : "Belum ada data struk"}
                  </div>
                )}

                {s && (
                  <p className="text-[10px] text-muted">
                    Terakhir: {fmtDate(s.lastSubmitted)}
                    {s.highRisk > 0 && (
                      <span className="text-fail font-semibold ml-2">⚠ {s.highRisk} kasus risiko tinggi</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent submissions across all kitchens */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
          <Receipt className="size-4 text-accent" />
          Pengiriman Struk Terbaru (Semua Dapur)
        </h2>
        {recentScans.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm text-muted">Belum ada struk yang dikirim</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted uppercase bg-panel/50">
                    <th className="px-3 py-2.5">Waktu</th>
                    <th className="px-3 py-2.5">Dapur</th>
                    <th className="px-3 py-2.5">Pemasok</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-3 py-2.5 text-right">Kelebihan</th>
                    <th className="px-3 py-2.5 text-center">Risiko</th>
                    <th className="px-3 py-2.5 text-center">Via</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-panel/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5 text-fg max-w-[140px] truncate">{scan.kitchen}</td>
                      <td className="px-3 py-2.5 text-muted max-w-[120px] truncate">{scan.supplier ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">{fmtIdr(scan.totalIdr)}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap font-semibold",
                        scan.overpaymentIdr > 0 ? "text-fail" : "text-muted"
                      )}>
                        {scan.overpaymentIdr > 0 ? fmtIdr(scan.overpaymentIdr) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", RISK_CLS[scan.riskLevel] ?? "bg-panel text-muted")}>
                          {scan.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-muted">
                        {scan.source === "whatsapp" ? "📱 WA" : "🌐 Web"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* WA setup info */}
      <section className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
          📱 Integrasi WhatsApp Bot
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-accent">1. Setup WA Business Number</p>
            <p className="text-xs text-muted">Daftarkan nomor WA bisnis melalui Fonnte, Twilio, atau WhatsApp Cloud API. Arahkan webhook ke:</p>
            <code className="block text-[11px] bg-panel rounded px-2 py-1 text-fg font-mono break-all">
              https://mpkb-kitchen-production.up.railway.app/api/webhook/whatsapp
            </code>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-accent">2. Daftarkan Manager Dapur</p>
            <p className="text-xs text-muted">Setiap kepala SPPG mendapat nomor WA terdaftar. Mereka cukup foto & kirim struk — sistem otomatis proses.</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-accent">3. Pengawasan Real-time</p>
            <p className="text-xs text-muted">Setiap struk yang dikirim langsung masuk dashboard ini. Kelebihan bayar &gt;20% otomatis dikirim notifikasi ke pengawas.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {[
            ["WHATSAPP_PROVIDER", "fonnte"],
            ["FONNTE_TOKEN", "***"],
            ["WHATSAPP_WEBHOOK_SECRET", "mpkb-webhook-2026"],
          ].map(([key, val]) => (
            <code key={key} className="bg-panel rounded px-2 py-0.5 font-mono text-muted">
              {key}=<span className="text-accent">{val}</span>
            </code>
          ))}
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className={cn("font-mono text-2xl font-bold tabular-nums", valueClass ?? "text-fg")}>{value}</div>
      <div className="mt-1 text-xs font-semibold text-fg">{label}</div>
      <div className="mt-0.5 text-[11px] text-muted">{sub}</div>
    </div>
  );
}
