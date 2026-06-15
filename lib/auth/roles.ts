/**
 * SSOT for application roles + authorization helpers. Pure (no Better Auth
 * imports) so it's safe in client, server, and middleware.
 *
 * Hierarchy: superadmin ⊇ admin ⊇ user. Any authenticated user may use the app;
 * admin/superadmin may invite; superadmin-only areas require exactly superadmin.
 */

export const ROLES = ["user", "admin", "superadmin"] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "user";

export function asRole(value: string | null | undefined): Role {
  return value === "admin" || value === "superadmin" ? value : "user";
}

export function isAdmin(role: Role): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperadmin(role: Role): boolean {
  return role === "superadmin";
}

/** Roles a given role is allowed to assign when inviting. */
export function assignableRoles(role: Role): Role[] {
  if (role === "superadmin") return ["user", "admin"];
  if (role === "admin") return ["user"];
  return [];
}
