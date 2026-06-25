import { asRole, type Role } from "./roles";

/** Server-side session accessor — auth bypassed for demo. */

export interface AppSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

// Demo mode: always returns admin session, no DB/auth calls
export async function getAppSession(): Promise<AppSession> {
  return { userId: "demo", email: "demo@mbg.id", name: "Andrea", role: asRole("admin") };
}

export async function requireAuth(): Promise<AppSession> {
  return getAppSession();
}
