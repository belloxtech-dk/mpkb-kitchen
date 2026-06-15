import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./locale";
import { messagesFor, type Messages } from "./dictionary";

/** Server-side locale resolution from the cookie (for layout + page titles). */

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getServerMessages(): Promise<Messages> {
  return messagesFor(await getServerLocale());
}
