"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Cpu } from "lucide-react";
import { MODELS, type ModelId } from "@/lib/models";
import { useMessages } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

export function ModelSwitcher({ current }: { current: string }) {
  const m = useMessages();
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [busy, setBusy] = useState(false);

  const choose = async (id: ModelId) => {
    if (id === selected || busy) return;
    setBusy(true);
    const res = await fetch("/api/superadmin/model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: id }),
    });
    if (res.ok) {
      setSelected(id);
      router.refresh(); // re-render the header badge with the new model
    }
    setBusy(false);
  };

  return (
    <div className="max-w-md rounded-xl border bg-surface p-4">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <Cpu className="size-4 text-muted" />
        {m.superadmin.modelHeading}
      </div>
      <p className="mb-3 text-xs text-muted">{m.superadmin.modelSubtitle}</p>

      <div className="space-y-2">
        {MODELS.map((model) => {
          const active = selected === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => choose(model.id)}
              disabled={busy}
              aria-pressed={active}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition disabled:opacity-50",
                active ? "border-accent bg-accent-soft" : "hover:bg-panel",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{model.label}</span>
                <span className="block text-xs text-muted">{m.superadmin.modelNotes[model.id]}</span>
              </span>
              {active && <Check className="size-4 shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
