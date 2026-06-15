import { KitchenMonitor } from "@/components/kitchen-monitor";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">The Floor — SOP compliance</h1>
        <p className="mt-1 text-sm text-muted">
          Claude inspects each kitchen frame in real time, explains what it sees, and flags violations.
        </p>
      </div>
      <KitchenMonitor />
    </main>
  );
}
