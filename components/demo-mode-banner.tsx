"use client";

import { useState } from "react";
import { Zap, X } from "lucide-react";

/**
 * DemoModeBanner — shown when ANTHROPIC_API_KEY is not configured.
 * Dismissible, amber-toned, client component.
 */
export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3"
    >
      {/* Icon */}
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-warn/20 text-warn">
        <Zap className="size-3.5" />
      </span>

      {/* Copy */}
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-semibold text-warn">Mode Demo Aktif</span>
        <span className="ml-1.5 text-muted">
          AI belum terhubung. Fitur{" "}
          <span className="font-medium text-fg">Inspeksi CCTV</span> dan{" "}
          <span className="font-medium text-fg">Audit Keuangan</span> memerlukan Anthropic API Key.
        </span>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Tutup banner mode demo"
        className="shrink-0 rounded p-0.5 text-muted transition hover:text-fg hover:bg-warn/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
