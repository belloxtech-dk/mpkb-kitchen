import type { Locale } from "./locale";
import { messagesFor, type Messages } from "./dictionary";

/**
 * Server-side locale. The app is Indonesian-only (the EN toggle was removed because
 * newer pages — receipts, kitchens, gov, alerts, reports — are authored only in
 * Bahasa Indonesia). Everything renders in "id" for consistency.
 */

export async function getServerLocale(): Promise<Locale> {
  return "id";
}

export async function getServerMessages(): Promise<Messages> {
  return messagesFor(await getServerLocale());
}
