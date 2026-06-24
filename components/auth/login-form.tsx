"use client";

import { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("andrea@openclaw.ai");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await authClient.signIn.email({ email, password, callbackURL: "/" });
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
        <label htmlFor="email" className="mb-1.5 block text-[11px] font-semibold tracking-widest text-muted uppercase">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="anda@contoh.com"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 transition"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[11px] font-semibold tracking-widest text-muted uppercase">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 pr-10 text-sm text-fg outline-none placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 transition"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-fail/30 bg-fail/10 px-3 py-2 text-sm text-fail">
          <span className="text-base">⚠️</span>
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-md shadow-accent/20 transition-all duration-150 hover:opacity-90 hover:shadow-accent/30 disabled:opacity-50 active:scale-[0.98]"
      >
        {status === "loading" ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-accent-fg/30 border-t-accent-fg" />
            Memproses…
          </span>
        ) : (
          <>
            <LogIn className="size-4" />
            Masuk
          </>
        )}
      </button>
    </form>
  );
}
