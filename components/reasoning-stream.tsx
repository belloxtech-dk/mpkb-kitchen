import { Cpu, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { modelShort } from "@/lib/models";

/** Renders Claude's live narration as it streams in. Hosts the page's model badge. */
export function ReasoningStream({
  text,
  active,
  label = "AI observation",
  activePlaceholder = "Analyzing frame…",
  idlePlaceholder = "Awaiting a frame to inspect.",
  model,
}: {
  text: string;
  active: boolean;
  label?: string;
  activePlaceholder?: string;
  idlePlaceholder?: string;
  model?: string;
}) {
  const empty = text.length === 0;
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted uppercase">
          <Sparkles className={cn("size-3.5", active ? "text-accent" : "text-muted")} />
          {label}
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
  );
}
