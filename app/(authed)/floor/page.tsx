export const dynamic = "force-dynamic";

import { KitchenProfile } from "@/components/kitchen-profile";
import { CctvLive } from "@/components/cctv-live";
import { FLEET_KITCHENS } from "@/lib/fleet/kitchens";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface Props {
  searchParams: Promise<{ kitchen?: string }>;
}

export default async function FloorPage({ searchParams }: Props) {
  const params = await searchParams;
  const kitchenId = params.kitchen ?? "gamping-yogyakarta";
  const kitchen = FLEET_KITCHENS.find(k => k.id === kitchenId) ?? FLEET_KITCHENS[0]!;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">📷 Live CCTV Monitor</h1>
        <p className="mt-1 text-sm text-muted">
          {kitchen.label} · {kitchen.location} · {new Date().toLocaleDateString("id-ID", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Kitchen tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {FLEET_KITCHENS.map(k => (
          <Link key={k.id} href={`/floor?kitchen=${k.id}`}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
              k.id === kitchenId
                ? "border-accent bg-accent text-accent-fg shadow-sm"
                : "border-border text-muted hover:text-fg hover:border-fg/30 bg-surface-alt"
            )}>
            <span className={cn(
              "size-2 rounded-full",
              k.status === "live" ? "bg-green-400 animate-pulse" : "bg-muted"
            )} />
            <span>{k.label}</span>
            <span className="text-[10px] opacity-70">{k.province}</span>
            {k.status === "live" && (
              <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                LIVE
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <CctvLive key={kitchenId} kitchenId={kitchenId} />
        <aside className="space-y-4">
          <KitchenProfile cctvConnected={true} />
        </aside>
      </div>
    </main>
  );
}
