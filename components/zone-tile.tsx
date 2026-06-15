"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { STATUS_STYLE } from "@/lib/status-styles";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/context";
import type { ZoneDef } from "@/lib/frames";
import type { LoadedImage } from "@/lib/image-client";
import type { Verdict } from "@/schemas/verdict";

interface ZoneTileProps {
  zone: ZoneDef;
  image: LoadedImage | undefined;
  result: Verdict | undefined;
  active: boolean;
  busy: boolean;
  onPickFile: (file: File) => void;
  onAnalyze: () => void;
}

export function ZoneTile({ zone, image, result, active, busy, onPickFile, onAnalyze }: ZoneTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState(false);
  const m = useMessages();
  const status = result ? STATUS_STYLE[result.overallStatus] : null;

  // Accept only image files; surface a hint when a drop yields no usable image
  // (e.g. dragging an image from another browser tab provides no File).
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
        className={cn(
          "relative aspect-video bg-panel",
          dragOver && "ring-2 ring-accent ring-inset",
        )}
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
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.dataUrl} alt={zone.label} className="size-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-center text-muted transition hover:text-accent"
          >
            <ImagePlus className="size-6" />
            <span className="text-xs">{m.zone.addHint}</span>
          </button>
        )}

        {active && <div className="scanline" />}

        <div className="absolute top-2 left-2 rounded-md bg-fg/70 px-2 py-0.5 font-mono text-[10px] tracking-wide text-surface">
          {zone.label}
          {active && <span className="ml-1.5 text-accent-soft">● {m.zone.live}</span>}
        </div>

        {status && result && (
          <div className={cn("absolute top-2 right-2 rounded-md px-2 py-0.5 text-[10px] font-semibold", status.bg, status.text)}>
            {m.status[result.overallStatus]} · {Math.round(result.complianceScore)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-xs text-muted transition hover:text-fg disabled:opacity-40"
        >
          {image ? m.zone.replace : m.zone.add}
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!image || busy}
          className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-40"
        >
          {active ? m.zone.analyzing : result ? m.zone.rerun : m.zone.analyze}
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
