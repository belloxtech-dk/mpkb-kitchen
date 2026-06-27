/**
 * Smart model router — Ollama first (free), Claude only for critical escalations.
 *
 * COST ORDER:
 *   Ollama (qwen2.5vl:7b) → FREE  (local vision)
 *   Gemini Flash          → ~$0.01/1K (fallback)
 *   Claude Sonnet         → ~$3/1K    (ONLY critical violations)
 */

import Anthropic from "@anthropic-ai/sdk";

const OLLAMA_BASE   = process.env.OLLAMA_BASE_URL  ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL  = process.env.OLLAMA_MODEL     ?? "qwen2.5vl:7b";
const GEMINI_KEY    = process.env.GEMINI_API_KEY   ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const HAS_GEMINI    = Boolean(GEMINI_KEY    && !["", "dummy"].includes(GEMINI_KEY));
const HAS_ANTHROPIC = Boolean(ANTHROPIC_KEY && !["", "dummy"].includes(ANTHROPIC_KEY));

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

export function pickModel(tier: TaskTier): ModelChoice {
  switch (tier) {
    case "free":
    case "cheap":
    case "quality":
      // Always try Ollama first — it's free and runs locally
      return ollamaClient();

    case "critical":
      // Critical violations only — Claude as last resort
      if (HAS_GEMINI)    return geminiClient(false);
      if (HAS_ANTHROPIC) return anthropicClient();
      return ollamaClient();
  }
}

export const TASK_TIERS: Record<string, TaskTier> = {
  food_count:        "free",     // Ollama
  presence_check:    "free",     // Ollama
  food_quality:      "free",     // Ollama
  quantity_estimate: "free",     // Ollama
  receipt_ocr:       "free",     // Ollama
  sop_audit:         "free",     // Ollama — was "quality" = $$$
  finance_analysis:  "cheap",    // Ollama
  report_generation: "cheap",    // Ollama
  full_audit:        "critical", // Claude only for critical escalations
};

export function getModelForTask(task: keyof typeof TASK_TIERS): ModelChoice {
  return pickModel(TASK_TIERS[task] ?? "free");
}

export async function getModel(): Promise<string> {
  return pickModel("free").model;
}

export type TaskComplexity = "simple" | "medium" | "heavy";
export function pickModelByComplexity(c: TaskComplexity): ModelChoice {
  return pickModel(c === "heavy" ? "critical" : "free");
}
