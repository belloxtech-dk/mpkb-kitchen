"use client";

import { formatIdr, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import type { ProcurementScenario } from "@/schemas/finance";

/** The raw "books" for a day — always visible, before/after the audit. Presentational only. */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">{title}</div>
      {children}
    </div>
  );
}

export function MealCounts({ scenario }: { scenario: ProcurementScenario }) {
  const m = useMessages();
  const { enrolled, present, mealsServed, mealsBilled } = scenario.meals;
  const gap = mealsBilled - mealsServed;
  const rows = [
    { label: m.meal.enrolled, value: enrolled, tone: "text-fg" },
    { label: m.meal.present, value: present, tone: "text-fg" },
    { label: m.meal.served, value: mealsServed, tone: "text-fg" },
    { label: m.meal.billed, value: mealsBilled, tone: gap > 0 ? "text-fail" : "text-fg" },
  ];
  return (
    <Card title={m.books.mealCounts}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border bg-panel p-2.5">
            <div className={cn("font-mono text-xl font-semibold tabular-nums", r.tone)}>{formatNumber(r.value)}</div>
            <div className="text-[10px] tracking-wide text-muted uppercase">{r.label}</div>
          </div>
        ))}
      </div>
      {gap > 0 && (
        <p className="mt-2 text-xs text-fail">{m.books.gapNote(formatNumber(gap), formatPercent(gap / mealsBilled))}</p>
      )}
    </Card>
  );
}

export function LineItemsTable({ scenario }: { scenario: ProcurementScenario }) {
  const m = useMessages();
  return (
    <Card title={m.books.lineItems}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[10px] tracking-wide text-muted uppercase">
              <th className="pb-2 font-medium">{m.books.colItem}</th>
              <th className="pb-2 font-medium">{m.books.colSupplier}</th>
              <th className="pb-2 text-right font-medium">{m.books.colQty}</th>
              <th className="pb-2 text-right font-medium">{m.books.colUnitPrice}</th>
              <th className="pb-2 text-right font-medium">{m.books.colReference}</th>
            </tr>
          </thead>
          <tbody>
            {scenario.lineItems.map((li) => {
              const over = li.unitPriceIdr > li.referencePriceIdr;
              return (
                <tr key={li.item} className="border-t">
                  <td className="py-2">{li.item}</td>
                  <td className="py-2 text-muted">{li.supplier}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatNumber(li.qty)} {li.unit}
                  </td>
                  <td className={cn("py-2 text-right tabular-nums", over ? "font-medium text-fail" : "text-fg")}>
                    {formatIdr(li.unitPriceIdr)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">{formatIdr(li.referencePriceIdr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function InvoiceList({ scenario }: { scenario: ProcurementScenario }) {
  const m = useMessages();
  return (
    <Card title={m.books.invoices}>
      <ul className="space-y-1.5">
        {scenario.invoices.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-2 rounded-lg border bg-panel px-3 py-2 text-[13px]">
            <span className="font-mono text-xs text-muted">{inv.id}</span>
            <span className="flex-1 truncate px-2">{inv.supplier}</span>
            <span className="tabular-nums">{formatIdr(inv.amountIdr)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted">
        {m.books.approvalThreshold}: {formatIdr(scenario.approvalThresholdIdr)}
      </p>
    </Card>
  );
}

export function SupplierAwards({ scenario }: { scenario: ProcurementScenario }) {
  const m = useMessages();
  const total = scenario.awards.reduce((sum, a) => sum + a.awards, 0) || 1;
  return (
    <Card title={m.books.awards}>
      <div className="space-y-2">
        {scenario.awards.map((a) => {
          const share = a.awards / total;
          return (
            <div key={a.supplier}>
              <div className="mb-0.5 flex items-center justify-between text-[13px]">
                <span>{a.supplier}</span>
                <span className="tabular-nums text-muted">
                  {formatNumber(a.awards)} · {formatPercent(share)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", share >= 0.7 ? "bg-fail" : "bg-accent")}
                  style={{ width: `${Math.round(share * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
