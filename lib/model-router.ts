/**
 * Smart model router — Gemini first, Ollama fallback, Sonnet only when critical.
 *
 * COST ORDER (cheapest → most expensive):
 *   Ollama (qwen2.5vl:7b) → FREE  (local, vision capable)
 *   Gemini Flash 2.0      → ~$0.01/1K tokens (vision, fast)
 *   Gemini Pro 1.5        → ~$0.07/1K tokens (better reasoning)
 *   Claude Sonnet         → ~$3/1K tokens    (ONLY for critical tasks)
 *
 * Default: Gemini Flash for almost everything.
 */

import Anthropic from "@anthropic-ai/sdk";

const OLLAMA_BASE  = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL    ?? "qwen2.5vl:7b";
const GEMINI_KEY   = process.env.GEMINI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const HAS_GEMINI    = Boolean(GEMINI_KEY && !["", "dummy"].includes(GEMINI_KEY));
const HAS_ANTHROPIC = Boolean(ANTHROPIC_KEY && !["", "dummy"].includes(ANTHROPIC_KEY));
const HAS_OLLAMA    = process.platform === "darwin"; // local only

export type TaskTier = "free" | "cheap" | "quality" | "critical";

export interface ModelChoice {
  provider: "ollama" | "gemini" | "anthropic";
  model: string;
  client: Anthropic;
  label: string;
}

function ollamaClient(): ModelChoice {
  return {
    provider: "ollama", model: OLLAMA_MODEL, label: `Ollama/${OLLAMA_MODEL}`,
    client: new Anthropic({ apiKey: "ollama", baseURL: `${OLLAMA_BASE}/v1` }),
  };
}

function geminiClient(flash = true): ModelChoice {
  const model = flash ? "gemini-2.0-flash" : "gemini-1.5-pro";
  return {
    provider: "gemini", model, label: `Gemini/${model}`,
    client: new Anthropic({
      apiKey: GEMINI_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    }),
  };
}

function anthropicClient(): ModelChoice {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  return {
    provider: "anthropic", model, label: `Claude/${model}`,
    client: new Anthropic({ apiKey: ANTHROPIC_KEY }),
  };
}

/**
 * Pick cheapest capable model for the tier.
 *
 * free     → Ollama (local) or Gemini Flash
 * cheap    → Gemini Flash
 * quality  → Gemini Flash (good enough for most vision)
 * critical → Gemini Pro, fallback Sonnet only if no Gemini
 */
export function pickModel(tier: TaskTier): ModelChoice {
  switch (tier) {
    case "free":
      if (HAS_OLLAMA) return ollamaClient();
      if (HAS_GEMINI) return geminiClient(true);
      return ollamaClient(); // best-effort

    case "cheap":
    case "quality":   // Gemini Flash handles vision well
      if (HAS_GEMINI) return geminiClient(true);
      if (HAS_OLLAMA) return ollamaClient();
      if (HAS_ANTHROPIC) return anthropicClient();
      return ollamaClient();

    case "critical":  // Only for final SOP audit reports
      if (HAS_GEMINI) return geminiClient(false); // Gemini Pro
      if (HAS_ANTHROPIC) return anthropicClient(); // Last resort
      if (HAS_OLLAMA) return ollamaClient();
      return ollamaClient();
  }
}

// Task → tier mapping (keep Sonnet out unless truly needed)
export const TASK_TIERS: Record<string, TaskTier> = {
  food_count:        "free",     // Ollama: count numbers
  presence_check:    "free",     // Ollama: is person there?
  food_quality:      "cheap",    // Gemini Flash: vision
  quantity_estimate: "cheap",    // Gemini Flash: vision
  receipt_ocr:       "cheap",    // Gemini Flash: OCR
  sop_audit:         "quality",  // Gemini Flash: SOP check
  finance_analysis:  "quality",  // Gemini Flash: math/text
  report_generation: "quality",  // Gemini Flash: writing
  full_audit:        "critical", // Gemini Pro: deep reasoning
};

export function getModelForTask(task: keyof typeof TASK_TIERS): ModelChoice {
  return pickModel(TASK_TIERS[task] ?? "cheap");
}

// Compatibility shim for old code that calls getModel()
export async function getModel(): Promise<string> {
  return pickModel("quality").model;
}

export type TaskComplexity = "simple" | "medium" | "heavy";
export function pickModelByComplexity(c: TaskComplexity): ModelChoice {
  return pickModel(c === "simple" ? "free" : c === "medium" ? "cheap" : "quality");
}
