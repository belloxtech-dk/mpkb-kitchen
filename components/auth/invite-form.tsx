"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useMessages } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/auth/roles";

export function InviteForm({ allowedRoles }: { allowedRoles: Role[] }) {
  const m = useMessages();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>(allowedRoles[0] ?? "user");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      if (res.ok) {
        setStatus("sent");
        setMessage(m.auth.inviteSent(email));
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(m.auth.inviteFailed);
      }
    } catch {
      setStatus("error");
      setMessage(m.auth.inviteFailed);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-3 rounded-xl border bg-surface p-4">
      <div className="text-sm font-semibold">{m.auth.inviteHeading}</div>
      <div>
        <label className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">{m.auth.nameLabel}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">{m.auth.emailLabel}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">{m.auth.roleLabel}</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full rounded-lg border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {allowedRoles.map((r) => (
            <option key={r} value={r}>
              {m.auth.roleNames[r]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
      >
        <UserPlus className="size-4" />
        {status === "sending" ? m.auth.inviting : m.auth.invite}
      </button>
      {message && (
        <p className={cn("text-xs", status === "error" ? "text-fail" : "text-pass")}>{message}</p>
      )}
    </form>
  );
}
