import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, getModel } from "./anthropic";
import { getSopRule, SOP_RULES } from "./sop";
import type { KitchenAlert } from "./events";
import type { ImageMediaType } from "@/schemas/analyze";
import { VerdictSchema, verdictJsonSchema, type Verdict } from "@/schemas/verdict";

const TOOL_NAME = "report_verdict";

const ruleList = SOP_RULES.map(
  (r) => `- ${r.id} (${r.label}, ${r.criticality}): ${r.description}`,
).join("\n");

export const VISION_SYSTEM_PROMPT = `You are a meticulous food-safety inspector reviewing a single still frame from a kitchen CCTV camera in a school-meal preparation facility in Indonesia.

Evaluate the frame against these SOP rules:
${ruleList}

Respond in this exact order:
1. First, narrate what you actually see in 2-4 short sentences — people, hands, food, surfaces, and any hygiene-relevant detail. Ground every claim in visible evidence; never invent what you cannot see.
2. Then call the ${TOOL_NAME} tool with your structured findings.

Calibration:
- Only judge rules you can actually assess from this frame. If a rule is not observable, omit it from checks — do not guess "pass".
- Use status "warn" (not "fail") when something is partially visible, occluded, or ambiguous, and lower your confidence.
- Reserve "fail" for clear, visible violations, and high severity for critical rules (gloves, handwashing, cross_contamination, food_storage).
- Be fair: a frame may be fully compliant — say so when it is.`;

export const REPORT_VERDICT_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Report the structured SOP compliance verdict for the inspected kitchen frame.",
  input_schema: verdictJsonSchema() as Anthropic.Tool.InputSchema,
};

export interface VisionParams {
  imageBase64: string;
  mediaType: ImageMediaType;
  zone: string;
}

/** Start a streaming vision analysis. Emits text deltas, then a tool_use verdict. */
export function createVisionStream(params: VisionParams) {
  return getAnthropic().messages.stream({
    model: getModel(),
    max_tokens: 1600,
    system: VISION_SYSTEM_PROMPT,
    tools: [REPORT_VERDICT_TOOL],
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: params.mediaType, data: params.imageBase64 } },
          { type: "text", text: `Camera: ${params.zone}. Inspect this frame now — narrate what you see, then call ${TOOL_NAME}.` },
        ],
      },
    ],
  });
}

/** Pull the validated structured verdict out of the model's final message. */
export function extractVerdict(message: Anthropic.Message): Verdict {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!block) throw new Error("The model did not return a structured verdict.");
  return VerdictSchema.parse(block.input);
}

/** Derive a phone alert from the highest-severity violation, if any warrants one. */
export function deriveAlert(zone: string, verdict: Verdict): KitchenAlert | null {
  const trigger =
    verdict.violations.find((v) => v.severity === "high") ??
    (verdict.overallStatus === "fail" ? verdict.violations[0] : undefined);
  if (!trigger) return null;

  const rule = getSopRule(trigger.ruleId);
  const labelId = rule?.labelId ?? trigger.ruleId;
  return {
    zone,
    title: `${rule?.label ?? trigger.ruleId} — ${zone}`,
    messageId: `⚠️ ${zone}: ${labelId} bermasalah. ${trigger.detail} Tindakan: ${trigger.recommendedAction}`,
    severity: trigger.severity,
    delivered: false,
  };
}
