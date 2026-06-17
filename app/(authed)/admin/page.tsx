import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { assignableRoles, isAdmin } from "@/lib/auth/roles";
import { getServerMessages } from "@/lib/i18n/server";
import { listUsers } from "@/db/users";
import { InviteForm } from "@/components/auth/invite-form";
import { UserList } from "@/components/auth/user-list";

export default async function AdminPage() {
  const session = await getAppSession();
  if (!session) redirect("/landing");
  if (!isAdmin(session.role)) redirect("/");

  const m = await getServerMessages();
  const users = await listUsers();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">{m.auth.adminTitle}</h1>
        <p className="mt-1 text-sm text-muted">{m.auth.adminSubtitle}</p>
      </div>
      <div className="space-y-6">
        <InviteForm allowedRoles={assignableRoles(session.role)} />
        <UserList users={users} currentUserId={session.userId} />
      </div>
    </main>
  );
}
