import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { assignableRoles, isAdmin } from "@/lib/auth/roles";
import { getServerMessages } from "@/lib/i18n/server";
import { InviteForm } from "@/components/auth/invite-form";

export default async function AdminPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");
  if (!isAdmin(session.role)) redirect("/");

  const m = await getServerMessages();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">{m.auth.adminTitle}</h1>
        <p className="mt-1 text-sm text-muted">{m.auth.adminSubtitle}</p>
      </div>
      <InviteForm allowedRoles={assignableRoles(session.role)} />
    </main>
  );
}
