import { z } from "zod";

/** SSOT for supported locales. Indonesian is the default. */

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "mpkb_locale";

export const LocaleSchema = z.enum(LOCALES);

export const LOCALE_LABEL: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
