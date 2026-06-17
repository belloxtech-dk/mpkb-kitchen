"use client";

import { useEffect, useRef } from "react";
import { Cpu, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { modelShort } from "@/lib/models";

/** Renders Claude's live narration as it streams in. Hosts the page's model badge. */
export function ReasoningStream({
  text,
  active,
  label = "AI observation",
  subject,
  activePlaceholder = "Analyzing frame…",
  idlePlaceholder = "Awaiting a frame to inspect.",
  model,
}: {
  text: string;
  active: boolean;
  label?: string;
  /** Optional subject the narration pertains to (e.g. a zone), shown as a chip beside the label. */
  subject?: string;
  activePlaceholder?: string;
  idlePlaceholder?: string;
  model?: string;
}) {
  const empty = text.length === 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Follow the newest text while streaming so the latest narration stays in view.
  useEffect(() => {
    if (active && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, active]);

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium tracking-wide text-muted uppercase">
          <Sparkles className={cn("size-3.5 shrink-0", active ? "text-accent" : "text-muted")} />
          <span className="shrink-0">{label}</span>
          {subject && (
            <span className="truncate rounded bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-fg normal-case">
              {subject}
            </span>
          )}
        </div>
        {model && (
          <span
            className="flex items-center gap-1 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent"
            title={model}
          >
            <Cpu className="size-3" />
            {modelShort(model)}
          </span>
        )}
      </div>
      <div ref={scrollRef} className="max-h-64 overflow-y-auto pr-1">
        <p
          className={cn(
            "font-mono text-[13px] leading-relaxed whitespace-pre-wrap",
            empty ? "text-muted" : "text-fg",
            active && "caret",
          )}
        >
          {empty ? (active ? activePlaceholder : idlePlaceholder) : text}
        </p>
      </div>
    </div>
  );
}
