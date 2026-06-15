import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth gate (cookie presence only — the (authed) layout does the real
 * server-side session check). Unauthenticated users are sent to /landing; signed-in
 * users visiting /landing are sent into the app. (Next 16 `proxy` convention.)
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(getSessionCookie(request));
  const isLanding = request.nextUrl.pathname === "/landing";

  if (!hasSession && !isLanding) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }
  if (hasSession && isLanding) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/books", "/ledger", "/admin", "/superadmin", "/landing"],
};
