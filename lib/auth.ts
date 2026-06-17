import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/auth-schema";
import { ac, roles } from "@/lib/auth/permissions";
import { sendMagicLinkEmail } from "@/lib/auth/email";

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
 * Server auth instance. Invite-only (magic link with disableSignUp; no password
 * sign-up). Roles: superadmin / admin / user via the admin plugin.
 */
export const auth = betterAuth({
  baseURL: BASE_URL,
  trustedOrigins: buildTrustedOrigins(BASE_URL),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: false },
  databaseHooks: {
    session: {
      create: {
        // Bump the sign-in metrics on every successful sign-in (non-critical: never block auth).
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
    magicLink({
      // invite-only: a link only ever signs in an EXISTING (invited) user.
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        // Don't email strangers or revoked users: only send to an active invited account.
        // (The endpoint still returns a generic success, so it doesn't leak who's registered.)
        const [existing] = await db
          .select({ id: user.id, banned: user.banned })
          .from(user)
          .where(sql`lower(${user.email}) = ${email.toLowerCase()}`)
          .limit(1);
        if (!existing || existing.banned) return;
        await sendMagicLinkEmail(email, url);
      },
    }),
    adminPlugin({
      ac,
      roles,
      adminRoles: ["admin", "superadmin"],
      defaultRole: "user",
    }),
    nextCookies(), // must be last
  ],
});
