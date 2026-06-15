import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { databaseUrl } from "@/lib/config";
import * as schema from "./schema";

/**
 * The DB abstraction layer's single pooled connection. Everything goes through
 * `db` (and the helpers in db/repo.ts) — never construct another pool.
 */

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
export { schema };
export type DB = typeof db;
