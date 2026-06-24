"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Camera, BookOpen, Shield, Bell } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/",       label: "Home",      icon: LayoutDashboard },
  { href: "/floor",  label: "CCTV",      icon: Camera },
  { href: "/books",  label: "Keuangan",  icon: BookOpen },
  { href: "/alerts", label: "Alert",     icon: Bell },
  { href: "/ledger", label: "Ledger",    icon: Shield },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-xl sm:hidden">
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted hover:text-fg",
              )}
            >
              <Icon className={cn("size-5", active && "drop-shadow-[0_0_6px_var(--color-accent)]")} />
              {tab.label}
              {active && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
