"use client";

import { cn } from "@/lib/cn";
import { LOCALES } from "@/lib/i18n/locale";
import { useLocale, useSetLocale } from "@/lib/i18n/context";

/** ID/EN segmented toggle. Shared by the header and the landing page. */
export function LocaleToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
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
  );
}
