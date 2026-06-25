import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "./config";
import { getSetting } from "@/db/settings";
import { DEFAULT_MODEL, MODEL_SETTING_KEY } from "@/lib/models";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";
const USE_OLLAMA = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "dummy";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    client = USE_OLLAMA
      ? new Anthropic({
          apiKey: "ollama",
          baseURL: `${OLLAMA_BASE}/v1`,
        })
      : new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return client;
}

export async function getModel(): Promise<string> {
  if (USE_OLLAMA) return OLLAMA_MODEL;
  const stored = await getSetting(MODEL_SETTING_KEY);
  return stored ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
}
