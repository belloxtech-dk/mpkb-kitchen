/**
 * Demo data seeder for SPPG Gamping (Yogyakarta) — populates the live reports
 * with realistic CCTV compliance checks, receipt/finance audits, and a
 * tamper-evident, hash-chained audit ledger.
 *
 * Self-contained (no `@/` aliases) so it runs cleanly under tsx:
 *   DATABASE_URL=postgresql://codex@localhost:5432/mpkb_kitchen \
 *     npx tsx db/demo-seed.ts
 *
 * Idempotent-ish: it TRUNCATEs events / finance_events / ledger first so reruns
 * give a clean, consistent demo state. Auth/user tables are left untouched.
 */
import { randomUUID, createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { events, financeEvents, ledger } from "./schema";

// ---- ledger hashing (inlined to stay alias-free) --------------------------
const GENESIS_HASH = "0".repeat(64);
function sha256(s: string) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}
function hashPayload(payload: unknown) {
  return sha256(stableStringify(payload));
}
function chainHash(prevHash: string, payloadHash: string) {
  return sha256(`${prevHash}:${payloadHash}`);
}

const KITCHEN = "SPPG Gamping, Yogyakarta";
const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60_000);
const isoDay = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// 1) CCTV compliance events (SOP verdicts)
// ---------------------------------------------------------------------------
interface SeedEvent {
  zone: string;
  source: string;
  createdAt: Date;
  verdict: {
    summary: string;
    checks: { id: string; status: string; confidence: number; note: string }[];
    violations: { ruleId: string; severity: string; detail: string; recommendedAction: string }[];
    overallStatus: string;
    complianceScore: number;
  };
}

const seedEvents: SeedEvent[] = [
  {
    zone: "Pengolahan",
    source: "frame",
    createdAt: minutesAgo(12),
    verdict: {
      summary: "Dapur pengolahan tertib: APD lengkap, permukaan bersih.",
      overallStatus: "pass",
      complianceScore: 96,
      checks: [
        { id: "hairnet", status: "pass", confidence: 0.95, note: "Semua pekerja memakai jaring rambut." },
        { id: "gloves", status: "pass", confidence: 0.92, note: "Sarung tangan dipakai saat menangani bahan." },
        { id: "apron", status: "pass", confidence: 0.9, note: "Celemek bersih terpasang." },
        { id: "clean_surfaces", status: "pass", confidence: 0.88, note: "Meja olah bebas tumpahan." },
      ],
      violations: [],
    },
  },
  {
    zone: "Pemorsian",
    source: "frame",
    createdAt: minutesAgo(34),
    verdict: {
      summary: "Pemorsian: satu petugas tanpa sarung tangan saat menyentuh makanan matang.",
      overallStatus: "fail",
      complianceScore: 61,
      checks: [
        { id: "hairnet", status: "pass", confidence: 0.93, note: "Topi/jaring rambut terpasang." },
        { id: "gloves", status: "fail", confidence: 0.86, note: "Tangan telanjang menyentuh nasi matang." },
        { id: "cross_contamination", status: "warn", confidence: 0.7, note: "Sendok porsi dipakai bergantian." },
      ],
      violations: [
        {
          ruleId: "gloves",
          severity: "high",
          detail: "Petugas pemorsian menyentuh makanan siap saji tanpa sarung tangan.",
          recommendedAction: "Hentikan pemorsian, pakai sarung tangan bersih sebelum melanjutkan.",
        },
      ],
    },
  },
  {
    zone: "Cuci Ompreng",
    source: "frame",
    createdAt: minutesAgo(58),
    verdict: {
      summary: "Area cuci ompreng: lantai tergenang air, risiko terpeleset.",
      overallStatus: "warn",
      complianceScore: 78,
      checks: [
        { id: "apron", status: "pass", confidence: 0.9, note: "Celemek tahan air dipakai." },
        { id: "clean_surfaces", status: "warn", confidence: 0.75, note: "Genangan air di sekitar bak cuci." },
        { id: "handwashing", status: "pass", confidence: 0.82, note: "Tangan tampak bersih." },
      ],
      violations: [
        {
          ruleId: "clean_surfaces",
          severity: "medium",
          detail: "Lantai area cuci tergenang air dan berpotensi licin.",
          recommendedAction: "Keringkan lantai dan periksa saluran pembuangan.",
        },
      ],
    },
  },
  {
    zone: "Gudang Basah",
    source: "upload",
    createdAt: minutesAgo(96),
    verdict: {
      summary: "Gudang basah: sayur tersimpan rapi, bahan mentah & matang terpisah.",
      overallStatus: "pass",
      complianceScore: 91,
      checks: [
        { id: "food_storage", status: "pass", confidence: 0.9, note: "Bahan tersimpan di rak, tidak di lantai." },
        { id: "cross_contamination", status: "pass", confidence: 0.87, note: "Bahan mentah terpisah dari matang." },
        { id: "clean_surfaces", status: "pass", confidence: 0.85, note: "Rak penyimpanan bersih." },
      ],
      violations: [],
    },
  },
  {
    zone: "Ruang Persiapan",
    source: "frame",
    createdAt: minutesAgo(140),
    verdict: {
      summary: "Persiapan: talenan bahan mentah dipakai untuk sayur matang.",
      overallStatus: "fail",
      complianceScore: 54,
      checks: [
        { id: "hairnet", status: "pass", confidence: 0.9, note: "Jaring rambut terpasang." },
        { id: "cross_contamination", status: "fail", confidence: 0.84, note: "Talenan daging mentah dipakai untuk sayur." },
        { id: "clean_surfaces", status: "warn", confidence: 0.7, note: "Sisa potongan di meja persiapan." },
      ],
      violations: [
        {
          ruleId: "cross_contamination",
          severity: "high",
          detail: "Talenan bekas bahan mentah dipakai untuk bahan siap masak tanpa dicuci.",
          recommendedAction: "Gunakan talenan terpisah berkode warna untuk mentah dan matang.",
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// 2) Finance / receipt audits (reconciliation + assessment)
// ---------------------------------------------------------------------------
interface SeedFinance {
  scenarioId: string;
  dateIso: string;
  overallRisk: string;
  totalLeakageIdr: number;
  createdAt: Date;
  reconciliation: {
    scenarioId: string;
    totalLeakageIdr: number;
    findings: {
      kind: string;
      title: string;
      leakageIdr: number;
      evidence: { label: string; value: string }[];
    }[];
  };
  assessment: {
    summary: string;
    overallRisk: string;
    findings: {
      kind: string;
      severity: string;
      explanation: string;
      recommendedAction: string;
    }[];
  };
}

const idr = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

const seedFinance: SeedFinance[] = [
  {
    scenarioId: "gamping-2026-06-23",
    dateIso: isoDay(2),
    overallRisk: "high",
    totalLeakageIdr: 1_120_000,
    createdAt: minutesAgo(180),
    reconciliation: {
      scenarioId: "gamping-2026-06-23",
      totalLeakageIdr: 1_120_000,
      findings: [
        {
          kind: "ghost_meals",
          title: "Porsi tidak terhitung",
          leakageIdr: 700_000,
          evidence: [
            { label: "Terdaftar", value: "1.250" },
            { label: "Hadir", value: "1.180" },
            { label: "Disajikan", value: "1.180" },
            { label: "Ditagih", value: "1.250" },
            { label: "Selisih", value: "70 (5,6%)" },
            { label: "Estimasi kebocoran", value: idr(700_000) },
          ],
        },
        {
          kind: "price_markup",
          title: "Markup harga",
          leakageIdr: 420_000,
          evidence: [
            { label: "Ayam (Sumber Rejeki)", value: `${idr(42_000)}/kg vs ref ${idr(36_000)}/kg` },
            { label: "Selisih markup", value: idr(420_000) },
          ],
        },
      ],
    },
    assessment: {
      summary: "Indikasi porsi hantu dan markup harga ayam pada pengadaan 23 Jun.",
      overallRisk: "high",
      findings: [
        {
          kind: "ghost_meals",
          severity: "high",
          explanation: "70 porsi ditagih melebihi yang disajikan, setara Rp700.000.",
          recommendedAction: "Cocokkan daftar hadir dengan jumlah porsi yang ditagih supplier.",
        },
        {
          kind: "price_markup",
          severity: "medium",
          explanation: "Harga ayam 16% di atas harga referensi pasar.",
          recommendedAction: "Minta penawaran pembanding dari minimal dua pemasok.",
        },
      ],
    },
  },
  {
    scenarioId: "gamping-2026-06-24",
    dateIso: isoDay(1),
    overallRisk: "medium",
    totalLeakageIdr: 285_000,
    createdAt: minutesAgo(120),
    reconciliation: {
      scenarioId: "gamping-2026-06-24",
      totalLeakageIdr: 285_000,
      findings: [
        {
          kind: "threshold_gaming",
          title: "Pemecahan di bawah ambang",
          leakageIdr: 0,
          evidence: [
            { label: "Ambang persetujuan", value: idr(5_000_000) },
            { label: "Invoice A", value: idr(4_900_000) },
            { label: "Invoice B", value: idr(4_850_000) },
          ],
        },
        {
          kind: "price_markup",
          title: "Markup harga",
          leakageIdr: 285_000,
          evidence: [
            { label: "Minyak goreng", value: `${idr(19_000)}/L vs ref ${idr(16_500)}/L` },
            { label: "Selisih markup", value: idr(285_000) },
          ],
        },
      ],
    },
    assessment: {
      summary: "Dua invoice di bawah ambang dari pemasok sama; markup minyak goreng.",
      overallRisk: "medium",
      findings: [
        {
          kind: "threshold_gaming",
          severity: "medium",
          explanation: "Dua tagihan tepat di bawah ambang Rp5 juta dalam satu hari.",
          recommendedAction: "Gabungkan dan tinjau ulang pengadaan dari pemasok ini.",
        },
        {
          kind: "price_markup",
          severity: "low",
          explanation: "Harga minyak goreng 15% di atas referensi.",
          recommendedAction: "Verifikasi harga pasar terkini sebelum pembayaran.",
        },
      ],
    },
  },
  {
    scenarioId: "gamping-2026-06-25",
    dateIso: isoDay(0),
    overallRisk: "low",
    totalLeakageIdr: 0,
    createdAt: minutesAgo(45),
    reconciliation: {
      scenarioId: "gamping-2026-06-25",
      totalLeakageIdr: 0,
      findings: [],
    },
    assessment: {
      summary: "Pengadaan 25 Jun bersih: harga wajar, porsi cocok dengan kehadiran.",
      overallRisk: "low",
      findings: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Ledger payload builders (must mirror db/repo.ts so verifyLedger() passes)
// ---------------------------------------------------------------------------
function sopPayload(row: {
  id: string;
  zone: string;
  source: string;
  createdAtMs: number;
  verdict: unknown;
}) {
  return {
    kind: "sop_event",
    refId: row.id,
    zone: row.zone,
    source: row.source,
    createdAt: row.createdAtMs,
    verdict: row.verdict,
  };
}

function financePayload(row: {
  id: string;
  scenarioId: string;
  kitchen: string;
  dateIso: string;
  createdAtMs: number;
  reconciliation: unknown;
  assessment: unknown;
}) {
  return {
    kind: "finance_event",
    refId: row.id,
    scenarioId: row.scenarioId,
    kitchen: row.kitchen,
    dateIso: row.dateIso,
    createdAt: row.createdAtMs,
    reconciliation: row.reconciliation,
    assessment: row.assessment,
  };
}

async function main() {
  const url =
    process.env.DATABASE_URL ?? "postgresql://localhost:5432/mpkb_kitchen";
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema: { events, financeEvents, ledger } });

  console.log("→ Clearing existing demo data (events, finance_events, ledger)…");
  await pool.query("TRUNCATE TABLE ledger, events, finance_events RESTART IDENTITY CASCADE");

  // Build a combined, chronologically-ordered set of records so the hash chain
  // reflects real append order.
  type LedgerItem =
    | { type: "sop"; createdAt: Date; ev: SeedEvent }
    | { type: "finance"; createdAt: Date; fin: SeedFinance };

  const items: LedgerItem[] = [
    ...seedEvents.map((ev) => ({ type: "sop" as const, createdAt: ev.createdAt, ev })),
    ...seedFinance.map((fin) => ({ type: "finance" as const, createdAt: fin.createdAt, fin })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  let prevHash = GENESIS_HASH;
  let eventCount = 0;
  let financeCount = 0;
  let ledgerCount = 0;

  for (const item of items) {
    const id = randomUUID();

    if (item.type === "sop") {
      const { ev } = item;
      await db.insert(events).values({
        id,
        createdAt: ev.createdAt,
        zone: ev.zone,
        source: ev.source,
        overallStatus: ev.verdict.overallStatus,
        complianceScore: ev.verdict.complianceScore,
        summary: ev.verdict.summary,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        verdict: ev.verdict as any,
      });
      eventCount++;

      const payloadHash = hashPayload(
        sopPayload({
          id,
          zone: ev.zone,
          source: ev.source,
          createdAtMs: ev.createdAt.getTime(),
          verdict: ev.verdict,
        }),
      );
      const hash = chainHash(prevHash, payloadHash);
      await db.insert(ledger).values({
        createdAt: ev.createdAt,
        kind: "sop_event",
        refId: id,
        payloadHash,
        prevHash,
        hash,
      });
      prevHash = hash;
      ledgerCount++;
    } else {
      const { fin } = item;
      await db.insert(financeEvents).values({
        id,
        createdAt: fin.createdAt,
        scenarioId: fin.scenarioId,
        kitchen: KITCHEN,
        dateIso: fin.dateIso,
        overallRisk: fin.overallRisk,
        totalLeakageIdr: fin.totalLeakageIdr,
        summary: fin.assessment.summary,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reconciliation: fin.reconciliation as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assessment: fin.assessment as any,
      });
      financeCount++;

      const payloadHash = hashPayload(
        financePayload({
          id,
          scenarioId: fin.scenarioId,
          kitchen: KITCHEN,
          dateIso: fin.dateIso,
          createdAtMs: fin.createdAt.getTime(),
          reconciliation: fin.reconciliation,
          assessment: fin.assessment,
        }),
      );
      const hash = chainHash(prevHash, payloadHash);
      await db.insert(ledger).values({
        createdAt: fin.createdAt,
        kind: "finance_event",
        refId: id,
        payloadHash,
        prevHash,
        hash,
      });
      prevHash = hash;
      ledgerCount++;
    }
  }

  console.log(`✓ Inserted ${eventCount} CCTV events`);
  console.log(`✓ Inserted ${financeCount} finance audits`);
  console.log(`✓ Inserted ${ledgerCount} ledger entries (hash chain intact)`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
