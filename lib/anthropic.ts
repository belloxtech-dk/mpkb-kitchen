import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "./config";
import { getSetting } from "@/db/settings";
import { DEFAULT_MODEL, MODEL_SETTING_KEY } from "@/lib/models";

let client: Anthropic | null = null;

/** Lazily-constructed Anthropic client singleton (reads the key only when first used). */
export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * The active model. Resolution order: DB setting (superadmin switcher) →
 * `ANTHROPIC_MODEL` env → default (Sonnet). Async because it reads the DB.
 */
export async function getModel(): Promise<string> {
  const stored = await getSetting(MODEL_SETTING_KEY);
  return stored ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
}
