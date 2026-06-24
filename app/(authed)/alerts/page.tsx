import { db } from "@/db";
import { events } from "@/db/schema";
import { desc, ne } from "drizzle-orm";
import { AlertsView } from "./alerts-view";

export default async function AlertsPage() {
  const violations = await db
    .select({
      id: events.id,
      createdAt: events.createdAt,
      zone: events.zone,
      overallStatus: events.overallStatus,
      complianceScore: events.complianceScore,
      summary: events.summary,
    })
    .from(events)
    .where(ne(events.overallStatus, "pass"))
    .orderBy(desc(events.createdAt));

  const totalFail = violations.filter((v) => v.overallStatus === "fail").length;
  const totalWarn = violations.filter((v) => v.overallStatus === "warn").length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-fail-soft text-fail text-base ring-1 ring-fail/30">
            🔔
          </span>
          Pusat Peringatan
        </h1>
        <p className="mt-1 text-sm text-muted">
          Riwayat seluruh pelanggaran SOP yang terdeteksi ·{" "}
          {violations.length > 0 ? (
            <>
              <span className="text-fail font-medium">{totalFail} gagal</span>
              {" · "}
              <span className="text-warn font-medium">{totalWarn} peringatan</span>
            </>
          ) : (
            "Tidak ada pelanggaran"
          )}
        </p>
      </div>

      <AlertsView violations={violations} />
    </main>
  );
}
