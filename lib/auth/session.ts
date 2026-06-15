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

export async function getAppSession(): Promise<AppSession | null> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result?.user) return null;
  const u = result.user as { id: string; email: string; name: string; role?: string | null };
  return { userId: u.id, email: u.email, name: u.name, role: asRole(u.role) };
}
