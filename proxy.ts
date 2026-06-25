import { NextResponse, type NextRequest } from "next/server";

// Auth bypassed for demo — all routes open
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/books", "/ledger", "/admin", "/superadmin", "/landing"],
};
