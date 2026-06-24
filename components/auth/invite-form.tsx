"use client";

import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import { useMessages } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/auth/roles";

export function InviteForm({ allowedRoles }: { allowedRoles: Role[] }) {
  const m = useMessages();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(allowedRoles[0] ?? "user");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    setCreatedPassword("");
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, ...(password ? { password } : {}) }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; defaultPassword?: string; error?: string };
      if (res.ok && data.ok) {
        setStatus("sent");
        setMessage(`Akun ${email} berhasil dibuat.`);
        setCreatedPassword(data.defaultPassword ?? "mbg123");
        setEmail("");
        setName("");
        setPassword("");
      } else {
        setStatus("error");
        setMessage(data.error ?? m.auth.inviteFailed);
      }
    } catch {
      setStatus("error");
      setMessage(m.auth.inviteFailed);
    }
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md space-y-3">
      <form onSubmit={submit} className="rounded-xl border bg-surface p-4 space-y-3">
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
          <label className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">
            Password <span className="text-muted normal-case">(kosong = mbg123)</span>
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mbg123"
            className="w-full rounded-lg border bg-panel px-3 py-2 text-sm outline-none focus:border-accent font-mono"
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
          {status === "sending" ? m.auth.inviting : "Buat Akun"}
        </button>
      </form>

      {message && (
        <div className={cn("rounded-xl border p-3 text-sm", status === "error"
          ? "border-fail/30 bg-fail-soft text-fail"
          : "border-pass/30 bg-pass-soft text-pass"
        )}>
          {message}
          {status === "sent" && createdPassword && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted text-xs">Password:</span>
              <code className="font-mono text-xs bg-panel rounded px-2 py-0.5 text-fg">{createdPassword}</code>
              <button type="button" onClick={copyPassword} className="text-muted hover:text-fg transition">
                {copied ? <Check className="size-3.5 text-pass" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
