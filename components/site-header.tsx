"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LOCALES } from "@/lib/i18n/locale";
import { useLocale, useMessages, useSetLocale } from "@/lib/i18n/context";

export function SiteHeader() {
  const pathname = usePathname();
  const m = useMessages();
  const locale = useLocale();
  const setLocale = useSetLocale();

  const tabs = [
    { href: "/", label: m.nav.floor },
    { href: "/books", label: m.nav.books },
    { href: "/ledger", label: m.nav.ledger },
  ];

  return (
    <header className="sticky top-0 z-20 border-b bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight">{m.brand}</span>
        </div>

        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition",
                  active ? "bg-accent text-accent-fg" : "text-muted hover:bg-panel hover:text-fg",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocale(loc)}
                aria-pressed={locale === loc}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium uppercase transition",
                  locale === loc ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {loc}
              </button>
            ))}
          </div>
          <span className="hidden text-xs text-muted sm:inline">{m.poweredBy}</span>
        </div>
      </div>
    </header>
  );
}
