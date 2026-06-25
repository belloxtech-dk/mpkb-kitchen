/**
 * Primary AI client — Gemini Flash by default (cheap + fast).
 * Falls back: Gemini → Ollama → Anthropic.
 *
 * Cost optimization: Gemini Flash is ~300x cheaper than Claude Sonnet.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getSetting } from "@/db/settings";
import { DEFAULT_MODEL, MODEL_SETTING_KEY } from "@/lib/models";

const GEMINI_KEY    = process.env.GEMINI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const OLLAMA_BASE   = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL  = process.env.OLLAMA_MODEL    ?? "qwen2.5vl:7b";

const USE_GEMINI    = Boolean(GEMINI_KEY && !["", "dummy"].includes(GEMINI_KEY));
const USE_ANTHROPIC = Boolean(ANTHROPIC_KEY && !["", "dummy"].includes(ANTHROPIC_KEY));
const USE_OLLAMA    = !USE_GEMINI && !USE_ANTHROPIC;

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;

  if (USE_GEMINI) {
    _client = new Anthropic({
      apiKey: GEMINI_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    });
  } else if (USE_ANTHROPIC) {
    _client = new Anthropic({ apiKey: ANTHROPIC_KEY });
  } else {
    // Ollama local fallback
    _client = new Anthropic({ apiKey: "ollama", baseURL: `${OLLAMA_BASE}/v1` });
  }
  return _client;
}

export async function getModel(): Promise<string> {
  if (USE_GEMINI) return "gemini-2.0-flash";
  if (USE_ANTHROPIC) {
    const stored = await getSetting(MODEL_SETTING_KEY).catch(() => null);
    return stored ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  }
  return OLLAMA_MODEL;
}
