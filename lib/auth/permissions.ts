import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Better Auth access control. superadmin + admin both get the admin plugin's
 * management permissions (so they can invite/manage users); user gets none.
 * Shared by the server auth instance and the client (adminClient).
 */

const statement = { ...defaultStatements } as const;

export const ac = createAccessControl(statement);

export const roles = {
  user: ac.newRole({}),
  admin: ac.newRole({ ...adminAc.statements }),
  superadmin: ac.newRole({ ...adminAc.statements }),
};
