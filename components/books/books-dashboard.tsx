"use client";

import { useState } from "react";
import { SCENARIOS } from "@/lib/finance/scenarios";
import { useAudit } from "@/lib/use-audit";
import { InvoiceList, LineItemsTable, MealCounts, SupplierAwards } from "./scenario-docs";
import { AuditPanel } from "./audit-panel";

export function BooksDashboard() {
  const audit = useAudit();
  const auditing = audit.status === "auditing";

  // SCENARIOS is a non-empty validated fixture list.
  const [selectedId, setSelectedId] = useState(SCENARIOS[0]!.id);
  const scenario = SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0]!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3">
        <label className="flex items-center gap-2">
          <span className="text-xs text-muted">Procurement day</span>
          <select
            value={selectedId}
            onChange={(e) => {
              audit.reset();
              setSelectedId(e.target.value);
            }}
            disabled={auditing}
            className="rounded-lg border bg-panel px-2 py-1.5 text-sm disabled:opacity-50"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => audit.run(scenario.id)}
          disabled={auditing}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-40"
        >
          {auditing ? "Auditing…" : "Audit the books"}
        </button>
      </div>

      <div className="text-sm text-muted">
        {scenario.kitchen} · {scenario.dateIso}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <MealCounts scenario={scenario} />
          <LineItemsTable scenario={scenario} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InvoiceList scenario={scenario} />
            <SupplierAwards scenario={scenario} />
          </div>
        </div>
        <AuditPanel audit={audit} />
      </div>
    </div>
  );
}
