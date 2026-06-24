"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("andrea@openclaw.ai");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });
      if (res.error) {
        setErrorMsg("Email atau password salah.");
        setStatus("error");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setErrorMsg("Terjadi kesalahan. Coba lagi.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="andrea@openclaw.ai"
          required
          autoComplete="email"
          className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium tracking-wide text-muted uppercase">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-fail-soft border border-fail/30 px-3 py-2 text-sm text-fail">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
      >
        <LogIn className="size-4" />
        {status === "loading" ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
