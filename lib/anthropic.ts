import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "./config";

let client: Anthropic | null = null;

/** Lazily-constructed Anthropic client singleton (reads the key only when first used). */
export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return client;
}

/** The configured model id. Sonnet for dev/test; swap ANTHROPIC_MODEL to an Opus id for the demo. */
export function getModel(): string {
  return getEnv().ANTHROPIC_MODEL;
}
