import { getServerMessages } from "@/lib/i18n/server";
import { LoginForm } from "@/components/auth/login-form";
import { LocaleToggle } from "@/components/locale-toggle";
import { BrandMark } from "@/components/brand-mark";

export default async function LandingPage() {
  const m = await getServerMessages();
  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">{m.brand}</span>
        </div>
        <LocaleToggle />
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{m.brand}</h1>
          <p className="mt-3 text-lg text-fg">{m.auth.landingTagline}</p>
          <p className="mt-3 max-w-md text-sm text-muted">{m.auth.landingBody}</p>
          <p className="mt-6 inline-block rounded-full border bg-panel px-3 py-1 text-xs text-muted">
            {m.auth.inviteOnly}
          </p>
        </div>

        <div className="rounded-2xl border bg-panel/40 p-6">
          <h2 className="text-lg font-semibold tracking-tight">{m.auth.signInTitle}</h2>
          <p className="mt-1 mb-4 text-sm text-muted">{m.auth.signInSubtitle}</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
