import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./auth-schema";

/** Read-only user listing for the admin section. */

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  banned: boolean;
  createdAt: number; // epoch ms
  lastSignInAt: number | null;
  signInCount: number;
}

export async function listUsers(): Promise<UserListItem[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      signInCount: user.signInCount,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role ?? "user",
    emailVerified: r.emailVerified,
    banned: r.banned ?? false,
    createdAt: r.createdAt.getTime(),
    lastSignInAt: r.lastSignInAt ? r.lastSignInAt.getTime() : null,
    signInCount: r.signInCount,
  }));
}

/** Minimal lookup used to enforce revoke policy (not a superadmin, not yourself). */
export async function getUserBrief(userId: string): Promise<{ id: string; role: string; banned: boolean } | null> {
  const [row] = await db
    .select({ id: user.id, role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) return null;
  return { id: row.id, role: row.role ?? "user", banned: row.banned ?? false };
}
