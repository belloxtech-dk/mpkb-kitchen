import { getServerMessages } from '@/lib/i18n/server';
import { LoginForm } from '@/components/auth/login-form';
import { LocaleToggle } from '@/components/locale-toggle';
import { BrandMark } from '@/components/brand-mark';

export default async function LandingPage() {
  const m = await getServerMessages();
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">
            {m.brand}
          </span>
        </div>
        <LocaleToggle />
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border bg-panel/40 p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            {m.auth.signInTitle}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            {m.auth.signInSubtitle}
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
