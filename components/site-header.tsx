'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, LayoutDashboard, Camera, BookOpen, Shield, Users, Bell, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/context';
import { LocaleToggle } from './locale-toggle';
import { authClient } from '@/lib/auth-client';
import { isAdmin, type Role } from '@/lib/auth/roles';

export function SiteHeader({ email, role }: { email: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const m = useMessages();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const tabs = [
    { href: '/',       label: 'Dashboard', icon: LayoutDashboard },
    { href: '/floor',  label: m.nav.floor,  icon: Camera },
    { href: '/books',  label: m.nav.books,  icon: BookOpen },
    { href: '/ledger',  label: m.nav.ledger,  icon: Shield },
    { href: '/alerts',  label: 'Peringatan', icon: Bell },
    { href: '/reports', label: 'Laporan',    icon: FileText },
  ];
  if (isAdmin(role)) tabs.push({ href: '/admin', label: m.auth.navAdmin, icon: Users });

  const handleSignOut = async () => {
    setMenuOpen(false);
    await authClient.signOut();
    router.push('/landing');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">

        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 mr-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-base ring-1 ring-accent/30">
            🛡️
          </div>
          <span className="hidden text-sm font-bold tracking-tight sm:inline text-fg">
            MPKB
          </span>
        </Link>

        {/* Nav tabs */}
        <nav className="hidden min-w-0 items-center gap-0.5 sm:flex flex-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-150',
                  active
                    ? 'bg-accent text-accent-fg shadow-sm shadow-accent/30'
                    : 'text-muted hover:bg-panel hover:text-fg',
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 ml-auto">
          <LocaleToggle />

          {/* User pill */}
          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-2 py-1">
              <span className="size-1.5 rounded-full bg-pass live-dot" />
              <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                {m.auth.roleNames[role]}
              </span>
              <span className="max-w-[120px] truncate text-xs text-muted" title={email}>
                {email}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 py-1.5 text-xs text-muted transition hover:border-fail/40 hover:text-fail sm:flex"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">{m.auth.signOut}</span>
          </button>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            className="flex items-center rounded-lg border border-border p-1.5 text-muted transition hover:text-fg sm:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-surface/95 backdrop-blur-xl px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition',
                    active ? 'bg-accent text-accent-fg' : 'text-fg hover:bg-panel',
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-1.5 rounded-full bg-pass" />
              <span className="truncate text-xs text-muted" title={email}>{email}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs text-muted transition hover:text-fail"
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
