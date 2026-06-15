"use client";

import { useCallback, useEffect, useState } from "react";
import { ZoneTile } from "./zone-tile";
import { ReasoningStream } from "./reasoning-stream";
import { VerdictPanel } from "./verdict-panel";
import { AlertCard } from "./alert-card";
import { framesForZone, loadManifest, type ZoneDef } from "@/lib/frames";
import { fileToImage, urlToImage, type LoadedImage } from "@/lib/image-client";
import { useAnalysis, type AnalysisInput } from "@/lib/use-analysis";
import { scoreColor } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import type { Verdict } from "@/schemas/verdict";

type Source = "frame" | "upload";

export function KitchenMonitor() {
  const [zones, setZones] = useState<ZoneDef[]>([]);
  const [images, setImages] = useState<Record<string, LoadedImage>>({});
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [results, setResults] = useState<Record<string, Verdict>>({});

  const analysis = useAnalysis();
  const busy = analysis.status === "analyzing";

  // Load the manifest and preload any staged frames.
  useEffect(() => {
    let cancelled = false;
    loadManifest().then(async (manifest) => {
      if (cancelled) return;
      setZones(manifest.zones);
      for (const zone of manifest.zones) {
        const frame = framesForZone(manifest, zone.id)[0];
        if (!frame) continue;
        try {
          const img = await urlToImage(`/frames/${frame.file}`);
          if (cancelled) return;
          setImages((prev) => ({ ...prev, [zone.id]: img }));
          setSources((prev) => ({ ...prev, [zone.id]: "frame" }));
        } catch {
          /* missing file — zone stays empty / droppable */
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const analyze = useCallback(
    async (zoneId: string, image: LoadedImage, source: Source) => {
      const input: AnalysisInput = { zone: zoneId, source, imageBase64: image.base64, mediaType: image.mediaType };
      const verdict = await analysis.run(input);
      if (verdict) setResults((prev) => ({ ...prev, [zoneId]: verdict }));
      return verdict;
    },
    [analysis],
  );

  const handlePickFile = useCallback(
    async (zoneId: string, file: File) => {
      const img = await fileToImage(file);
      setImages((prev) => ({ ...prev, [zoneId]: img }));
      setSources((prev) => ({ ...prev, [zoneId]: "upload" }));
      setResults((prev) => {
        const next = { ...prev };
        delete next[zoneId];
        return next;
      });
      await analyze(zoneId, img, "upload");
    },
    [analyze],
  );

  const runSweep = useCallback(async () => {
    for (const zone of zones) {
      const img = images[zone.id];
      if (img) await analyze(zone.id, img, sources[zone.id] ?? "upload");
    }
  }, [zones, images, sources, analyze]);

  const scored = Object.values(results);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, v) => sum + v.complianceScore, 0) / scored.length)
    : null;
  const flagged = scored.filter((v) => v.overallStatus !== "pass").length;
  const hasImages = Object.keys(images).length > 0;

  return (
    <div className="space-y-4">
      {/* summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3">
        <div className="flex items-center gap-5">
          <Stat label="Kitchen score" value={avgScore === null ? "—" : String(avgScore)} valueClass={avgScore === null ? "text-muted" : scoreColor(avgScore)} />
          <Stat label="Zones flagged" value={String(flagged)} valueClass={flagged > 0 ? "text-fail" : "text-pass"} />
          <Stat label="Analyzed" value={`${scored.length}/${zones.length || "—"}`} valueClass="text-fg" />
        </div>
        <button
          type="button"
          onClick={runSweep}
          disabled={busy || !hasImages}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Sweeping…" : "Run sweep"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* CCTV wall */}
        <div className="grid gap-3 sm:grid-cols-2">
          {zones.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
              Loading camera zones…
            </div>
          )}
          {zones.map((zone) => (
            <ZoneTile
              key={zone.id}
              zone={zone}
              image={images[zone.id]}
              result={results[zone.id]}
              active={busy && analysis.activeZone === zone.id}
              busy={busy}
              onPickFile={(file) => handlePickFile(zone.id, file)}
              onAnalyze={() => {
                const img = images[zone.id];
                if (img) analyze(zone.id, img, sources[zone.id] ?? "upload");
              }}
            />
          ))}
        </div>

        {/* inspector panel */}
        <div className="space-y-3">
          <ReasoningStream text={analysis.reasoning} active={busy} />
          <VerdictPanel verdict={analysis.verdict} ledger={analysis.ledger} />
          {analysis.alert && <AlertCard alert={analysis.alert} />}
          {analysis.error && (
            <div className="rounded-xl border border-fail/30 bg-fail-soft p-3 text-sm text-fail">{analysis.error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className={cn("font-mono text-xl font-semibold tabular-nums", valueClass)}>{value}</div>
      <div className="text-[10px] tracking-wide text-muted uppercase">{label}</div>
    </div>
  );
}
