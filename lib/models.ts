import { z } from "zod";

/** SSOT for the selectable Claude models (Sonnet for dev/cost, Opus for the demo). */

export const MODELS = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", short: "Sonnet" },
  { id: "claude-opus-4-8", label: "Opus 4.8", short: "Opus" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const MODEL_IDS = MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];
export const ModelIdSchema = z.enum(MODEL_IDS);

export const DEFAULT_MODEL: ModelId = "claude-sonnet-4-6";

/** Key under which the active model is stored in app_settings. */
export const MODEL_SETTING_KEY = "anthropic_model";

const BY_ID = new Map(MODELS.map((m) => [m.id, m]));

export function modelShort(id: string): string {
  return BY_ID.get(id as ModelId)?.short ?? id;
}
