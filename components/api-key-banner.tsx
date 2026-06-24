"use client";

import { useState } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

export function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3">
      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-warn" />
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-semibold text-warn">API key Anthropic belum dikonfigurasi.</span>
        <span className="text-muted ml-1.5">
          Modul AI (CCTV + Audit) tidak aktif. Tambahkan{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 text-xs font-mono text-fg">ANTHROPIC_API_KEY</code>
          {" "}di{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 text-xs font-mono text-fg">.env.local</code>
          {" "}lalu restart server.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-muted hover:text-fg transition"
        aria-label="Tutup"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
