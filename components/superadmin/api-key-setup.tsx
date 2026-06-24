"use client";

import { useState } from "react";
import { Key, CheckCircle2, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function ApiKeySetup({ hasKey }: { hasKey: boolean }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");

  const save = async () => {
    if (!key.startsWith("sk-ant-")) {
      setMsg("Key harus diawali dengan sk-ant-...");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setMsg("");
    try {
      const res = await fetch("/api/admin/set-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        setStatus("saved");
        setMsg("API key disimpan. Restart server untuk mengaktifkan AI.");
        setKey("");
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setStatus("error");
        setMsg(d.error ?? "Gagal menyimpan key.");
      }
    } catch {
      setStatus("error");
      setMsg("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4 max-w-xl">
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex size-9 items-center justify-center rounded-lg ring-1",
          hasKey ? "bg-pass/10 ring-pass/30" : "bg-warn/10 ring-warn/30"
        )}>
          {hasKey ? <CheckCircle2 className="size-5 text-pass" /> : <Key className="size-5 text-warn" />}
        </div>
        <div>
          <div className="text-sm font-semibold text-fg">Anthropic API Key</div>
          <div className={cn("text-xs", hasKey ? "text-pass" : "text-warn")}>
            {hasKey ? "✓ Terkonfigurasi — AI aktif" : "⚠ Belum dikonfigurasi — AI tidak aktif"}
          </div>
        </div>
      </div>

      {!hasKey && (
        <>
          <p className="text-xs text-muted leading-relaxed">
            Diperlukan untuk modul Inspeksi CCTV dan Audit Keuangan. Dapatkan key di{" "}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener"
              className="text-accent hover:underline inline-flex items-center gap-0.5">
              console.anthropic.com <ExternalLink className="size-3" />
            </a>
          </p>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold tracking-widest text-muted uppercase">
              API Key
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 pr-10 font-mono text-sm text-fg outline-none placeholder:text-muted/40 focus:border-accent transition"
              />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={save}
            disabled={status === "saving" || !key}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-md shadow-accent/20 transition hover:opacity-90 disabled:opacity-40"
          >
            {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
            {status === "saving" ? "Menyimpan…" : "Simpan API Key"}
          </button>
        </>
      )}

      {msg && (
        <p className={cn("text-xs rounded-lg px-3 py-2 border", 
          status === "error" ? "text-fail border-fail/30 bg-fail/10" : "text-pass border-pass/30 bg-pass/10"
        )}>
          {msg}
        </p>
      )}

      <div className="border-t border-border pt-3 text-[11px] text-muted space-y-0.5">
        <div>Model aktif: <span className="text-fg font-mono">claude-sonnet-4-6</span></div>
        <div>Budget: <span className="text-fg">$200 / bulan</span> — cukup untuk ~200 inspeksi/hari</div>
      </div>
    </div>
  );
}
