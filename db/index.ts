import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { dbFileName } from "@/lib/config";
import * as schema from "./schema";

/**
 * The DB abstraction layer's single connection. Everything goes through `db`
 * (and the helpers in db/repo.ts) — never construct another connection.
 */

const sqlite = new Database(dbFileName);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
export type DB = typeof db;
