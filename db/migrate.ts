/**
 * Standalone migration runner (run via `pnpm db:migrate`).
 * Self-contained on purpose — no `@/` alias imports — so it runs cleanly under tsx.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/mpkb_kitchen";

async function main() {
  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
  await pool.end();
  console.log(`✓ migrations applied to ${url.replace(/:\/\/.*@/, "://***@")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
