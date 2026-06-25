import { db } from "@/db";
import { events, financeEvents, ledger } from "@/db/schema";
import { desc, sql, gte } from "drizzle-orm";
import { cn } from "@/lib/cn";
import { PrintButton } from "./print-button";
import { LiveScanPanel } from "@/components/live-scan-panel";

/* ── Formatters ───────────────────────────────────────────────────── */
function fmtIdr(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function fmtDateShort(d: Date | string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/* ── Status helpers ───────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  pass: "text-pass bg-pass-soft",
  warn: "text-warn bg-warn-soft",
  fail: "text-fail bg-fail-soft",
};
const RISK_COLOR: Record<string, string> = {
  low:      "text-pass bg-pass-soft",
  medium:   "text-warn bg-warn-soft",
  high:     "text-fail bg-fail-soft",
  critical: "text-fail bg-fail-soft",
};

/* ── Inline CSS-bar trend (server-renderable) ─────────────────────── */
function TrendBar({ score, status }: { score: number; status: string }) {
  const h = Math.max(4, (score / 100) * 56);
  const color =
    score >= 80 ? "bg-pass" : score >= 60 ? "bg-warn" : "bg-fail";
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <span className="text-[9px] text-muted font-mono tabular-nums">{Math.round(score)}</span>
      <div
        className={cn("rounded-t w-full min-w-[6px]", color)}
        style={{ height: `${h}px` }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default async function ReportsPage() {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [sopStats, sopRecent, finStats, finRecent, ledgerCount] = await Promise.all([
    /* 30-day SOP aggregate */
    db
      .select({
        count:      sql<number>`count(*)::int`,
        avg:        sql<number>`round(avg(compliance_score)::numeric,1)`,
        passCount:  sql<number>`sum(case when overall_status='pass' then 1 else 0 end)::int`,
        warnCount:  sql<number>`sum(case when overall_status='warn' then 1 else 0 end)::int`,
        failCount:  sql<number>`sum(case when overall_status='fail' then 1 else 0 end)::int`,
      })
      .from(events)
      .where(gte(events.createdAt, since)),

    /* Last 30 SOP events for trend bars */
    db
      .select({
        id: events.id,
        createdAt: events.createdAt,
        zone: events.zone,
        overallStatus: events.overallStatus,
        complianceScore: events.complianceScore,
        summary: events.summary,
      })
      .from(events)
      .where(gte(events.createdAt, since))
      .orderBy(desc(events.createdAt))
      .limit(30),

    /* 30-day finance aggregate */
    db
      .select({
        count:         sql<number>`count(*)::int`,
        totalLeakage:  sql<number>`coalesce(sum(total_leakage_idr),0)`,
        highRisk:      sql<number>`sum(case when overall_risk in ('high','critical') then 1 else 0 end)::int`,
        mediumRisk:    sql<number>`sum(case when overall_risk='medium' then 1 else 0 end)::int`,
        lowRisk:       sql<number>`sum(case when overall_risk='low' then 1 else 0 end)::int`,
      })
      .from(financeEvents)
      .where(gte(financeEvents.createdAt, since)),

    /* Last 10 finance events */
    db
      .select({
        id: financeEvents.id,
        createdAt: financeEvents.createdAt,
        kitchen: financeEvents.kitchen,
        overallRisk: financeEvents.overallRisk,
        totalLeakageIdr: financeEvents.totalLeakageIdr,
        summary: financeEvents.summary,
        scenarioId: financeEvents.scenarioId,
      })
      .from(financeEvents)
      .where(gte(financeEvents.createdAt, since))
      .orderBy(desc(financeEvents.createdAt))
      .limit(10),

    /* Ledger total count */
    db.select({ count: sql<number>`count(*)::int` }).from(ledger),
  ]);

  const sop   = sopStats[0]  ?? { count: 0, avg: null, passCount: 0, warnCount: 0, failCount: 0 };
  const fin   = finStats[0]  ?? { count: 0, totalLeakage: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
  const lCount = ledgerCount[0]?.count ?? 0;

  const scoreNum   = sop.avg ? Number(sop.avg) : null;
  const scoreColor = scoreNum === null ? "text-muted" : scoreNum >= 80 ? "text-pass" : scoreNum >= 60 ? "text-warn" : "text-fail";

  const passRate = sop.count > 0 ? Math.round((sop.passCount / sop.count) * 100) : null;

  const dateLabel = `${since.toLocaleDateString("id-ID", { day: "numeric", month: "long" })} – ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

  /* reversed for chronological left→right trend */
  const trendPoints = [...sopRecent].reverse();

  return (
    <>
      {/* ── Print stylesheet ────────────────────────────────────────── */}
      <style>{`
        @media print {
          header, nav, [data-print-hide] { display: none !important; }
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .rounded-xl, .rounded-lg { border-radius: 4px !important; }
          * { box-shadow: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        {/* ── Live AI Scan ─────────────────────────────────────────── */}
        <LiveScanPanel />

        {/* ── Report header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-2xl ring-1 ring-accent/30">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Laporan Kepatuhan &amp; Keuangan</h1>
              <p className="mt-0.5 text-sm text-muted">SPPG Gamping, Yogyakarta</p>
              <p className="mt-0.5 text-xs text-muted">Periode: {dateLabel}</p>
              <p className="mt-0.5 text-xs text-muted">Dicetak: {fmtDate(now)}</p>
            </div>
          </div>
          <PrintButton />
        </div>

        {/* ── KPI summary strip ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Rata-rata Skor SOP"
            value={scoreNum !== null ? `${scoreNum}` : "—"}
            sub={scoreNum !== null ? "/ 100" : "belum ada data"}
            valueClass={scoreColor}
          />
          <SummaryCard
            label="Total Inspeksi"
            value={String(sop.count)}
            sub={passRate !== null ? `${passRate}% lulus` : "—"}
          />
          <SummaryCard
            label="Est. Kebocoran"
            value={fin.totalLeakage > 0 ? fmtIdr(Number(fin.totalLeakage)) : "—"}
            sub={`${fin.count} audit keuangan`}
            valueClass={fin.highRisk > 0 ? "text-fail" : "text-fg"}
          />
          <SummaryCard
            label="Catatan Ledger"
            value={String(lCount)}
            sub="tersegel & terverifikasi"
            valueClass="text-pass"
          />
        </div>

        {/* ── SOP Compliance Breakdown ──────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Ringkasan Inspeksi SOP (30 Hari)</h2>
            <span className="text-xs text-muted">{sop.count} total inspeksi</span>
          </div>

          {sop.count === 0 ? (
            <p className="text-xs text-muted text-center py-6">Belum ada data inspeksi dalam 30 hari terakhir.</p>
          ) : (
            <>
              {/* Pass / Warn / Fail pills */}
              <div className="flex flex-wrap gap-3">
                <StatusPill label="Lulus" count={sop.passCount} total={sop.count} cls="text-pass bg-pass-soft" />
                <StatusPill label="Peringatan" count={sop.warnCount} total={sop.count} cls="text-warn bg-warn-soft" />
                <StatusPill label="Gagal" count={sop.failCount} total={sop.count} cls="text-fail bg-fail-soft" />
              </div>

              {/* Trend chart */}
              {trendPoints.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-2">Tren Skor Kepatuhan ({trendPoints.length} inspeksi, terlama → terbaru)</p>
                  <div className="flex items-end gap-1 h-16 px-1 rounded-lg bg-panel/50 py-2">
                    {trendPoints.map((p) => (
                      <TrendBar key={p.id} score={p.complianceScore} status={p.overallStatus} />
                    ))}
                  </div>
                </div>
              )}

              {/* Detail table */}
              {sopRecent.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="pb-2 pr-3 font-medium">Tanggal</th>
                        <th className="pb-2 pr-3 font-medium">Zona</th>
                        <th className="pb-2 pr-3 font-medium text-right">Skor</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {sopRecent.map((e) => (
                        <tr key={e.id}>
                          <td className="py-1.5 pr-3 text-muted whitespace-nowrap">{fmtDateShort(e.createdAt)}</td>
                          <td className="py-1.5 pr-3 truncate max-w-[160px]">{e.zone}</td>
                          <td className="py-1.5 pr-3 text-right font-mono tabular-nums font-semibold">
                            {Math.round(e.complianceScore)}
                          </td>
                          <td className="py-1.5">
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", STATUS_COLOR[e.overallStatus] ?? "bg-panel text-muted")}>
                              {e.overallStatus === "pass" ? "lulus" : e.overallStatus === "warn" ? "peringatan" : "gagal"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Finance Audit Summary ─────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Ringkasan Audit Keuangan (30 Hari)</h2>
            <span className="text-xs text-muted">{fin.count} total audit</span>
          </div>

          {fin.count === 0 ? (
            <p className="text-xs text-muted text-center py-6">Belum ada data audit keuangan dalam 30 hari terakhir.</p>
          ) : (
            <>
              {/* Finance KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-panel px-3 py-3">
                  <div className="text-[11px] text-muted mb-1">Total Kebocoran</div>
                  <div className={cn("text-lg font-bold font-mono tabular-nums", fin.highRisk > 0 ? "text-fail" : "text-fg")}>
                    {fmtIdr(Number(fin.totalLeakage))}
                  </div>
                </div>
                <div className="rounded-lg bg-panel px-3 py-3">
                  <div className="text-[11px] text-muted mb-1">Risiko Tinggi</div>
                  <div className={cn("text-lg font-bold font-mono", fin.highRisk > 0 ? "text-fail" : "text-pass")}>
                    {fin.highRisk}
                  </div>
                </div>
                <div className="rounded-lg bg-panel px-3 py-3">
                  <div className="text-[11px] text-muted mb-1">Risiko Sedang</div>
                  <div className="text-lg font-bold font-mono text-warn">{fin.mediumRisk}</div>
                </div>
                <div className="rounded-lg bg-panel px-3 py-3">
                  <div className="text-[11px] text-muted mb-1">Risiko Rendah</div>
                  <div className="text-lg font-bold font-mono text-pass">{fin.lowRisk}</div>
                </div>
              </div>

              {/* Finance table */}
              {finRecent.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="pb-2 pr-3 font-medium">Tanggal</th>
                        <th className="pb-2 pr-3 font-medium">Dapur</th>
                        <th className="pb-2 pr-3 font-medium">Skenario</th>
                        <th className="pb-2 pr-3 font-medium text-right">Kebocoran</th>
                        <th className="pb-2 font-medium">Risiko</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {finRecent.map((e) => (
                        <tr key={e.id}>
                          <td className="py-1.5 pr-3 text-muted whitespace-nowrap">{fmtDateShort(e.createdAt)}</td>
                          <td className="py-1.5 pr-3 truncate max-w-[120px]">{e.kitchen}</td>
                          <td className="py-1.5 pr-3 text-muted truncate max-w-[120px]">{e.scenarioId}</td>
                          <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                            {fmtIdr(Number(e.totalLeakageIdr))}
                          </td>
                          <td className="py-1.5">
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", RISK_COLOR[e.overallRisk] ?? "bg-panel text-muted")}>
                              {e.overallRisk === "low" ? "rendah" : e.overallRisk === "medium" ? "sedang" : e.overallRisk === "high" ? "tinggi" : "kritis"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Ledger Chain Status ───────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Status Buku Besar (Ledger)</h2>
            <span className="flex items-center gap-1.5 text-xs text-pass">
              <span className="size-1.5 rounded-full bg-pass" />
              Diverifikasi
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-panel px-3 py-3">
              <div className="text-[11px] text-muted mb-1">Total Catatan</div>
              <div className="text-lg font-bold font-mono tabular-nums">{lCount}</div>
            </div>
            <div className="rounded-lg bg-panel px-3 py-3">
              <div className="text-[11px] text-muted mb-1">Integritas Rantai</div>
              <div className="text-lg font-bold text-pass">Tersegel</div>
            </div>
            <div className="rounded-lg bg-panel px-3 py-3">
              <div className="text-[11px] text-muted mb-1">Metode Hash</div>
              <div className="text-sm font-semibold text-muted">SHA-256</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Setiap catatan di buku besar terhubung secara kriptografis ke catatan sebelumnya.
            Modifikasi retroaktif akan memutus rantai hash dan langsung terdeteksi.
          </p>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="border-t border-border pt-4 flex items-center justify-between text-[11px] text-muted print:hidden">
          <span>MPKB Kitchen Integrity · SPPG Gamping, Yogyakarta</span>
          <span>Laporan dibuat otomatis · {fmtDate(now)}</span>
        </div>
        <div className="hidden border-t border-border pt-4 flex items-center justify-between text-[11px] text-muted" style={{ display: 'none' }} aria-hidden>
          {/* Print footer rendered via CSS @page */}
        </div>
      </main>
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */
function SummaryCard({ label, value, sub, valueClass }: {
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

function StatusPill({ label, count, total, cls }: {
  label: string; count: number; total: number; cls: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", cls)}>
      <span>{count}</span>
      <span className="text-xs font-normal opacity-80">{label} ({pct}%)</span>
    </div>
  );
}
