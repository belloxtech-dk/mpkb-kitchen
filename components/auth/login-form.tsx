"use client";

import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Send } from "lucide-react";
import { useMessages } from "@/lib/i18n/context";
import { authClient } from "@/lib/auth-client";

const EmailSchema = z.string().email();

export function LoginForm() {
  const m = useMessages();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EmailSchema.safeParse(email).success) return;
    setStatus("sending");
    // Privacy-preserving: always show the generic "check your email" state,
    // whether or not an invited account exists (invite-only + no enumeration).
    try {
      await authClient.signIn.magicLink({ email, callbackURL: "/" });
    } catch {
      /* swallow — don't reveal whether the address is registered */
    }
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-pass/30 bg-pass-soft p-4 text-center">
        <CheckCircle2 className="mx-auto mb-1.5 size-6 text-pass" />
        <div className="text-sm font-semibold text-pass">{m.auth.checkEmailTitle}</div>
        <p className="mt-1 text-[13px] text-fg">{m.auth.checkEmailBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">
          {m.auth.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={m.auth.emailPlaceholder}
          required
          autoComplete="email"
          className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
      >
        <Send className="size-4" />
        {status === "sending" ? m.auth.sending : m.auth.sendLink}
      </button>
    </form>
  );
}
