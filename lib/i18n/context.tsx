"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./locale";
import { messagesFor, type Messages } from "./dictionary";

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale: initial, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      setLocaleState(next);
      router.refresh(); // re-run server components (page titles, <html lang>) with the new cookie
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, messages: messagesFor(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

export function useMessages(): Messages {
  return useI18n().messages;
}

export function useSetLocale(): (locale: Locale) => void {
  return useI18n().setLocale;
}
