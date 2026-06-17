'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/context';
import { BrandMark } from './brand-mark';
import { LocaleToggle } from './locale-toggle';
import { authClient } from '@/lib/auth-client';
import { isAdmin, type Role } from '@/lib/auth/roles';

export function SiteHeader({ email, role }: { email: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const m = useMessages();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const tabs = [
    { href: '/', label: m.nav.floor },
    { href: '/books', label: m.nav.books },
    { href: '/ledger', label: m.nav.ledger },
  ];
  if (isAdmin(role)) tabs.push({ href: '/admin', label: m.auth.navAdmin });
  // Note: /superadmin page still exists and is role-gated; it's just not in the nav.

  const handleSignOut = async () => {
    setMenuOpen(false);
    await authClient.signOut();
    router.push('/landing');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <BrandMark />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            {m.brand}
          </span>
        </div>

        {/* inline nav (sm and up) */}
        <nav className="hidden min-w-0 items-center gap-1 sm:flex">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition sm:px-3',
                  active
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:bg-panel hover:text-fg',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleToggle />
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
              {m.auth.roleNames[role]}
            </span>
            <span
              className="max-w-[150px] truncate text-xs text-muted"
              title={email}
            >
              {email}
            </span>
          </div>
          {/* sign out (sm and up) */}
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden items-center gap-1.5 rounded-lg border px-2 py-1 text-xs text-muted transition hover:text-fg sm:flex"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">{m.auth.signOut}</span>
          </button>
          {/* hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex items-center rounded-lg border p-1.5 text-muted transition hover:text-fg sm:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="border-t bg-bg px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm transition',
                    active
                      ? 'bg-accent text-accent-fg'
                      : 'text-fg hover:bg-panel',
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
                {m.auth.roleNames[role]}
              </span>
              <span className="truncate text-xs text-muted" title={email}>
                {email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs text-muted transition hover:text-fg"
            >
              <LogOut className="size-3.5" />
              {m.auth.signOut}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
