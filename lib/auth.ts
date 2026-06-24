import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/auth-schema";
import { ac, roles } from "@/lib/auth/permissions";

const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3786";

/** Trust both the apex and www variants of the configured base URL (port preserved). */
function buildTrustedOrigins(base: string): string[] {
  try {
    const u = new URL(base);
    const apexHost = u.host.replace(/^www\./, "");
    return [`${u.protocol}//${apexHost}`, `${u.protocol}//www.${apexHost}`];
  } catch {
    return [base];
  }
}

/**
 * Server auth instance. Simple email + password login.
 * Sign-up is disabled — accounts are pre-seeded only.
 * Roles: superadmin / admin / user via the admin plugin.
 */
export const auth = betterAuth({
  baseURL: BASE_URL,
  trustedOrigins: buildTrustedOrigins(BASE_URL),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // accounts are pre-seeded; no self-registration
    autoSignIn: true,
  },
  databaseHooks: {
    session: {
      create: {
        after: async (createdSession) => {
          try {
            await db
              .update(user)
              .set({ lastSignInAt: new Date(), signInCount: sql`${user.signInCount} + 1` })
              .where(eq(user.id, createdSession.userId));
          } catch (err) {
            console.error("[auth] sign-in metric update failed:", err);
          }
        },
      },
    },
  },
  plugins: [
    adminPlugin({
      ac,
      roles,
      adminRoles: ["admin", "superadmin"],
      defaultRole: "user",
    }),
    nextCookies(), // must be last
  ],
});
