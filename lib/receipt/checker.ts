/**
 * Price Cross-Check Engine
 *
 * Fuzzy-matches each extracted receipt item against Yogyakarta 2026 benchmarks,
 * flags overpricing, and computes total estimated overpayment.
 */

import { PRICE_BENCHMARKS, benchmarkStatus, type PriceBenchmark } from "@/lib/finance/benchmarks";
import type { ExtractedItem, ReceiptExtraction } from "./scanner";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CheckStatus = "pass" | "warn" | "fail" | "unknown";

export interface PriceCheck {
  itemName:       string;
  quantity:       number;
  unit:           string;
  unitPrice:      number;
  totalPrice:     number;
  matchedBenchmark: string | null;   // benchmark item name that matched
  referencePrice: number | null;     // reference unit price
  pctAboveRef:    number | null;     // % above reference (can be negative = below)
  overpaymentIdr: number;            // estimated overpayment for this line item
  status:         CheckStatus;
  flag:           string | null;     // human-readable flag message
}

export interface CrossCheckResult {
  checks:         PriceCheck[];
  totalIdr:       number;
  overpaymentIdr: number;
  flaggedCount:   number;
  riskLevel:      "low" | "medium" | "high" | "critical";
  summary:        string;
}

// ── Fuzzy matching ────────────────────────────────────────────────────────────

// Normalize item names for matching
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Keyword aliases to help matching
const ALIASES: Record<string, string[]> = {
  "ayam broiler": ["ayam", "chicken", "broiler", "karkas"],
  "beras medium": ["beras", "rice", "nasi", "gabah"],
  "telur ayam":   ["telur", "eggs", "telor"],
  "tahu putih":   ["tahu"],
  "tempe":        ["tempe", "tempeh"],
  "minyak goreng curah": ["minyak", "goreng", "oil"],
  "sayur bayam":  ["bayam", "spinach", "sayur"],
  "wortel":       ["wortel", "carrot"],
  "cabai merah keriting": ["cabai", "cabe", "chili"],
  "daging sapi":  ["sapi", "beef", "daging"],
  "ikan bandeng": ["bandeng", "ikan"],
  "gula pasir":   ["gula", "sugar"],
  "garam dapur":  ["garam", "salt"],
  "bawang merah": ["bawang merah", "shallot"],
  "bawang putih": ["bawang putih", "garlic"],
  "tepung terigu":["tepung", "terigu", "flour"],
  "mie kering":   ["mie", "mi", "noodle"],
  "santan kelapa":["santan", "coconut milk"],
  "kecap manis":  ["kecap"],
  "kentang":      ["kentang", "potato"],
};

function findBenchmark(itemName: string): PriceBenchmark | null {
  const n = normalize(itemName);

  // Direct substring match first
  for (const b of PRICE_BENCHMARKS) {
    if (n.includes(normalize(b.item)) || normalize(b.item).includes(n)) return b;
  }

  // Alias matching
  for (const [benchmarkKey, aliases] of Object.entries(ALIASES)) {
    if (aliases.some((alias) => n.includes(alias))) {
      const found = PRICE_BENCHMARKS.find(
        (b) => normalize(b.item).includes(normalize(benchmarkKey)),
      );
      if (found) return found;
    }
  }

  return null;
}

// ── Core checker ──────────────────────────────────────────────────────────────

export function crossCheck(extraction: ReceiptExtraction): CrossCheckResult {
  const checks: PriceCheck[] = extraction.items.map((item): PriceCheck => {
    const benchmark = findBenchmark(item.name);

    if (!benchmark) {
      return {
        itemName:         item.name,
        quantity:         item.quantity,
        unit:             item.unit,
        unitPrice:        item.unitPrice,
        totalPrice:       item.totalPrice,
        matchedBenchmark: null,
        referencePrice:   null,
        pctAboveRef:      null,
        overpaymentIdr:   0,
        status:           "unknown",
        flag:             null,
      };
    }

    const status = benchmarkStatus(benchmark, item.unitPrice);
    const pctAbove = ((item.unitPrice - benchmark.referenceIdr) / benchmark.referenceIdr) * 100;
    const overpayment = Math.max(0, (item.unitPrice - benchmark.referenceIdr) * item.quantity);

    let flag: string | null = null;
    if (status === "fail") {
      flag = `Harga ${pctAbove.toFixed(0)}% di atas referensi (Rp ${item.unitPrice.toLocaleString("id-ID")} vs Rp ${benchmark.referenceIdr.toLocaleString("id-ID")}/${benchmark.unit})`;
    } else if (status === "warn") {
      flag = `Harga ${pctAbove.toFixed(0)}% di atas referensi — perlu pembenaran`;
    }

    return {
      itemName:         item.name,
      quantity:         item.quantity,
      unit:             item.unit,
      unitPrice:        item.unitPrice,
      totalPrice:       item.totalPrice,
      matchedBenchmark: benchmark.item,
      referencePrice:   benchmark.referenceIdr,
      pctAboveRef:      Math.round(pctAbove * 10) / 10,
      overpaymentIdr:   Math.round(overpayment),
      status,
      flag,
    };
  });

  const totalIdr       = extraction.total;
  const overpaymentIdr = checks.reduce((sum, c) => sum + c.overpaymentIdr, 0);
  const flaggedCount   = checks.filter((c) => c.status === "warn" || c.status === "fail").length;
  const failCount      = checks.filter((c) => c.status === "fail").length;

  // Risk level
  let riskLevel: CrossCheckResult["riskLevel"] = "low";
  const overpayPct = totalIdr > 0 ? (overpaymentIdr / totalIdr) * 100 : 0;
  if (failCount >= 3 || overpayPct >= 20) riskLevel = "critical";
  else if (failCount >= 1 || overpayPct >= 10) riskLevel = "high";
  else if (flaggedCount >= 2 || overpayPct >= 5) riskLevel = "medium";

  // Summary
  const fmt = (n: number) =>
    n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}jt` : `Rp ${Math.round(n).toLocaleString("id-ID")}`;

  let summary: string;
  if (flaggedCount === 0) {
    summary = `Struk dari ${extraction.supplierName} — ${checks.length} item, total ${fmt(totalIdr)}. Semua harga dalam batas wajar.`;
  } else {
    const flaggedItems = checks.filter((c) => c.flag).map((c) => c.itemName).join(", ");
    summary = `Struk dari ${extraction.supplierName} — ${flaggedCount} dari ${checks.length} item terindikasi harga tidak wajar. Estimasi kelebihan bayar: ${fmt(overpaymentIdr)}. Item: ${flaggedItems}.`;
  }

  return { checks, totalIdr, overpaymentIdr, flaggedCount, riskLevel, summary };
}
