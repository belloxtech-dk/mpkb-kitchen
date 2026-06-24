"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/auth/permissions";

/** Browser auth client. Email + password login. Admin roles. */
export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles })],
});

export const { signIn, signOut, useSession } = authClient;
