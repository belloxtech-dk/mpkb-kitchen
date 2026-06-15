import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/roles";
import { getServerMessages } from "@/lib/i18n/server";

export default async function SuperadminPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");
  if (!isSuperadmin(session.role)) redirect("/");

  const m = await getServerMessages();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">{m.auth.superadminTitle}</h1>
        <p className="mt-1 text-sm text-muted">{m.auth.superadminSubtitle}</p>
      </div>
      <div className="rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
        {m.auth.placeholderNote}
      </div>
    </main>
  );
}
