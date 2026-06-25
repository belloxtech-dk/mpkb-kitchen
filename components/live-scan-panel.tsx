"use client";

import { useState } from "react";
import { Loader2, Play, CheckCircle2, AlertTriangle, XCircle, WifiOff, Send, Utensils, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

interface ScanResult {
  zone: string;
  score: number;
  status: string;
  summary: string;
  violations: string[];
  snapshotCaptured: boolean;
}

interface ScanResponse {
  ok: boolean;
  scanned: number;
  avgScore: number;
  pass: number;
  warn: number;
  fail: number;
  waDelivered: boolean;
  results: ScanResult[];
  error?: string;
}

interface FoodZone { zone: string; portionCount: number; qualityScore: number; overallQuality: string; nutritionBalance: string; findings: string[]; summary: string; hasCarbs?: boolean; hasProtein?: boolean; hasVegetables?: boolean; }
interface FoodKitchen { kitchenId: string; label: string; results: FoodZone[]; }
interface FoodResponse { ok: boolean; allResults: FoodKitchen[]; waDelivered: boolean; error?: string; }

const KITCHENS = [
  { id: "all",                 label: "🏠 Semua Dapur" },
  { id: "gamping-yogyakarta",  label: "📍 Yogyakarta" },
  { id: "bagelen-purwokerto",  label: "📍 Purwokerto" },
];

export function LiveScanPanel() {
  const [sopRunning, setSopRunning]   = useState(false);
  const [foodRunning, setFoodRunning] = useState(false);
  const [sopData,  setSopData]  = useState<ScanResponse | null>(null);
  const [foodData, setFoodData] = useState<FoodResponse | null>(null);
  const [kitchen,  setKitchen]  = useState("all");
  const [error,    setError]    = useState<string | null>(null);

  async function runSopScan() {
    setSopRunning(true); setError(null);
    try {
      const qs = kitchen !== "all" ? `?kitchen=${kitchen}` : "";
      const res = await fetch(`/api/cctv/auto-scan${qs}`, { method: "POST" });
      const json: ScanResponse = await res.json();
      setSopData(json);
      if (!json.ok) setError(json.error ?? "Scan gagal");
    } catch (e) { setError(String(e)); }
    finally { setSopRunning(false); }
  }

  async function runFoodScan() {
    setFoodRunning(true); setError(null);
    try {
      const qs = kitchen !== "all" ? `?kitchen=${kitchen}` : "";
      const res = await fetch(`/api/cctv/food-quality${qs}`, { method: "POST" });
      const json: FoodResponse = await res.json();
      setFoodData(json);
      if (!json.ok) setError(json.error ?? "Food scan gagal");
    } catch (e) { setError(String(e)); }
    finally { setFoodRunning(false); }
  }

  const StatusIcon = ({ s }: { s: string }) =>
    s === "pass" ? <CheckCircle2 className="size-4 text-pass" /> :
    s === "warn" ? <AlertTriangle className="size-4 text-warn" /> :
    s === "fail" ? <XCircle className="size-4 text-fail" /> :
    <WifiOff className="size-4 text-muted" />;

  const QualityEmoji = (q: string) =>
    q === "excellent" ? "🌟" : q === "good" ? "✅" : q === "fair" ? "⚠️" : "🚨";

  return (
    <div className="space-y-4">
      {/* Kitchen selector */}
      <div className="flex flex-wrap gap-2">
        {KITCHENS.map(k => (
          <button key={k.id} onClick={() => setKitchen(k.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              kitchen === k.id
                ? "border-accent bg-accent text-accent-fg"
                : "border-border text-muted hover:text-fg hover:border-fg/30"
            )}>
            {k.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={runSopScan} disabled={sopRunning || foodRunning}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
            sopRunning ? "bg-accent/40 text-accent-fg/60 cursor-not-allowed"
              : "bg-accent text-accent-fg hover:opacity-90 shadow-sm"
          )}>
          {sopRunning ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {sopRunning ? "Menganalisis SOP..." : "🛡️ Scan SOP"}
        </button>

        <button onClick={runFoodScan} disabled={sopRunning || foodRunning}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
            foodRunning ? "border-accent/40 text-muted cursor-not-allowed"
              : "border-accent text-accent hover:bg-accent/10"
          )}>
          {foodRunning ? <Loader2 className="size-4 animate-spin" /> : <Utensils className="size-4" />}
          {foodRunning ? "Menganalisis Makanan..." : "🍱 Analisis Makanan"}
        </button>
      </div>

      <p className="text-xs text-muted">
        🧠 SOP Audit → Claude Sonnet &nbsp;·&nbsp; 🍱 Kualitas Makanan → Gemini Flash &nbsp;·&nbsp; 📊 Hitung Porsi → Ollama (lokal, gratis)
      </p>

      {error && (
        <div className="rounded-lg border border-fail/20 bg-fail/5 p-3 text-sm text-fail">{error}</div>
      )}

      {/* SOP Results */}
      {sopData?.ok && (
        <div className="rounded-xl border border-border bg-surface-alt p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">🛡️ Hasil SOP Scan</h3>
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              sopData.waDelivered ? "bg-pass/10 text-pass" : "bg-warn/10 text-warn"
            )}>
              <Send className="size-3" />
              {sopData.waDelivered ? "WA Terkirim" : "WA Gagal"}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: "Skor", v: `${sopData.avgScore}/100`, c: sopData.avgScore >= 80 ? "text-pass" : sopData.avgScore >= 60 ? "text-warn" : "text-fail" },
              { l: "Lulus", v: sopData.pass, c: "text-pass" },
              { l: "Peringatan", v: sopData.warn, c: "text-warn" },
              { l: "Gagal", v: sopData.fail, c: "text-fail" },
            ].map(({ l, v, c }) => (
              <div key={l} className="rounded-lg border border-border bg-panel p-2 text-center">
                <div className={cn("text-lg font-bold", c)}>{v}</div>
                <div className="text-[10px] text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {sopData.results.map(r => (
              <div key={r.zone} className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-panel px-3 py-2">
                <StatusIcon s={r.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{r.zone}</span>
                    <span className={cn("text-xs font-bold", r.score >= 80 ? "text-pass" : r.score >= 60 ? "text-warn" : "text-fail")}>
                      {Math.round(r.score)}/100
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">{r.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food Quality Results */}
      {foodData?.ok && (
        <div className="rounded-xl border border-border bg-surface-alt p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">🍱 Hasil Analisis Makanan</h3>
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              foodData.waDelivered ? "bg-pass/10 text-pass" : "bg-warn/10 text-warn"
            )}>
              <Send className="size-3" />
              {foodData.waDelivered ? "WA Terkirim" : "WA Gagal"}
            </div>
          </div>
          {foodData.allResults.map(kitchen => (
            <div key={kitchen.kitchenId} className="space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">{kitchen.label}</p>
              {kitchen.results.map(r => (
                <div key={r.zone} className="rounded-lg border border-border/50 bg-panel px-3 py-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{QualityEmoji(r.overallQuality)} {r.zone}</span>
                    <span className="text-xs text-muted">{r.portionCount} porsi · {r.qualityScore}/100</span>
                  </div>
                  <div className="flex gap-2 mt-1 text-[11px]">
                    <span className={r.hasCarbs ? "text-pass" : "text-muted"}>🍚 Karbo</span>
                    <span className={r.hasProtein ? "text-pass" : "text-muted"}>🥩 Protein</span>
                    <span className={r.hasVegetables ? "text-pass" : "text-muted"}>🥦 Sayur</span>
                  </div>
                  {r.findings[0] && <p className="text-[11px] text-warn mt-0.5">{r.findings[0]}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!sopData && !foodData && !sopRunning && !foodRunning && (
        <div className="rounded-xl border border-border/50 border-dashed bg-surface-alt/50 p-8 text-center">
          <p className="text-sm text-muted">Pilih dapur lalu tekan <strong>Scan SOP</strong> atau <strong>Analisis Makanan</strong></p>
          <p className="text-xs text-muted mt-1">Laporan otomatis dikirim ke WhatsApp setelah setiap scan</p>
        </div>
      )}
    </div>
  );
}
