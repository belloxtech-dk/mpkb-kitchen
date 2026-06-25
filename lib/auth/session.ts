import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { asRole, type Role } from "./roles";

/** Server-side session accessor with our normalized role. Use in server components / route handlers. */

export interface AppSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

// Demo mode: auth bypassed — always returns a valid session
export async function getAppSession(): Promise<AppSession> {
  return { userId: "demo", email: "demo@mbg.id", name: "Andrea", role: asRole("admin") };
}

/** Throws a 401 response if not authenticated — use in API route handlers. */
export async function requireAuth(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  return session;
}
// deploy 1782390979
