/**
 * Standalone migration runner (run via `pnpm db:migrate`).
 * Self-contained on purpose — no `@/` alias imports — so it runs cleanly under tsx.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const dbFileName = process.env.DB_FILE_NAME ?? "./mpkb.db";

const sqlite = new Database(dbFileName);
sqlite.pragma("journal_mode = WAL");

migrate(drizzle(sqlite), { migrationsFolder: "./db/migrations" });
sqlite.close();

console.log(`✓ migrations applied to ${dbFileName}`);
