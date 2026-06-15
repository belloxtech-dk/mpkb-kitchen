import { cn } from "@/lib/cn";

/** Renders Claude's live narration as it streams in. */
export function ReasoningStream({
  text,
  active,
  label = "AI observation",
  activePlaceholder = "Analyzing frame…",
  idlePlaceholder = "Awaiting a frame to inspect.",
}: {
  text: string;
  active: boolean;
  label?: string;
  activePlaceholder?: string;
  idlePlaceholder?: string;
}) {
  const empty = text.length === 0;
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
        <span className={cn("size-1.5 rounded-full", active ? "bg-accent" : "bg-border")} />
        {label}
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
