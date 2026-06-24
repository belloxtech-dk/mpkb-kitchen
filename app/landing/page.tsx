import { getServerMessages } from '@/lib/i18n/server';
import { LoginForm } from '@/components/auth/login-form';
import { LocaleToggle } from '@/components/locale-toggle';

export default async function LandingPage() {
  const m = await getServerMessages();
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">

      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-accent opacity-[0.07] blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-pass opacity-[0.06] blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px),
                            linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-accent/20 text-xl ring-1 ring-accent/30">
            🛡️
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-tight text-fg">MPKB</div>
            <div className="text-[10px] text-muted leading-tight">Kitchen Integrity</div>
          </div>
        </div>
        <LocaleToggle />
      </header>

      <section className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6 fade-up">

          {/* Hero text */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="size-1.5 rounded-full bg-accent animate-pulse inline-block" />
              Pilot · SPPG Gamping, Yogyakarta
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-fg">
              {m.brand}
            </h1>
            <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">
              Pemantauan integritas dapur MBG berbasis AI — SOP, keuangan, dan jejak audit anti-manipulasi.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { emoji: "📷", label: "Inspeksi CCTV" },
              { emoji: "📒", label: "Audit Keuangan" },
              { emoji: "🔐", label: "Ledger Anti-Tamper" },
              { emoji: "🤖", label: m.poweredBy },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
              >
                {f.emoji} {f.label}
              </span>
            ))}
          </div>

          {/* Login card */}
          <div className="gradient-border p-6 shadow-2xl shadow-black/40">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-tight text-fg">Masuk ke sistem</h2>
              <p className="mt-0.5 text-xs text-muted">Akses terbatas · Batu Topeng Group</p>
            </div>
            <LoginForm />
          </div>

          <p className="text-center text-[11px] text-muted">
            openclaw.ai · MBG Anti-Korupsi Program 2026
          </p>
        </div>
      </section>
    </main>
  );
}
