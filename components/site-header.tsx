"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Floor", hint: "Kitchen SOP" },
  { href: "/books", label: "Books", hint: "Financial integrity" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight">MPKB · Kitchen Integrity</span>
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
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

        <div className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
          <span className="size-1.5 rounded-full bg-pass" />
          Powered by Claude
        </div>
      </div>
    </header>
  );
}
