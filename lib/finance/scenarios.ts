import { ProcurementScenarioSchema, type ProcurementScenario } from "@/schemas/finance";

/**
 * Synthetic procurement days for the demo (plausible Indonesian SPPG-kitchen figures).
 * Replace with Andrea's real numbers later. Parsed through the Zod SSOT so typos fail loudly.
 */

const RAW: ProcurementScenario[] = [
  {
    id: "2026-06-20-ghost",
    label: "20 Jun 2026 — ghost meals detected",
    labelId: "20 Jun 2026 — makanan fiktif terdeteksi",
    dateIso: "2026-06-20",
    kitchen: "Dapur SPPG Gamping · Yogyakarta",
    meals: { enrolled: 480, present: 412, mealsServed: 412, mealsBilled: 590 },
    costPerPortionIdr: 15000,
    approvalThresholdIdr: 50000000,
    lineItems: [
      { item: "Beras (rice)", supplier: "CV Makmur Jaya", qty: 75, unit: "kg", unitPriceIdr: 13600, referencePriceIdr: 13500 },
      { item: "Ayam (chicken)", supplier: "CV Makmur Jaya", qty: 55, unit: "kg", unitPriceIdr: 38500, referencePriceIdr: 38000 },
      { item: "Telur (eggs)", supplier: "UD Gamping Sejahtera", qty: 40, unit: "kg", unitPriceIdr: 28800, referencePriceIdr: 28500 },
      { item: "Sayur (vegetables)", supplier: "Pasar Gamping", qty: 45, unit: "kg", unitPriceIdr: 11800, referencePriceIdr: 11500 },
    ],
    invoices: [
      { id: "INV-2026-0471", supplier: "CV Makmur Jaya", dateIso: "2026-06-20", amountIdr: 4180000 },
      { id: "INV-2026-0472", supplier: "CV Makmur Jaya", dateIso: "2026-06-20", amountIdr: 2117500 },
      { id: "INV-2026-0473", supplier: "UD Gamping Sejahtera", dateIso: "2026-06-20", amountIdr: 1152000 },
      { id: "INV-2026-0474", supplier: "Pasar Gamping", dateIso: "2026-06-20", amountIdr: 531000 },
    ],
    awards: [
      { supplier: "CV Makmur Jaya", awards: 9 },
      { supplier: "UD Gamping Sejahtera", awards: 2 },
      { supplier: "Pasar Gamping", awards: 1 },
    ],
  },
  {
    id: "2026-06-18-duplicate",
    label: "18 Jun 2026 — duplicate invoice",
    labelId: "18 Jun 2026 — faktur ganda",
    dateIso: "2026-06-18",
    kitchen: "Dapur SPPG Gamping · Yogyakarta",
    meals: { enrolled: 480, present: 465, mealsServed: 465, mealsBilled: 465 },
    costPerPortionIdr: 15000,
    approvalThresholdIdr: 50000000,
    lineItems: [
      { item: "Beras (rice)", supplier: "CV Makmur Jaya", qty: 72, unit: "kg", unitPriceIdr: 13550, referencePriceIdr: 13500 },
      { item: "Ayam (chicken)", supplier: "UD Gamping Sejahtera", qty: 52, unit: "kg", unitPriceIdr: 38200, referencePriceIdr: 38000 },
      { item: "Telur (eggs)", supplier: "UD Gamping Sejahtera", qty: 38, unit: "kg", unitPriceIdr: 28600, referencePriceIdr: 28500 },
      { item: "Minyak goreng (oil)", supplier: "CV Makmur Jaya", qty: 20, unit: "L", unitPriceIdr: 17200, referencePriceIdr: 17000 },
      { item: "Sayur (vegetables)", supplier: "Pasar Gamping", qty: 42, unit: "kg", unitPriceIdr: 11600, referencePriceIdr: 11500 },
    ],
    invoices: [
      { id: "INV-2026-0455", supplier: "CV Makmur Jaya", dateIso: "2026-06-18", amountIdr: 3319000 },
      { id: "INV-2026-0456", supplier: "UD Gamping Sejahtera", dateIso: "2026-06-18", amountIdr: 3073600 },
      { id: "INV-2026-0457", supplier: "UD Gamping Sejahtera", dateIso: "2026-06-18", amountIdr: 3073600 },
      { id: "INV-2026-0458", supplier: "Pasar Gamping", dateIso: "2026-06-18", amountIdr: 487200 },
    ],
    awards: [
      { supplier: "CV Makmur Jaya", awards: 5 },
      { supplier: "UD Gamping Sejahtera", awards: 4 },
      { supplier: "Pasar Gamping", awards: 3 },
    ],
  },
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
