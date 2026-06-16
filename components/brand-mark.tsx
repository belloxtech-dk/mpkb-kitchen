import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

/** The MPKB logo mark — accent square with the integrity shield. Shared by header + landing. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-7 items-center justify-center rounded-lg bg-accent text-accent-fg", className)}>
      <ShieldCheck className="size-4" />
    </span>
  );
}
