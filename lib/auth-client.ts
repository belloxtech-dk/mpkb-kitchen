"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/auth/permissions";

/** Browser auth client. Mirrors the server plugins (magic link + admin roles). */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), adminClient({ ac, roles })],
});

export const { signIn, signOut, useSession } = authClient;
