import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/auth-schema";
import { ac, roles } from "@/lib/auth/permissions";
import { sendMagicLinkEmail } from "@/lib/auth/email";

/**
 * Server auth instance. Invite-only (magic link with disableSignUp; no password
 * sign-up). Roles: superadmin / admin / user via the admin plugin.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3786",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      // invite-only: a link only ever signs in an EXISTING (invited) user.
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
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
