import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./locale";
import { messagesFor, type Messages } from "./dictionary";

/** Server-side locale — reads from cookie, defaults to "en". */
export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies();
  return resolveLocale(jar.get(LOCALE_COOKIE)?.value ?? "en");
}

export async function getServerMessages(): Promise<Messages> {
  return messagesFor(await getServerLocale());
}
