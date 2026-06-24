/**
 * THE BRAIN — MBG domain context engine.
 *
 * This module runs BEFORE every Claude call and injects:
 * - Real Indonesian food-safety regulations
 * - MBG program-specific requirements
 * - Historical violation patterns for this zone
 * - Time-of-day context (prep vs service vs cleanup)
 * - Zone-specific focus areas
 * - Market price benchmarks for finance audits
 *
 * Better context → better Claude output. Every token here pays for itself.
 */

import { db } from "@/db";
import { events } from "@/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";

// ─── Regulatory Context ────────────────────────────────────────────────────────

export const MBG_REGULATORY_CONTEXT = `
REGULATORY FRAMEWORK — MBG PROGRAM INDONESIA:
• Peraturan Presiden No. 83 Tahun 2024 — Makan Bergizi Gratis: Each SPPG kitchen must meet
  BPOM-certified hygiene standards before operation. Meals must be prepared within 4 hours of service.
• Permenkes No. 1096/Menkes/Per/VI/2011 — Jasaboga Hygiene: All food handlers must wear
  hairnets, aprons, and gloves. No jewellery. Monthly health checks required.
• SNI 7388:2009 — Maximum contamination limits for school meals. Cross-contamination between
  raw and cooked food is a criminal violation under UU Pangan No. 18/2012.
• Kepmenkes 942/Menkes/SK/VII/2003 — Ready-to-eat food must be covered and stored above floor level.
  Temperature: hot food >60°C, cold food <5°C.
• MBG SOP Kemenkes 2024: Mandatory PPE = hairnet + gloves + apron + closed footwear.
  Any critical violation must be reported to the regional health office (Dinkes) within 24 hours.

SPPG GAMPING SPECIFIC:
• Kitchen code: SPPG-YK-GAM-01, Kec. Gamping, Kab. Sleman, DI Yogyakarta
• Capacity: 540 siswa/hari (across 3 schools)
• Operating hours: 05:00-11:00 WIB (prep), 10:30-11:30 WIB (distribution)
• Pilot status: Percontohan Aktif — under direct monitoring by BPOM Yogyakarta
`.trim();

// ─── Time-of-Day Context ────────────────────────────────────────────────────────

export function getTimeContext(): string {
  const hour = new Date().getHours() + 7; // WIB (UTC+7)
  const wibHour = hour % 24;

  if (wibHour >= 4 && wibHour < 7)
    return "WAKTU: Persiapan pagi dini hari (04:00-07:00 WIB). Fokus: penerimaan bahan baku, pengecekan suhu, sanitasi awal.";
  if (wibHour >= 7 && wibHour < 10)
    return "WAKTU: Produksi utama (07:00-10:00 WIB). Fokus: penggunaan PPE penuh, penanganan bahan mentah vs matang, kebersihan permukaan.";
  if (wibHour >= 10 && wibHour < 12)
    return "WAKTU: Plating dan distribusi (10:00-12:00 WIB). Fokus: pengemasan steril, suhu makanan matang, kontrol portioning.";
  if (wibHour >= 12 && wibHour < 14)
    return "WAKTU: Pembersihan pasca-produksi (12:00-14:00 WIB). Fokus: sanitasi peralatan, pembersihan permukaan, pembuangan limbah.";
  return "WAKTU: Di luar jam operasional normal. Evaluasi keamanan penyimpanan dan kondisi fasilitas.";
}

// ─── Zone Focus Areas ────────────────────────────────────────────────────────────

export const ZONE_FOCUS: Record<string, string> = {
  "Zone A": "ZONA A — AREA PERSIAPAN: Fokus inspeksi pada penanganan bahan mentah (ayam, ikan, sayur), penggunaan talenan terpisah (warna berbeda untuk daging/sayuran), kebersihan meja prep, dan penggunaan sarung tangan saat menyentuh protein mentah.",
  "Zona A": "ZONA A — AREA PERSIAPAN: Fokus inspeksi pada penanganan bahan mentah (ayam, ikan, sayur), penggunaan talenan terpisah (warna berbeda untuk daging/sayuran), kebersihan meja prep, dan penggunaan sarung tangan saat menyentuh protein mentah.",
  "Zone B": "ZONA B — AREA MEMASAK: Fokus inspeksi pada suhu memasak yang adekuat (daging >74°C, nasi >63°C), penanganan wajan/panci panas dengan aman, penggunaan APD tahan panas, dan kontaminasi asap/uap.",
  "Zona B": "ZONA B — AREA MEMASAK: Fokus inspeksi pada suhu memasak yang adekuat (daging >74°C, nasi >63°C), penanganan wajan/panci panas dengan aman, penggunaan APD tahan panas, dan kontaminasi asap/uap.",
  "Zone C": "ZONA C — PLATING & PENYIMPANAN: Fokus inspeksi pada pemisahan makanan matang dari mentah, pengemasan tertutup, kondisi wadah/kontainer, suhu penyimpanan, dan kebersihan area distribusi.",
  "Zona C": "ZONA C — PLATING & PENYIMPANAN: Fokus inspeksi pada pemisahan makanan matang dari mentah, pengemasan tertutup, kondisi wadah/kontainer, suhu penyimpanan, dan kebersihan area distribusi.",
};

export function getZoneFocus(zone: string): string {
  return (
    ZONE_FOCUS[zone] ??
    `ZONA: ${zone} — Periksa semua aspek kebersihan, PPE, dan penanganan makanan yang dapat diamati.`
  );
}

// ─── Historical Violation Context ───────────────────────────────────────────────

export interface ZoneHistory {
  totalInspections: number;
  avgScore: number;
  recentViolations: { ruleId: string; count: number }[];
  lastScore: number | null;
  trend: "improving" | "stable" | "declining" | "unknown";
}

export async function getZoneHistory(zone: string, days = 14): Promise<ZoneHistory> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recent = await db
    .select()
    .from(events)
    .where(eq(events.zone, zone))
    .orderBy(desc(events.createdAt))
    .limit(20);

  if (recent.length === 0) return { totalInspections: 0, avgScore: 0, recentViolations: [], lastScore: null, trend: "unknown" };

  // Count violations across recent events
  const violationCounts: Record<string, number> = {};
  for (const ev of recent) {
    for (const v of (ev.verdict as { violations?: { ruleId: string }[] }).violations ?? []) {
      violationCounts[v.ruleId] = (violationCounts[v.ruleId] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(violationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ruleId, count]) => ({ ruleId, count }));

  const scores = recent.map((e) => e.complianceScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const lastScore = scores[0] ?? null;

  // Trend: compare first half vs second half of recent inspections
  let trend: ZoneHistory["trend"] = "stable";
  if (scores.length >= 4) {
    const half = Math.floor(scores.length / 2);
    const recent_avg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const older_avg = scores.slice(half).reduce((a, b) => a + b, 0) / half;
    if (recent_avg > older_avg + 5) trend = "improving";
    else if (recent_avg < older_avg - 5) trend = "declining";
  }

  return {
    totalInspections: recent.length,
    avgScore: Math.round(avgScore * 10) / 10,
    recentViolations: sorted,
    lastScore,
    trend,
  };
}

export function formatZoneHistory(history: ZoneHistory): string {
  if (history.totalInspections === 0)
    return "RIWAYAT: Belum ada inspeksi sebelumnya di zona ini. Baseline pertama.";

  const trendLabel = {
    improving: "📈 Membaik",
    stable: "➡ Stabil",
    declining: "📉 Menurun",
    unknown: "❓ Tidak diketahui",
  }[history.trend];

  const lines = [
    `RIWAYAT ZONA (${history.totalInspections} inspeksi terakhir):`,
    `• Rata-rata skor: ${history.avgScore}/100 | Skor terakhir: ${history.lastScore ?? "N/A"} | Tren: ${trendLabel}`,
  ];

  if (history.recentViolations.length > 0) {
    lines.push("• Pelanggaran berulang yang perlu diperhatikan secara khusus:");
    for (const v of history.recentViolations) {
      lines.push(`  - ${v.ruleId}: ditemukan ${v.count}x dalam inspeksi terakhir`);
    }
    lines.push("  ⚠ Berikan perhatian EKSTRA pada aturan di atas karena pola berulang.");
  } else {
    lines.push("• Tidak ada pelanggaran berulang yang signifikan dalam periode ini. ✓");
  }

  return lines.join("\n");
}

// ─── Finance Market Context ──────────────────────────────────────────────────────

export const YOGYAKARTA_MARKET_CONTEXT_2026 = `
KONTEKS PASAR YOGYAKARTA (Juni 2026):
• Harga referensi beras medium: Rp 14.000-15.000/kg (Pasar Gamping, Beringharjo)
• Harga ayam broiler: Rp 36.000-40.000/kg (fluktuasi ±15% normal)
• Telur ayam: Rp 27.000-30.000/kg
• Tahu putih: Rp 8.000-10.000/300g (Sentra Tahu Kota Gedhe)
• Tempe: Rp 7.000-9.000/papan (250g)
• Minyak goreng curah: Rp 15.500-17.000/L
• Sayuran hijau (bayam, kangkung): Rp 5.000-8.000/kg musim normal
• Daging sapi: Rp 130.000-145.000/kg (fluktuasi tinggi)
• Ikan bandeng: Rp 28.000-35.000/kg
• Bawang merah: Rp 35.000-55.000/kg (sangat fluktuatif)
• Bawang putih: Rp 30.000-45.000/kg (sangat fluktuatif)

CATATAN: Harga bawang dan cabai dapat berfluktuasi hingga ±30% per minggu.
Gunakan range ini sebagai konteks — markup di luar range atas = tanda bahaya.

PERATURAN PENGADAAN MBG:
• Perpres No. 83/2024: Pengadaan bahan baku WAJIB dari pemasok terdaftar SPPG
• Batas persetujuan mandiri Kepala SPPG: Rp 50.000.000/transaksi
• Tender wajib di atas Rp 50.000.000 (Perka LKPP)
• Satu pemasok tidak boleh menguasai >60% total pengadaan bulanan (anti-monopoli)
• Selisih harga >20% dari referensi pasar = WAJIB dilaporkan ke pengawas
`.trim();

// ─── Full Context Builder ────────────────────────────────────────────────────────

export interface VisionContext {
  regulatory: string;
  timeContext: string;
  zoneFocus: string;
  zoneHistory: string;
}

export async function buildVisionContext(zone: string): Promise<VisionContext> {
  const history = await getZoneHistory(zone);
  return {
    regulatory: MBG_REGULATORY_CONTEXT,
    timeContext: getTimeContext(),
    zoneFocus: getZoneFocus(zone),
    zoneHistory: formatZoneHistory(history),
  };
}

export function formatVisionContext(ctx: VisionContext): string {
  return [
    "═══ KONTEKS INSPEKSI MBG ═══",
    ctx.regulatory,
    "",
    ctx.timeContext,
    "",
    ctx.zoneFocus,
    "",
    ctx.zoneHistory,
    "═══════════════════════════",
  ].join("\n");
}
