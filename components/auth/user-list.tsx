"use client";

import { useLocale, useMessages } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import type { UserListItem } from "@/db/users";
import type { Role } from "@/lib/auth/roles";

type Status = "invited" | "active" | "banned";

function statusOf(u: UserListItem): Status {
  if (u.banned) return "banned";
  return u.emailVerified ? "active" : "invited";
}

const STATUS_CLS: Record<Status, string> = {
  invited: "bg-warn-soft text-warn",
  active: "bg-pass-soft text-pass",
  banned: "bg-fail-soft text-fail",
};

export function UserList({ users }: { users: UserListItem[] }) {
  const m = useMessages();
  const locale = useLocale();
  const dateLocale = locale === "id" ? "id-ID" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" });
  const dateTimeFmt = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" });

  const statusLabel: Record<Status, string> = {
    invited: m.auth.users.statusInvited,
    active: m.auth.users.statusActive,
    banned: m.auth.users.statusBanned,
  };

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-3 text-sm font-semibold">{m.auth.users.heading}</div>
      {users.length === 0 ? (
        <p className="text-xs text-muted">{m.auth.users.none}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead>
              <tr className="text-[10px] tracking-wide text-muted uppercase">
                <th className="pb-2 pr-4 font-medium">{m.auth.users.name}</th>
                <th className="pb-2 pr-4 font-medium">{m.auth.users.email}</th>
                <th className="pb-2 pr-4 font-medium">{m.auth.users.role}</th>
                <th className="pb-2 pr-4 font-medium">{m.auth.users.status}</th>
                <th className="pb-2 pr-4 font-medium">{m.auth.users.invitedOn}</th>
                <th className="pb-2 pr-4 font-medium">{m.auth.users.lastSignIn}</th>
                <th className="pb-2 text-right font-medium">{m.auth.users.signIns}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const status = statusOf(u);
                return (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4 text-muted">{u.email}</td>
                    <td className="py-2 pr-4">{m.auth.roleNames[u.role as Role] ?? u.role}</td>
                    <td className="py-2 pr-4">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", STATUS_CLS[status])}>
                        {statusLabel[status]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted">{dateFmt.format(u.createdAt)}</td>
                    <td className="py-2 pr-4 text-muted">
                      {u.lastSignInAt ? dateTimeFmt.format(u.lastSignInAt) : m.auth.users.never}
                    </td>
                    <td className="py-2 text-right tabular-nums">{u.signInCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
