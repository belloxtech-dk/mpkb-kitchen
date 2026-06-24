/**
 * Reference price benchmarks for MBG (Makan Bergizi Gratis) grocery items.
 * Prices reflect Yogyakarta regional market rates as of 2026.
 * Used by the price-table component and reconciliation engine.
 */

export interface PriceBenchmark {
  item: string;           // item name in Indonesian
  unit: string;           // kg, L, pcs, etc.
  referenceIdr: number;   // reference price per unit
  warnThresholdPct: number;  // % above reference = warn (default 10)
  failThresholdPct: number;  // % above reference = violation (default 20)
  category: 'protein' | 'carb' | 'vegetable' | 'oil' | 'spice' | 'other';
}

export const PRICE_BENCHMARKS: PriceBenchmark[] = [
  // ── Carbohydrates ───────────────────────────────────────────────────────────
  {
    item: 'Beras Medium',
    unit: 'kg',
    referenceIdr: 14_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'carb',
  },
  {
    item: 'Tepung Terigu',
    unit: 'kg',
    referenceIdr: 12_500,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'carb',
  },
  {
    item: 'Mie Kering',
    unit: 'kg',
    referenceIdr: 18_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'carb',
  },
  {
    item: 'Kentang',
    unit: 'kg',
    referenceIdr: 16_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'carb',
  },

  // ── Proteins ────────────────────────────────────────────────────────────────
  {
    item: 'Ayam Broiler (Karkas)',
    unit: 'kg',
    referenceIdr: 38_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'protein',
  },
  {
    item: 'Telur Ayam',
    unit: 'kg',
    referenceIdr: 28_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'protein',
  },
  {
    item: 'Tahu Putih',
    unit: 'pcs',
    referenceIdr: 2_500,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'protein',
  },
  {
    item: 'Tempe',
    unit: 'kg',
    referenceIdr: 16_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'protein',
  },
  {
    item: 'Ikan Bandeng',
    unit: 'kg',
    referenceIdr: 32_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'protein',
  },
  {
    item: 'Daging Sapi (Has Luar)',
    unit: 'kg',
    referenceIdr: 135_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'protein',
  },

  // ── Vegetables ──────────────────────────────────────────────────────────────
  {
    item: 'Sayur Bayam',
    unit: 'kg',
    referenceIdr: 8_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'vegetable',
  },
  {
    item: 'Wortel',
    unit: 'kg',
    referenceIdr: 14_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'vegetable',
  },
  {
    item: 'Cabai Merah Keriting',
    unit: 'kg',
    referenceIdr: 45_000,
    warnThresholdPct: 15,
    failThresholdPct: 30,
    category: 'vegetable',
  },

  // ── Oils & Fats ─────────────────────────────────────────────────────────────
  {
    item: 'Minyak Goreng Curah',
    unit: 'L',
    referenceIdr: 17_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'oil',
  },
  {
    item: 'Santan Kelapa (Kemasan)',
    unit: 'L',
    referenceIdr: 22_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'oil',
  },

  // ── Spices & Condiments ─────────────────────────────────────────────────────
  {
    item: 'Gula Pasir',
    unit: 'kg',
    referenceIdr: 17_500,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'spice',
  },
  {
    item: 'Garam Dapur',
    unit: 'kg',
    referenceIdr: 9_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'spice',
  },
  {
    item: 'Bawang Merah',
    unit: 'kg',
    referenceIdr: 42_000,
    warnThresholdPct: 15,
    failThresholdPct: 25,
    category: 'spice',
  },
  {
    item: 'Bawang Putih',
    unit: 'kg',
    referenceIdr: 38_000,
    warnThresholdPct: 15,
    failThresholdPct: 25,
    category: 'spice',
  },
  {
    item: 'Kecap Manis',
    unit: 'L',
    referenceIdr: 24_000,
    warnThresholdPct: 10,
    failThresholdPct: 20,
    category: 'spice',
  },
];

/** Ordered list of categories with their Indonesian display labels. */
export const CATEGORY_LABELS: Record<PriceBenchmark['category'], string> = {
  carb:      'Karbohidrat',
  protein:   'Protein',
  vegetable: 'Sayuran',
  oil:       'Minyak & Lemak',
  spice:     'Bumbu & Rempah',
  other:     'Lainnya',
};

export const CATEGORY_ORDER: PriceBenchmark['category'][] = [
  'protein',
  'carb',
  'vegetable',
  'oil',
  'spice',
  'other',
];

/**
 * Returns the status of an actual price vs. a benchmark.
 * @param benchmark  The reference definition.
 * @param actualIdr  The actual invoice price per unit.
 */
export function benchmarkStatus(
  benchmark: PriceBenchmark,
  actualIdr: number,
): 'pass' | 'warn' | 'fail' {
  const pct = ((actualIdr - benchmark.referenceIdr) / benchmark.referenceIdr) * 100;
  if (pct >= benchmark.failThresholdPct) return 'fail';
  if (pct >= benchmark.warnThresholdPct) return 'warn';
  return 'pass';
}
