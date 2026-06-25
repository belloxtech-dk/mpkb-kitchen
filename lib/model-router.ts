/**
 * Smart model router — optimizes API credits by routing tasks to the cheapest
 * capable model:
 *
 *   SIMPLE   → Ollama (qwen2.5vl:7b) — FREE, local, fast
 *   MEDIUM   → Gemini Flash 2.0      — cheap, fast, good vision
 *   HEAVY    → Claude Sonnet 4.6     — best reasoning, costs most
 *
 * Falls back down the chain if a provider is unavailable.
 */

import Anthropic from "@anthropic-ai/sdk";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const HAS_GEMINI = Boolean(GEMINI_KEY && GEMINI_KEY !== "dummy");
const HAS_ANTHROPIC = Boolean(ANTHROPIC_KEY && ANTHROPIC_KEY !== "dummy");

export type TaskComplexity = "simple" | "medium" | "heavy";

export interface ModelChoice {
  provider: "ollama" | "gemini" | "anthropic";
  model: string;
  client: Anthropic;
}

/** Pick the best model for the task complexity. */
export function pickModel(complexity: TaskComplexity): ModelChoice {
  if (complexity === "simple") {
    // Always use local Ollama — free
    return {
      provider: "ollama",
      model: OLLAMA_MODEL,
      client: new Anthropic({ apiKey: "ollama", baseURL: `${OLLAMA_BASE}/v1` }),
    };
  }

  if (complexity === "medium") {
    if (HAS_GEMINI) {
      // Gemini Flash via OpenAI-compatible endpoint
      return {
        provider: "gemini",
        model: "gemini-2.0-flash",
        client: new Anthropic({
          apiKey: GEMINI_KEY,
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
        }),
      };
    }
    // Fallback to Ollama if no Gemini key
    return {
      provider: "ollama",
      model: OLLAMA_MODEL,
      client: new Anthropic({ apiKey: "ollama", baseURL: `${OLLAMA_BASE}/v1` }),
    };
  }

  // Heavy — Claude Sonnet
  if (HAS_ANTHROPIC) {
    return {
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      client: new Anthropic({ apiKey: ANTHROPIC_KEY }),
    };
  }

  // Fallback chain: Gemini → Ollama
  if (HAS_GEMINI) {
    return {
      provider: "gemini",
      model: "gemini-2.0-flash",
      client: new Anthropic({
        apiKey: GEMINI_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      }),
    };
  }

  return {
    provider: "ollama",
    model: OLLAMA_MODEL,
    client: new Anthropic({ apiKey: "ollama", baseURL: `${OLLAMA_BASE}/v1` }),
  };
}

/**
 * Task complexity guide:
 *
 * SIMPLE  (Ollama/free):
 *   - Food counting (number recognition)
 *   - Camera status checks
 *   - Basic presence detection (is person wearing gloves?)
 *
 * MEDIUM  (Gemini Flash):
 *   - Food quality assessment (color, freshness, presentation)
 *   - Quantity estimation with context
 *   - Multi-item scene description
 *   - Receipt OCR + basic parsing
 *
 * HEAVY   (Claude Sonnet):
 *   - Full SOP compliance audit with citations
 *   - Financial fraud analysis
 *   - Complex reasoning + regulatory cross-reference
 *   - Final report generation with recommendations
 */
export const TASK_COMPLEXITY: Record<string, TaskComplexity> = {
  food_count:        "simple",
  presence_check:    "simple",
  food_quality:      "medium",
  quantity_estimate: "medium",
  receipt_ocr:       "medium",
  sop_audit:         "heavy",
  finance_analysis:  "heavy",
  report_generation: "heavy",
};

export function getModelForTask(task: keyof typeof TASK_COMPLEXITY): ModelChoice {
  return pickModel(TASK_COMPLEXITY[task] ?? "medium");
}
