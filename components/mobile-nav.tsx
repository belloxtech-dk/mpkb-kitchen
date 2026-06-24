"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Camera, Receipt, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/",         label: "Home",   icon: LayoutDashboard },
  { href: "/floor",    label: "CCTV",   icon: Camera },
  { href: "/receipts", label: "Struk",  icon: Receipt },
  { href: "/alerts",   label: "Alert",  icon: Bell },
  { href: "/ledger",   label: "Ledger", icon: Shield },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-surface/95 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted hover:text-fg",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-accent" />
              )}
              <Icon className={cn("size-5", active && "drop-shadow-[0_0_6px_var(--color-accent)]")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
