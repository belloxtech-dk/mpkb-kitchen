import { KitchenMonitor } from "@/components/kitchen-monitor";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
              M
            </span>
            <h1 className="text-lg font-semibold tracking-tight">MPKB · Kitchen Integrity</h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Live SOP-compliance monitoring — Claude inspects each frame and explains its reasoning.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <div className="flex items-center justify-end gap-1.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-pass" />
            Vision online
          </div>
          <div className="mt-0.5 text-[11px] text-muted">Powered by Claude</div>
        </div>
      </header>

      <KitchenMonitor />
    </main>
  );
}
