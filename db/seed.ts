/**
 * Idempotent superadmin bootstrap (run via `pnpm seed`).
 * Self-contained (no `@/` aliases) so it runs cleanly under tsx. Magic-link
 * sign-in only needs the user row — no password/account row required.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { user } from "./auth-schema";

const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/mpkb_kitchen";
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? "jasongalvin@gmail.com";
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME ?? "Jason Galvin";

async function main() {
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  const [existing] = await db.select().from(user).where(eq(user.email, SUPERADMIN_EMAIL)).limit(1);
  if (existing) {
    await db.update(user).set({ role: "superadmin", emailVerified: true }).where(eq(user.email, SUPERADMIN_EMAIL));
    console.log(`✓ ${SUPERADMIN_EMAIL} updated to superadmin`);
  } else {
    await db.insert(user).values({
      id: randomUUID(),
      email: SUPERADMIN_EMAIL,
      name: SUPERADMIN_NAME,
      emailVerified: true,
      role: "superadmin",
    });
    console.log(`✓ ${SUPERADMIN_EMAIL} created as superadmin`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
