import { z } from "zod";

/**
 * SSOT for runtime configuration.
 *
 * Split into two concerns so DB tooling (drizzle-kit, migrate, seed) never
 * needs the Anthropic key:
 *  - `databaseUrl` — always available, safe default.
 *  - `getEnv()`    — full, validated server env; lazy + memoized so it only
 *                    throws when a feature that needs it (vision, telegram) runs.
 */

/** Postgres connection string. Read directly so DB tooling never needs the Anthropic key. */
export const databaseUrl = process.env.DATABASE_URL ?? "postgresql://localhost:5432/mpkb_kitchen";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is missing — add it to .env.local"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-6"),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_CHAT_ID: z.string().default(""),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function telegramEnabled(): boolean {
  const env = getEnv();
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
}
