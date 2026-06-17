"use client";

import { useRef, useState } from "react";
import { ImagePlus, Pause, Play } from "lucide-react";
import { STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import type { ZoneDef } from "@/lib/frames";
import type { LoadedImage } from "@/lib/image-client";
import type { Verdict } from "@/schemas/verdict";

interface ZoneTileProps {
  zone: ZoneDef;
  frame: LoadedImage | undefined;
  source: "demo" | "upload";
  result: Verdict | undefined;
  analyzing: boolean;
  paused: boolean;
  busy: boolean;
  timestamp: string;
  onTogglePause: () => void;
  onAnalyze: () => void;
  onPickFile: (file: File) => void;
}

export function ZoneTile({
  zone,
  frame,
  source,
  result,
  analyzing,
  paused,
  busy,
  timestamp,
  onTogglePause,
  onAnalyze,
  onPickFile,
}: ZoneTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState(false);
  const m = useMessages();
  const status = result ? STATUS_STYLE[result.overallStatus] : null;

  const submit = (file: File | null | undefined) => {
    if (file && file.type.startsWith("image/")) {
      setDropError(false);
      onPickFile(file);
    } else {
      setDropError(true);
    }
  };

  const fileFromDrop = (dt: DataTransfer): File | null => {
    if (dt.files && dt.files.length > 0) return dt.files[0] ?? null;
    for (let i = 0; i < (dt.items?.length ?? 0); i++) {
      const item = dt.items[i];
      if (item && item.kind === "file") {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
    return null;
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-surface">
      <div
        className={cn("group relative aspect-video bg-[#141a26]", dragOver && "ring-2 ring-accent ring-inset")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          submit(fileFromDrop(e.dataTransfer));
        }}
        onClick={() => {
          if (frame && !analyzing) onTogglePause();
        }}
        role={frame ? "button" : undefined}
      >
        {frame ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frame.dataUrl}
              alt={zone.label}
              className="size-full object-cover brightness-95 contrast-[1.08] grayscale-[0.12]"
            />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.55)]" />
            {/* sweeping scanline only while genuinely analyzing — keeps the cosmetic honest */}
            {analyzing && <div className="scanline" />}

            {/* label + live/paused/analyzing indicator */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white/90">
                {zone.label}
              </span>
              {analyzing ? (
                <span className="flex items-center gap-1 rounded bg-accent/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  {m.zone.scanning}
                </span>
              ) : paused ? (
                <span className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white/80">
                  ❚❚ {m.zone.paused}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-400">
                  <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                  {m.zone.rec}
                </span>
              )}
            </div>

            {/* timestamp + verdict badge */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <span className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/85">
                {timestamp}
              </span>
              {status && result && (
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", status.bg, status.text)}>
                  {m.status[result.overallStatus]} · {Math.round(result.complianceScore)}
                </span>
              )}
            </div>

            {/* feed-source tag */}
            <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-white/70 uppercase">
              {source === "upload" ? m.zone.yourFrame : m.zone.demoFeed}
            </span>

            {/* hover pause/play affordance */}
            {!analyzing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                <span className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white">
                  {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
                </span>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-center text-muted transition hover:text-accent"
          >
            <ImagePlus className="size-6" />
            <span className="text-xs">{m.zone.addHint}</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-xs text-muted transition hover:text-fg disabled:opacity-40"
        >
          {frame ? m.zone.replace : m.zone.add}
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!frame || busy}
          className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-40"
        >
          {analyzing ? m.zone.analyzing : result ? m.zone.rerun : m.zone.analyze}
        </button>
      </div>

      {dropError && <div className="border-t bg-fail-soft px-3 py-1.5 text-[11px] text-fail">{m.zone.invalidDrop}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => submit(e.target.files?.[0])}
      />
    </div>
  );
}
