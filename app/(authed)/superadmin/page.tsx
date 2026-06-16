import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/roles";
import { getServerMessages } from "@/lib/i18n/server";
import { getModel } from "@/lib/anthropic";
import { ModelSwitcher } from "@/components/superadmin/model-switcher";

export default async function SuperadminPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");
  if (!isSuperadmin(session.role)) redirect("/");

  const m = await getServerMessages();
  const currentModel = await getModel();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">{m.auth.superadminTitle}</h1>
        <p className="mt-1 text-sm text-muted">{m.auth.superadminSubtitle}</p>
      </div>
      <ModelSwitcher current={currentModel} />
    </main>
  );
}
