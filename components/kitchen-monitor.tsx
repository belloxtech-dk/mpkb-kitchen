"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { ZoneTile } from "./zone-tile";
import { ReasoningStream } from "./reasoning-stream";
import { VerdictPanel } from "./verdict-panel";
import { AlertCard } from "./alert-card";
import { loadManifest, type ZoneDef } from "@/lib/frames";
import { fileToImage, urlToImage, type LoadedImage } from "@/lib/image-client";
import { useAnalysis } from "@/lib/use-analysis";
import { scoreColor } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useLocale, useMessages } from "@/lib/i18n/context";
import type { Verdict } from "@/schemas/verdict";

type Source = "demo" | "upload";

/** A zone's "live feed": a list of frames cycled on a timer until paused/analyzed. */
interface Feed {
  frames: LoadedImage[];
  index: number;
  paused: boolean;
  source: Source;
}

const CYCLE_MS = 2200;

function formatTimestamp(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function KitchenMonitor({ model }: { model: string }) {
  const [zones, setZones] = useState<ZoneDef[]>([]);
  const [feeds, setFeeds] = useState<Record<string, Feed>>({});
  const [results, setResults] = useState<Record<string, Verdict>>({});
  const [now, setNow] = useState(0);

  const analysis = useAnalysis();
  const busy = analysis.status === "analyzing";
  const m = useMessages();
  const locale = useLocale();

  // Load the manifest and preload every zone's frames.
  useEffect(() => {
    let cancelled = false;
    loadManifest().then(async (manifest) => {
      if (cancelled) return;
      setZones(manifest.zones);
      for (const zone of manifest.zones) {
        const loaded: LoadedImage[] = [];
        for (const file of zone.frames) {
          try {
            loaded.push(await urlToImage(`/frames/${file}`));
          } catch {
            /* missing file — skip */
          }
        }
        if (cancelled) return;
        if (loaded.length) {
          setFeeds((prev) => ({ ...prev, [zone.id]: { frames: loaded, index: 0, paused: false, source: "demo" } }));
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live clock (overlay timestamp). Client-only to avoid hydration mismatch.
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cycle the unpaused demo feeds.
  useEffect(() => {
    const t = setInterval(() => {
      setFeeds((prev) => {
        let changed = false;
        const next: Record<string, Feed> = {};
        for (const [id, f] of Object.entries(prev)) {
          if (!f.paused && f.source === "demo" && f.frames.length > 1) {
            next[id] = { ...f, index: (f.index + 1) % f.frames.length };
            changed = true;
          } else {
            next[id] = f;
          }
        }
        return changed ? next : prev;
      });
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const runAnalysis = useCallback(
    async (zoneId: string, frame: LoadedImage, source: Source) => {
      setFeeds((prev) => (prev[zoneId] ? { ...prev, [zoneId]: { ...prev[zoneId]!, paused: true } } : prev));
      const verdict = await analysis.run({
        zone: zoneId,
        source: source === "upload" ? "upload" : "frame",
        imageBase64: frame.base64,
        mediaType: frame.mediaType,
        locale,
      });
      if (verdict) setResults((prev) => ({ ...prev, [zoneId]: verdict }));
    },
    [analysis, locale],
  );

  const analyzeZone = useCallback(
    (zoneId: string) => {
      const feed = feeds[zoneId];
      const frame = feed?.frames[feed.index];
      if (feed && frame) void runAnalysis(zoneId, frame, feed.source);
    },
    [feeds, runAnalysis],
  );

  // Click a tile to pause; resuming clears its verdict badge so the live feed is unannotated.
  const togglePause = useCallback(
    (zoneId: string) => {
      const feed = feeds[zoneId];
      if (!feed) return;
      const resuming = feed.paused;
      setFeeds((prev) => ({ ...prev, [zoneId]: { ...prev[zoneId]!, paused: !feed.paused } }));
      if (resuming) {
        setResults((prev) => {
          const next = { ...prev };
          delete next[zoneId];
          return next;
        });
      }
    },
    [feeds],
  );

  const handlePickFile = useCallback(
    async (zoneId: string, file: File) => {
      let img: LoadedImage;
      try {
        img = await fileToImage(file);
      } catch (err) {
        console.error("Could not read image:", err);
        return;
      }
      setFeeds((prev) => ({ ...prev, [zoneId]: { frames: [img], index: 0, paused: true, source: "upload" } }));
      setResults((prev) => {
        const next = { ...prev };
        delete next[zoneId];
        return next;
      });
      await runAnalysis(zoneId, img, "upload");
    },
    [runAnalysis],
  );

  const runSweep = useCallback(async () => {
    for (const zone of zones) {
      const feed = feeds[zone.id];
      const frame = feed?.frames[feed.index];
      if (feed && frame) await runAnalysis(zone.id, frame, feed.source);
    }
  }, [zones, feeds, runAnalysis]);

  const scored = Object.values(results);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, v) => sum + v.complianceScore, 0) / scored.length)
    : null;
  const flagged = scored.filter((v) => v.overallStatus !== "pass").length;
  const hasFrames = Object.values(feeds).some((f) => f.frames.length > 0);
  const timestamp = formatTimestamp(now);

  return (
    <div className="space-y-4">
      {/* summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3">
        <div className="flex items-center gap-5">
          <Stat label={m.floor.kitchenScore} value={avgScore === null ? "—" : String(avgScore)} valueClass={avgScore === null ? "text-muted" : scoreColor(avgScore)} />
          <Stat label={m.floor.zonesFlagged} value={String(flagged)} valueClass={flagged > 0 ? "text-fail" : "text-pass"} />
          <Stat label={m.floor.analyzed} value={`${scored.length}/${zones.length || "—"}`} valueClass="text-fg" />
        </div>
        <button
          type="button"
          onClick={runSweep}
          disabled={busy || !hasFrames}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-40"
        >
          <ScanLine className="size-4" />
          {busy ? m.floor.sweeping : m.floor.runSweep}
        </button>
      </div>

      <p className="text-xs text-muted">{m.floor.feedHint}</p>

      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* CCTV wall */}
        <div className="grid gap-3 sm:grid-cols-2">
          {zones.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
              {m.floor.loadingZones}
            </div>
          )}
          {zones.map((zone) => {
            const feed = feeds[zone.id];
            const frame = feed ? feed.frames[feed.index] : undefined;
            return (
              <ZoneTile
                key={zone.id}
                zone={zone}
                frame={frame}
                source={feed?.source ?? "demo"}
                result={results[zone.id]}
                analyzing={busy && analysis.activeZone === zone.id}
                paused={feed?.paused ?? false}
                busy={busy}
                timestamp={timestamp}
                onTogglePause={() => togglePause(zone.id)}
                onAnalyze={() => analyzeZone(zone.id)}
                onPickFile={(file) => handlePickFile(zone.id, file)}
              />
            );
          })}
        </div>

        {/* inspector panel */}
        <div className="space-y-3">
          <ReasoningStream
            text={analysis.reasoning}
            active={busy}
            label={m.floor.reasoningLabel}
            activePlaceholder={m.floor.reasoningActive}
            idlePlaceholder={m.floor.reasoningIdle}
            model={model}
          />
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
