import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { databaseUrl } from "@/lib/config";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

/**
 * The DB abstraction layer's single pooled connection. Everything goes through
 * `db` (and the helpers in db/repo.ts) — never construct another pool.
 * Domain tables (schema) + Better Auth tables (authSchema) share one instance.
 */

const pool = new Pool({ connectionString: databaseUrl });

const fullSchema = { ...schema, ...authSchema };

export const db = drizzle(pool, { schema: fullSchema });
export { schema, authSchema };
export type DB = typeof db;
