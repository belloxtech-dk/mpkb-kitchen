import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/roles";
import { getModel } from "@/lib/anthropic";
import { ModelSwitcher } from "@/components/superadmin/model-switcher";
import { ApiKeySetup } from "@/components/superadmin/api-key-setup";

export default async function SuperadminPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");
  if (!isSuperadmin(session.role)) redirect("/");

  const currentModel = await getModel();
  const hasKey = !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("PASTE_"));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Superadmin</h1>
        <p className="mt-1 text-sm text-muted">Kontrol sistem · MPKB Kitchen Integrity</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">🔑 API Key</h2>
        <ApiKeySetup hasKey={hasKey} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">🤖 Model AI</h2>
        <ModelSwitcher current={currentModel} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">📊 Info Sistem</h2>
        <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm max-w-xl">
          {[
            { label: "Versi", value: "0.1.0" },
            { label: "Stack", value: "Next.js 16" },
            { label: "Database", value: "PostgreSQL" },
            { label: "Hosting", value: "Railway" },
            { label: "Pilot", value: "SPPG Gamping" },
            { label: "Provinsi", value: "DI Yogyakarta" },
            { label: "Budget AI", value: "$200 / bln" },
            { label: "Model", value: currentModel.split("/").pop() ?? currentModel },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{label}</div>
              <div className="text-fg font-mono text-xs">{value}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
