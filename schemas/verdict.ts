import { z } from "zod";
import { SOP_RULE_IDS } from "@/lib/sop";

/**
 * SSOT for the SOP analysis verdict. Types are inferred from these Zod schemas
 * (never hand-written separately), and the same schema is converted to the
 * Anthropic tool input_schema so the model is constrained to our shape.
 */

export const SopStatusSchema = z.enum(["pass", "fail", "warn"]);
export type SopStatus = z.infer<typeof SopStatusSchema>;

export const SeveritySchema = z.enum(["low", "medium", "high"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const SopCheckResultSchema = z.object({
  id: z.enum(SOP_RULE_IDS).describe("The SOP rule id this result is for."),
  status: SopStatusSchema.describe("pass = compliant, fail = clear violation, warn = uncertain/occluded."),
  confidence: z.number().min(0).max(1).describe("Your calibrated confidence in this judgement (0-1)."),
  note: z.string().describe("One short sentence of visual evidence for this judgement."),
});
export type SopCheckResult = z.infer<typeof SopCheckResultSchema>;

export const ViolationSchema = z.object({
  ruleId: z.enum(SOP_RULE_IDS).describe("The SOP rule id that was violated."),
  severity: SeveritySchema,
  detail: z.string().describe("What exactly is wrong, grounded in what is visible."),
  recommendedAction: z.string().describe("The concrete corrective action for kitchen staff."),
});
export type Violation = z.infer<typeof ViolationSchema>;

export const VerdictSchema = z.object({
  summary: z.string().describe("One-line plain-language summary of the kitchen state in this frame."),
  checks: z.array(SopCheckResultSchema).describe("One result per SOP rule you can assess from the frame."),
  violations: z.array(ViolationSchema).describe("Active violations needing attention (may be empty)."),
  overallStatus: SopStatusSchema,
  complianceScore: z.number().min(0).max(100).describe("Overall SOP compliance score for this frame, 0-100."),
});
export type Verdict = z.infer<typeof VerdictSchema>;

/** JSON Schema for the Anthropic tool input (derived from the Zod SSOT). */
export function verdictJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(VerdictSchema) as Record<string, unknown>;
  delete schema["$schema"];
  return schema;
}
