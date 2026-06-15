import { formatIdr, formatNumber, formatPercent } from "@/lib/format";
import type { FindingKind, ProcurementScenario } from "@/schemas/finance";
import {
  DUPLICATE_AMOUNT_TOLERANCE,
  MARKUP_MIN_FRACTION,
  SUPPLIER_CONCENTRATION_LIMIT,
  THRESHOLD_GAMING_BAND,
} from "./reference";

/**
 * Deterministic reconciliation. ALL arithmetic is here (exact, auditable) — the
 * LLM never computes numbers, it only explains and judges these computed facts.
 */

export interface EvidenceRow {
  label: string;
  value: string;
}

export interface ComputedFinding {
  kind: FindingKind;
  title: string;
  /** Direct financial leakage in IDR (0 for risk-only flags). */
  leakageIdr: number;
  evidence: EvidenceRow[];
}

export interface ReconciliationResult {
  scenarioId: string;
  findings: ComputedFinding[];
  totalLeakageIdr: number;
}

function ghostMeals(s: ProcurementScenario): ComputedFinding | null {
  const { mealsBilled, mealsServed, enrolled, present } = s.meals;
  const ghost = mealsBilled - mealsServed;
  if (ghost <= 0) return null;
  const leakageIdr = ghost * s.costPerPortionIdr;
  return {
    kind: "ghost_meals",
    title: "Ghost meals — billed beyond served",
    leakageIdr,
    evidence: [
      { label: "Enrolled", value: formatNumber(enrolled) },
      { label: "Present (attendance)", value: formatNumber(present) },
      { label: "Meals served (log)", value: formatNumber(mealsServed) },
      { label: "Meals billed (invoice)", value: formatNumber(mealsBilled) },
      { label: "Unaccounted portions", value: `${formatNumber(ghost)} (${formatPercent(ghost / mealsBilled)})` },
      { label: "Cost / portion", value: formatIdr(s.costPerPortionIdr) },
      { label: "Estimated leakage", value: formatIdr(leakageIdr) },
    ],
  };
}

function priceMarkup(s: ProcurementScenario): ComputedFinding | null {
  const overpriced = s.lineItems
    .map((li) => {
      const overPerUnit = li.unitPriceIdr - li.referencePriceIdr;
      const fraction = li.referencePriceIdr > 0 ? overPerUnit / li.referencePriceIdr : 0;
      return { li, overPerUnit, fraction, overTotal: overPerUnit * li.qty };
    })
    .filter((x) => x.fraction >= MARKUP_MIN_FRACTION && x.overTotal > 0);

  if (overpriced.length === 0) return null;
  const leakageIdr = overpriced.reduce((sum, x) => sum + x.overTotal, 0);

  return {
    kind: "price_markup",
    title: "Procurement markup over reference price",
    leakageIdr,
    evidence: overpriced.map((x) => ({
      label: `${x.li.item} (${formatNumber(x.li.qty)} ${x.li.unit}, ${x.li.supplier})`,
      value: `${formatIdr(x.li.unitPriceIdr)} vs ref ${formatIdr(x.li.referencePriceIdr)} — +${formatPercent(x.fraction)} = ${formatIdr(x.overTotal)}`,
    })),
  };
}

function duplicateInvoice(s: ProcurementScenario): ComputedFinding | null {
  for (let i = 0; i < s.invoices.length; i++) {
    for (let j = i + 1; j < s.invoices.length; j++) {
      const a = s.invoices[i]!;
      const b = s.invoices[j]!;
      if (a.supplier !== b.supplier) continue;
      const diff = Math.abs(a.amountIdr - b.amountIdr);
      const rel = a.amountIdr > 0 ? diff / a.amountIdr : 1;
      if (rel <= DUPLICATE_AMOUNT_TOLERANCE) {
        return {
          kind: "duplicate_invoice",
          title: "Duplicate invoice — potential double payment",
          leakageIdr: Math.min(a.amountIdr, b.amountIdr),
          evidence: [
            { label: a.id, value: `${a.supplier} · ${formatIdr(a.amountIdr)} · ${a.dateIso}` },
            { label: b.id, value: `${b.supplier} · ${formatIdr(b.amountIdr)} · ${b.dateIso}` },
            { label: "Amount difference", value: `${formatIdr(diff)} (${formatPercent(rel, 2)})` },
          ],
        };
      }
    }
  }
  return null;
}

function thresholdGaming(s: ProcurementScenario): ComputedFinding | null {
  const limit = s.approvalThresholdIdr;
  const floor = limit * (1 - THRESHOLD_GAMING_BAND);
  const suspects = s.invoices.filter((inv) => inv.amountIdr >= floor && inv.amountIdr < limit);
  if (suspects.length === 0) return null;

  return {
    kind: "threshold_gaming",
    title: "Invoice priced just under the approval threshold",
    leakageIdr: 0,
    evidence: [
      { label: "Approval threshold", value: formatIdr(limit) },
      ...suspects.map((inv) => ({
        label: `${inv.id} (${inv.supplier})`,
        value: `${formatIdr(inv.amountIdr)} — ${formatPercent((limit - inv.amountIdr) / limit, 2)} under limit`,
      })),
    ],
  };
}

function supplierConcentration(s: ProcurementScenario): ComputedFinding | null {
  const total = s.awards.reduce((sum, a) => sum + a.awards, 0);
  if (total === 0) return null;
  const top = [...s.awards].sort((a, b) => b.awards - a.awards)[0]!;
  const share = top.awards / total;
  if (share < SUPPLIER_CONCENTRATION_LIMIT) return null;

  return {
    kind: "supplier_concentration",
    title: "Supplier concentration — limited competition",
    leakageIdr: 0,
    evidence: [
      { label: top.supplier, value: `${formatNumber(top.awards)} of ${formatNumber(total)} awards (${formatPercent(share)})` },
      ...s.awards
        .filter((a) => a.supplier !== top.supplier)
        .map((a) => ({ label: a.supplier, value: `${formatNumber(a.awards)} awards` })),
    ],
  };
}

const DETECTORS = [ghostMeals, priceMarkup, duplicateInvoice, thresholdGaming, supplierConcentration];

export function reconcile(scenario: ProcurementScenario): ReconciliationResult {
  const findings = DETECTORS.map((d) => d(scenario)).filter((f): f is ComputedFinding => f !== null);
  const totalLeakageIdr = findings.reduce((sum, f) => sum + f.leakageIdr, 0);
  return { scenarioId: scenario.id, findings, totalLeakageIdr };
}
