import { formatIdr, formatNumber, formatPercent } from "@/lib/format";
import { messagesFor, type Messages } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
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
 * Titles + static evidence labels are localized via the i18n dictionary; dynamic
 * data (item names, suppliers, invoice ids) is left as-is.
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

function ghostMeals(s: ProcurementScenario, m: Messages): ComputedFinding | null {
  const { mealsBilled, mealsServed, enrolled, present } = s.meals;
  const ghost = mealsBilled - mealsServed;
  if (ghost <= 0) return null;
  const leakageIdr = ghost * s.costPerPortionIdr;
  return {
    kind: "ghost_meals",
    title: m.finance.titles.ghost_meals,
    leakageIdr,
    evidence: [
      { label: m.meal.enrolled, value: formatNumber(enrolled) },
      { label: m.meal.present, value: formatNumber(present) },
      { label: m.meal.served, value: formatNumber(mealsServed) },
      { label: m.meal.billed, value: formatNumber(mealsBilled) },
      { label: m.finance.ev.unaccounted, value: `${formatNumber(ghost)} (${formatPercent(ghost / mealsBilled)})` },
      { label: m.finance.ev.costPerPortion, value: formatIdr(s.costPerPortionIdr) },
      { label: m.finance.ev.estLeakage, value: formatIdr(leakageIdr) },
    ],
  };
}

function priceMarkup(s: ProcurementScenario, m: Messages): ComputedFinding | null {
  const overpriced = s.lineItems
    .map((li) => {
      const overPerUnit = li.unitPriceIdr - li.referencePriceIdr;
      const fraction = li.referencePriceIdr > 0 ? overPerUnit / li.referencePriceIdr : 0;
      return { li, fraction, overTotal: overPerUnit * li.qty };
    })
    .filter((x) => x.fraction >= MARKUP_MIN_FRACTION && x.overTotal > 0);

  if (overpriced.length === 0) return null;
  const leakageIdr = overpriced.reduce((sum, x) => sum + x.overTotal, 0);

  return {
    kind: "price_markup",
    title: m.finance.titles.price_markup,
    leakageIdr,
    evidence: overpriced.map((x) => ({
      label: `${x.li.item} (${formatNumber(x.li.qty)} ${x.li.unit}, ${x.li.supplier})`,
      value: m.finance.ev.vsRef(
        formatIdr(x.li.unitPriceIdr),
        formatIdr(x.li.referencePriceIdr),
        formatPercent(x.fraction),
        formatIdr(x.overTotal),
      ),
    })),
  };
}

function duplicateInvoice(s: ProcurementScenario, m: Messages): ComputedFinding | null {
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
          title: m.finance.titles.duplicate_invoice,
          leakageIdr: Math.min(a.amountIdr, b.amountIdr),
          evidence: [
            { label: a.id, value: `${a.supplier} · ${formatIdr(a.amountIdr)} · ${a.dateIso}` },
            { label: b.id, value: `${b.supplier} · ${formatIdr(b.amountIdr)} · ${b.dateIso}` },
            { label: m.finance.ev.amountDiff, value: `${formatIdr(diff)} (${formatPercent(rel, 2)})` },
          ],
        };
      }
    }
  }
  return null;
}

function thresholdGaming(s: ProcurementScenario, m: Messages): ComputedFinding | null {
  const limit = s.approvalThresholdIdr;
  const floor = limit * (1 - THRESHOLD_GAMING_BAND);
  const suspects = s.invoices.filter((inv) => inv.amountIdr >= floor && inv.amountIdr < limit);
  if (suspects.length === 0) return null;

  return {
    kind: "threshold_gaming",
    title: m.finance.titles.threshold_gaming,
    leakageIdr: 0,
    evidence: [
      { label: m.finance.ev.approvalThreshold, value: formatIdr(limit) },
      ...suspects.map((inv) => ({
        label: `${inv.id} (${inv.supplier})`,
        value: `${formatIdr(inv.amountIdr)} — ${m.finance.ev.underLimit(formatPercent((limit - inv.amountIdr) / limit, 2))}`,
      })),
    ],
  };
}

function supplierConcentration(s: ProcurementScenario, m: Messages): ComputedFinding | null {
  const total = s.awards.reduce((sum, a) => sum + a.awards, 0);
  if (total === 0) return null;
  const top = [...s.awards].sort((a, b) => b.awards - a.awards)[0]!;
  const share = top.awards / total;
  if (share < SUPPLIER_CONCENTRATION_LIMIT) return null;

  return {
    kind: "supplier_concentration",
    title: m.finance.titles.supplier_concentration,
    leakageIdr: 0,
    evidence: [
      {
        label: top.supplier,
        value: m.finance.ev.ofAwards(formatNumber(top.awards), formatNumber(total), formatPercent(share)),
      },
      ...s.awards
        .filter((a) => a.supplier !== top.supplier)
        .map((a) => ({ label: a.supplier, value: m.finance.ev.awardsCount(formatNumber(a.awards)) })),
    ],
  };
}

const DETECTORS = [ghostMeals, priceMarkup, duplicateInvoice, thresholdGaming, supplierConcentration];

export function reconcile(scenario: ProcurementScenario, locale: Locale): ReconciliationResult {
  const m = messagesFor(locale);
  const findings = DETECTORS.map((d) => d(scenario, m)).filter((f): f is ComputedFinding => f !== null);
  const totalLeakageIdr = findings.reduce((sum, f) => sum + f.leakageIdr, 0);
  return { scenarioId: scenario.id, findings, totalLeakageIdr };
}
