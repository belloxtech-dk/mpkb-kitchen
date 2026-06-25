import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/locale";

/**
 * Sets the locale cookie and redirects back to where the user came from.
 * Target locale comes from the `locale` query param (GET, used by the header
 * switcher links) or a form/JSON body (POST). The redirect is always resolved
 * to a same-origin absolute URL so it can't be used as an open redirect and so
 * NextResponse.redirect never receives a bare path.
 */

const ONE_YEAR = 60 * 60 * 24 * 365;

function safeRedirectUrl(req: NextRequest, raw: string | null): URL {
  const origin = req.nextUrl.origin;
  if (raw) {
    try {
      // Resolve against origin; same-origin absolute paths and full URLs both work.
      const u = new URL(raw, origin);
      if (u.origin === origin) return u;
    } catch {
      /* fall through to default */
    }
  }
  return new URL("/", origin);
}

function applyLocale(req: NextRequest, locale: string | null, redirectTo: string | null) {
  const resolved = resolveLocale(locale);
  const dest = safeRedirectUrl(req, redirectTo ?? req.headers.get("referer"));
  const res = NextResponse.redirect(dest, { status: 303 });
  res.cookies.set(LOCALE_COOKIE, resolved, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  return res;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return applyLocale(req, params.get("locale"), params.get("redirect"));
}

export async function POST(req: NextRequest) {
  let locale: string | null = null;
  let redirectTo: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    locale = typeof body.locale === "string" ? body.locale : null;
    redirectTo = typeof body.redirect === "string" ? body.redirect : null;
  } else {
    const form = await req.formData().catch(() => null);
    if (form) {
      const l = form.get("locale");
      const r = form.get("redirect");
      locale = typeof l === "string" ? l : null;
      redirectTo = typeof r === "string" ? r : null;
    }
  }

  return applyLocale(req, locale, redirectTo);
}
