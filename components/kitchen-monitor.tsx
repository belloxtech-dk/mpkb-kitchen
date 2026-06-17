"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { ZoneTile } from "./zone-tile";
import { ReasoningStream } from "./reasoning-stream";
import { VerdictPanel } from "./verdict-panel";
import { AlertCard } from "./alert-card";
import { loadManifest, type ZoneDef } from "@/lib/frames";
import { fileToImage, urlToImage, type LoadedImage } from "@/lib/image-client";
import { useAnalysis, type AnalysisResult } from "@/lib/use-analysis";
import { scoreColor, STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useLocale, useMessages } from "@/lib/i18n/context";

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
  const [results, setResults] = useState<Record<string, AnalysisResult>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
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

  // Focus the inspector on whichever zone is currently streaming (so a sweep
  // visibly walks zone→zone); after it finishes the user can click to revisit any.
  useEffect(() => {
    if (busy && analysis.activeZone) setSelectedZone(analysis.activeZone);
  }, [busy, analysis.activeZone]);

  const runAnalysis = useCallback(
    async (zoneId: string, frame: LoadedImage, source: Source) => {
      setFeeds((prev) => (prev[zoneId] ? { ...prev, [zoneId]: { ...prev[zoneId]!, paused: true } } : prev));
      const result = await analysis.run({
        zone: zoneId,
        source: source === "upload" ? "upload" : "frame",
        imageBase64: frame.base64,
        mediaType: frame.mediaType,
        locale,
      });
      if (result) setResults((prev) => ({ ...prev, [zoneId]: result }));
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

  const verdicts = Object.values(results).map((r) => r.verdict);
  const avgScore = verdicts.length
    ? Math.round(verdicts.reduce((sum, v) => sum + v.complianceScore, 0) / verdicts.length)
    : null;
  const flagged = verdicts.filter((v) => v.overallStatus !== "pass").length;
  const hasFrames = Object.values(feeds).some((f) => f.frames.length > 0);
  const timestamp = formatTimestamp(now);

  // What the inspector panel shows: the live stream for the zone being analyzed,
  // otherwise the stored result for whichever zone is selected.
  const liveSelected = busy && analysis.activeZone === selectedZone;
  const stored = selectedZone ? results[selectedZone] : undefined;
  const inspector = {
    reasoning: liveSelected ? analysis.reasoning : (stored?.reasoning ?? ""),
    verdict: liveSelected ? analysis.verdict : (stored?.verdict ?? null),
    ledger: liveSelected ? analysis.ledger : (stored?.ledger ?? null),
    alert: liveSelected ? analysis.alert : (stored?.alert ?? null),
  };

  return (
    <div className="space-y-4">
      {/* summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3">
        <div className="flex items-center gap-5">
          <Stat
            label={m.floor.kitchenScore}
            value={avgScore === null ? "—" : String(avgScore)}
            suffix={avgScore === null ? undefined : "/ 100"}
            valueClass={avgScore === null ? "text-muted" : scoreColor(avgScore)}
          />
          <Stat
            label={m.floor.zonesFlagged}
            value={String(flagged)}
            suffix={zones.length ? `/ ${zones.length}` : undefined}
            valueClass={flagged > 0 ? "text-fail" : "text-pass"}
          />
          <Stat
            label={m.floor.analyzed}
            value={String(verdicts.length)}
            suffix={zones.length ? `/ ${zones.length}` : undefined}
            valueClass="text-fg"
          />
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
                result={results[zone.id]?.verdict}
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
          {/* zone selector — revisit any analyzed zone's full feedback after a sweep */}
          {(busy || verdicts.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {zones.map((zone) => {
                const r = results[zone.id];
                const live = busy && analysis.activeZone === zone.id;
                const active = selectedZone === zone.id;
                const dot = live ? "bg-accent" : r ? STATUS_STYLE[r.verdict.overallStatus].dot : "bg-muted";
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone.id)}
                    disabled={!r && !live}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition disabled:opacity-40",
                      active ? "border-accent bg-accent-soft text-fg" : "bg-surface text-muted hover:text-fg",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", dot, live && "animate-pulse")} />
                    {zone.id}
                    {r && <span className={cn("font-mono tabular-nums", scoreColor(r.verdict.complianceScore))}>{Math.round(r.verdict.complianceScore)}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <ReasoningStream
            text={inspector.reasoning}
            active={liveSelected}
            label={m.floor.reasoningLabel}
            subject={selectedZone ?? undefined}
            activePlaceholder={m.floor.reasoningActive}
            idlePlaceholder={m.floor.reasoningIdle}
            model={model}
          />
          <VerdictPanel verdict={inspector.verdict} ledger={inspector.ledger} analyzing={liveSelected} />
          {inspector.alert && <AlertCard alert={inspector.alert} />}
          {analysis.error && (
            <div className="rounded-xl border border-fail/30 bg-fail-soft p-3 text-sm text-fail">{analysis.error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  valueClass,
}: {
  label: string;
  value: string;
  suffix?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="font-mono text-xl font-semibold tabular-nums">
        <span className={valueClass}>{value}</span>
        {suffix && <span className="ml-0.5 text-sm font-normal text-muted">{suffix}</span>}
      </div>
      <div className="text-[10px] tracking-wide text-muted uppercase">{label}</div>
    </div>
  );
}
