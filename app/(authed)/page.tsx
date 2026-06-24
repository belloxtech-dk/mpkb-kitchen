import Link from "next/link";
import { db } from "@/db";
import { events, financeEvents, ledger } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { getServerMessages } from "@/lib/i18n/server";
import { getAppSession } from "@/lib/auth/session";
import { FLEET_STATS } from "@/lib/fleet/kitchens";
import { ApiKeyBanner } from "@/components/api-key-banner";
import { ComplianceTrend } from "@/components/compliance-trend";
import { cn } from "@/lib/cn";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}
function fmtIdr(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${fmt(n)}`;
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_COLOR: Record<string, string> = {
  pass: "text-pass bg-pass-soft",
  warn: "text-warn bg-warn-soft",
  fail: "text-fail bg-fail-soft",
};
const RISK_COLOR: Record<string, string> = {
  low: "text-pass bg-pass-soft",
  medium: "text-warn bg-warn-soft",
  high: "text-fail bg-fail-soft",
  critical: "text-fail bg-fail-soft",
};

export default async function DashboardPage() {
  const m = await getServerMessages();
  const session = await getAppSession();

  const [sopStats, finStats, ledgerCount, recentSop, recentFin] = await Promise.all([
    db.select({
      count: sql<number>`count(*)::int`,
      avg: sql<number>`round(avg(compliance_score)::numeric, 1)`,
      passCount: sql<number>`sum(case when overall_status = 'pass' then 1 else 0 end)::int`,
      warnCount: sql<number>`sum(case when overall_status = 'warn' then 1 else 0 end)::int`,
      failCount: sql<number>`sum(case when overall_status = 'fail' then 1 else 0 end)::int`,
    }).from(events),

    db.select({
      count: sql<number>`count(*)::int`,
      totalLeakage: sql<number>`coalesce(sum(total_leakage_idr), 0)`,
      highRisk: sql<number>`sum(case when overall_risk in ('high','critical') then 1 else 0 end)::int`,
    }).from(financeEvents),

    db.select({ count: sql<number>`count(*)::int` }).from(ledger),

    db.select({
      id: events.id,
      createdAt: events.createdAt,
      zone: events.zone,
      overallStatus: events.overallStatus,
      complianceScore: events.complianceScore,
    }).from(events).orderBy(desc(events.createdAt)).limit(8),

    db.select({
      id: financeEvents.id,
      createdAt: financeEvents.createdAt,
      kitchen: financeEvents.kitchen,
      overallRisk: financeEvents.overallRisk,
      totalLeakageIdr: financeEvents.totalLeakageIdr,
    }).from(financeEvents).orderBy(desc(financeEvents.createdAt)).limit(3),
  ]);

  const sop = sopStats[0] ?? { count: 0, avg: null, passCount: 0, warnCount: 0, failCount: 0 };
  const fin = finStats[0] ?? { count: 0, totalLeakage: 0, highRisk: 0 };
  const lCount = ledgerCount[0]?.count ?? 0;

  const scoreNum = sop.avg ? Number(sop.avg) : null;
  const scoreColor = scoreNum === null ? "text-muted" : scoreNum >= 80 ? "text-pass" : scoreNum >= 60 ? "text-warn" : "text-fail";

  const apiKeyMissing = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith("PASTE_");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* API key warning */}
      {apiKeyMissing && <ApiKeyBanner />}

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Selamat datang, {session?.name ?? "Andrea"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Dashboard pemantauan integritas dapur MBG · SPPG Gamping, Yogyakarta
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Skor Kepatuhan"
          value={scoreNum !== null ? `${scoreNum}` : "—"}
          sub={scoreNum !== null ? "/ 100" : "belum ada data"}
          valueClass={scoreColor}
          href="/floor"
          accent="oklch(0.62 0.22 270)"
        />
        <KpiCard
          label="Inspeksi SOP"
          value={String(sop.count)}
          sub={`${sop.passCount ?? 0} lulus · ${sop.failCount ?? 0} gagal`}
          href="/floor"
          accent="oklch(0.72 0.18 155)"
        />
        <KpiCard
          label="Estimasi Kebocoran"
          value={fin.totalLeakage > 0 ? fmtIdr(Number(fin.totalLeakage)) : "—"}
          sub={`${fin.count} audit · ${fin.highRisk ?? 0} risiko tinggi`}
          valueClass={fin.highRisk > 0 ? "text-fail" : "text-fg"}
          href="/books"
          accent="oklch(0.68 0.22 22)"
        />
        <KpiCard
          label="Catatan Ledger"
          value={String(lCount)}
          sub="tersegel & terverifikasi"
          href="/ledger"
          accent="oklch(0.80 0.16 75)"
        />
      </div>

      {/* Fleet overview */}
      <div className="rounded-xl border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Jaringan Dapur MBG</h2>
          <span className="text-xs text-muted">{fmt(FLEET_STATS.registered)} dapur terdaftar · {FLEET_STATS.provinces} provinsi</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { label: "SPPG Gamping 01", active: true },
            { label: "SPPG Gamping 02", active: false },
            { label: "SPPG Gamping 03", active: false },
            { label: "SPPG Gamping 04", active: false },
            { label: "SPPG Gamping 05", active: false },
          ].map((k) => (
            <div key={k.label} className={cn(
              "rounded-lg border px-3 py-2.5 text-xs",
              k.active ? "border-pass/40 bg-pass-soft" : "border-border bg-panel",
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cn("size-1.5 rounded-full", k.active ? "bg-pass" : "bg-muted")} />
                <span className={cn("font-medium", k.active ? "text-pass" : "text-muted")}>
                  {k.active ? "LIVE" : "Terkunci"}
                </span>
              </div>
              <div className={cn("truncate", k.active ? "text-fg" : "text-muted")}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance trend */}
      {recentSop.length > 0 && (
        <div className="rounded-xl border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Tren Skor Kepatuhan</h2>
            <span className="text-xs text-muted">{recentSop.length} inspeksi terakhir</span>
          </div>
          <ComplianceTrend points={[...recentSop].reverse().map(e => ({
            zone: e.zone,
            score: e.complianceScore,
            status: e.overallStatus,
            time: e.createdAt,
          }))} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent SOP inspections */}
        <div className="rounded-xl border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Inspeksi SOP Terbaru</h2>
            <Link href="/floor" className="text-xs text-accent hover:underline">Lihat semua →</Link>
          </div>
          {recentSop.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">
              Belum ada inspeksi. <Link href="/floor" className="text-accent hover:underline">Mulai inspeksi →</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recentSop.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-panel px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{e.zone}</div>
                    <div className="text-[11px] text-muted">{fmtDate(e.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-semibold tabular-nums">{Math.round(e.complianceScore)}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", STATUS_COLOR[e.overallStatus] ?? "bg-panel text-muted")}>
                      {e.overallStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent finance audits */}
        <div className="rounded-xl border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Audit Keuangan Terbaru</h2>
            <Link href="/books" className="text-xs text-accent hover:underline">Lihat semua →</Link>
          </div>
          {recentFin.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">
              Belum ada audit. <Link href="/books" className="text-accent hover:underline">Mulai audit →</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recentFin.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-panel px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{e.kitchen}</div>
                    <div className="text-[11px] text-muted">{fmtDate(e.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-muted">{fmtIdr(Number(e.totalLeakageIdr))}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", RISK_COLOR[e.overallRisk] ?? "bg-panel text-muted")}>
                      {e.overallRisk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System status strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pass opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-pass" />
          </span>
          <span className="text-pass font-medium">Sistem Online</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="text-xs text-muted">SPPG Gamping, Yogyakarta</div>
        <div className="h-3 w-px bg-border" />
        <div className="text-xs text-muted">5 dapur terdaftar · 1 aktif</div>
        <div className="ml-auto text-xs text-muted hidden sm:block">
          🔗 <a href="https://mpkb-kitchen-production.up.railway.app" target="_blank" className="text-accent hover:underline">mpkb-kitchen-production.up.railway.app</a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <QuickAction href="/floor"   emoji="📷" label="Inspeksi CCTV"  sub="Analisis frame dapur" />
        <QuickAction href="/books"   emoji="📒" label="Audit Keuangan" sub="Periksa pembukuan" />
        <QuickAction href="/alerts"  emoji="🔔" label="Peringatan"     sub="Riwayat pelanggaran" />
        <QuickAction href="/reports" emoji="📋" label="Laporan"        sub="Ekspor & cetak" />
        <QuickAction href="/ledger"  emoji="🔐" label="Buku Besar"     sub="Jejak audit" />
      </div>
    </main>
  );
}

function KpiCard({ label, value, sub, valueClass, href, accent }: {
  label: string; value: string; sub: string; valueClass?: string; href: string; accent?: string;
}) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-accent/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 block">
      {accent && (
        <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{ background: accent }} />
      )}
      <div className={cn("font-mono text-2xl font-bold tabular-nums", valueClass ?? "text-fg")}>{value}</div>
      <div className="mt-1 text-xs font-semibold text-fg">{label}</div>
      <div className="mt-0.5 text-[11px] text-muted">{sub}</div>
    </Link>
  );
}

function QuickAction({ href, emoji, label, sub }: { href: string; emoji: string; label: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-0.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xl ring-1 ring-accent/20">{emoji}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-fg">{label}</div>
        <div className="text-xs text-muted truncate">{sub}</div>
      </div>
    </Link>
  );
}
