import { ProcurementScenarioSchema, type ProcurementScenario } from "@/schemas/finance";

/**
 * Synthetic procurement days for the demo (plausible Indonesian SPPG-kitchen figures).
 * Replace with Andrea's real numbers later. Parsed through the Zod SSOT so typos fail loudly.
 */

const RAW: ProcurementScenario[] = [
  {
    id: "2026-06-15-flagged",
    label: "15 Jun 2026 — irregularities present",
    labelId: "15 Jun 2026 — ada kejanggalan",
    dateIso: "2026-06-15",
    kitchen: "Dapur SPPG Gamping · Yogyakarta",
    meals: { enrolled: 540, present: 498, mealsServed: 498, mealsBilled: 650 },
    costPerPortionIdr: 15000,
    approvalThresholdIdr: 50000000,
    lineItems: [
      { item: "Beras (rice)", supplier: "CV Berkah Pangan", qty: 80, unit: "kg", unitPriceIdr: 15800, referencePriceIdr: 13500 },
      { item: "Ayam (chicken)", supplier: "CV Berkah Pangan", qty: 60, unit: "kg", unitPriceIdr: 42000, referencePriceIdr: 38000 },
      { item: "Telur (eggs)", supplier: "UD Sumber Rejeki", qty: 45, unit: "kg", unitPriceIdr: 31000, referencePriceIdr: 28500 },
      { item: "Minyak goreng (oil)", supplier: "CV Berkah Pangan", qty: 25, unit: "L", unitPriceIdr: 21500, referencePriceIdr: 17000 },
      { item: "Sayur (vegetables)", supplier: "Pasar Lokal Induk", qty: 50, unit: "kg", unitPriceIdr: 12000, referencePriceIdr: 11500 },
    ],
    invoices: [
      { id: "INV-2026-0461", supplier: "CV Berkah Pangan", dateIso: "2026-06-15", amountIdr: 9480000 },
      { id: "INV-2026-0462", supplier: "CV Berkah Pangan", dateIso: "2026-06-15", amountIdr: 9480000 },
      { id: "INV-2026-0463", supplier: "UD Sumber Rejeki", dateIso: "2026-06-15", amountIdr: 1395000 },
      { id: "INV-2026-0464", supplier: "CV Berkah Pangan", dateIso: "2026-06-15", amountIdr: 48600000 },
    ],
    awards: [
      { supplier: "CV Berkah Pangan", awards: 8 },
      { supplier: "UD Sumber Rejeki", awards: 1 },
    ],
  },
  {
    id: "2026-06-12-clean",
    label: "12 Jun 2026 — clean day (control)",
    labelId: "12 Jun 2026 — hari bersih (kontrol)",
    dateIso: "2026-06-12",
    kitchen: "Dapur SPPG Gamping · Yogyakarta",
    meals: { enrolled: 540, present: 505, mealsServed: 505, mealsBilled: 505 },
    costPerPortionIdr: 15000,
    approvalThresholdIdr: 50000000,
    lineItems: [
      { item: "Beras (rice)", supplier: "UD Sumber Rejeki", qty: 80, unit: "kg", unitPriceIdr: 13600, referencePriceIdr: 13500 },
      { item: "Ayam (chicken)", supplier: "CV Berkah Pangan", qty: 60, unit: "kg", unitPriceIdr: 38200, referencePriceIdr: 38000 },
      { item: "Telur (eggs)", supplier: "UD Sumber Rejeki", qty: 45, unit: "kg", unitPriceIdr: 28600, referencePriceIdr: 28500 },
      { item: "Sayur (vegetables)", supplier: "Pasar Lokal Induk", qty: 50, unit: "kg", unitPriceIdr: 11600, referencePriceIdr: 11500 },
    ],
    invoices: [
      { id: "INV-2026-0448", supplier: "CV Berkah Pangan", dateIso: "2026-06-12", amountIdr: 2292000 },
      { id: "INV-2026-0449", supplier: "UD Sumber Rejeki", dateIso: "2026-06-12", amountIdr: 2375000 },
      { id: "INV-2026-0450", supplier: "Pasar Lokal Induk", dateIso: "2026-06-12", amountIdr: 580000 },
    ],
    awards: [
      { supplier: "CV Berkah Pangan", awards: 3 },
      { supplier: "UD Sumber Rejeki", awards: 3 },
      { supplier: "Pasar Lokal Induk", awards: 3 },
    ],
  },
];

export const SCENARIOS: ProcurementScenario[] = RAW.map((s) => ProcurementScenarioSchema.parse(s));

export function getScenario(id: string): ProcurementScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
