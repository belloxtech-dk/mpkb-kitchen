import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./anthropic";
import { getSopRule, SOP_RULES } from "./sop";
import type { KitchenAlert } from "./events";
import type { ImageMediaType } from "@/schemas/analyze";
import { VerdictSchema, verdictJsonSchema, type Verdict } from "@/schemas/verdict";
import type { Locale } from "@/lib/i18n/locale";
import { messagesFor } from "@/lib/i18n/dictionary";
import { buildVisionContext, formatVisionContext } from "./context/kitchen-context";

const TOOL_NAME = "report_verdict";

const ruleList = SOP_RULES.map(
  (r) => `- ${r.id} [${r.criticality.toUpperCase()}] (${r.label}): ${r.description}`,
).join("\n");

/**
 * Core system prompt — regulations + rules + calibration.
 * Context (history, time-of-day, zone focus) is injected per-call via buildVisionContext().
 */
const BASE_SYSTEM_PROMPT = `You are an elite food-safety inspector embedded in Indonesia's MBG (Makan Bergizi Gratis) school-meal monitoring program. You review still frames from CCTV cameras inside SPPG kitchens and produce precise, evidence-based compliance verdicts that are used by government supervisors to take real enforcement action.

Your verdicts must be:
• ACCURATE — only judge what is clearly visible. Never hallucinate.
• ACTIONABLE — every violation must have a specific recommended action.
• CONSISTENT — apply the same standard every time; bias toward evidence over assumption.
• RESPECTFUL — workers are doing an important public-service job; flag real problems, not imagined ones.

SOP RULES TO EVALUATE (id [criticality] label: description):
${ruleList}

SCORING RUBRIC:
• 90-100: Excellent — all visible rules pass, clean environment
• 75-89: Good — minor issues only, no critical violations
• 60-74: Acceptable — some significant issues, no critical violations
• 40-59: Poor — multiple significant issues or one critical violation
• Below 40: Unacceptable — critical violations, immediate action required

CALIBRATION RULES:
1. Only evaluate rules that are ACTUALLY OBSERVABLE in this frame. Omit unobservable rules — do not default to "pass".
2. "warn" = something visible but ambiguous, partially obscured, or borderline.
3. "fail" = clear, unambiguous violation directly visible. Reserve for real problems.
4. Score CRITICAL rules (gloves, handwashing, cross_contamination) harshly — these cause foodborne illness.
5. A fully-compliant frame is valid. Score 85-100 if everything looks good. Do not invent violations.
6. For each violation: cite EXACTLY what you see (location in frame, clothing color, action observed).

RESPONSE FORMAT:
1. Narrate what you see in 2-5 sentences. Ground every claim in specific visual evidence (e.g., "The worker in the blue apron at the rear left..."). Reference location in frame, clothing, and actions.
2. Call the ${TOOL_NAME} tool with your structured verdict.`;

export const REPORT_VERDICT_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Report the structured SOP compliance verdict for the inspected MBG kitchen frame.",
  input_schema: verdictJsonSchema() as Anthropic.Tool.InputSchema,
};

export interface VisionParams {
  imageBase64: string;
  mediaType: ImageMediaType;
  zone: string;
  locale: Locale;
  model: string;
}

/**
 * Start a streaming vision analysis with full MBG domain context injected.
 * The context engine (kitchen-context.ts) enriches the prompt with:
 * - Indonesian food safety regulations (Permenkes 1096, Perpres 83/2024)
 * - Historical violation patterns for this specific zone
 * - Time-of-day operational context
 * - Zone-specific focus areas (prep vs cooking vs plating)
 */
export async function createVisionStream(params: VisionParams) {
  const directive = messagesFor(params.locale).aiDirective;

  // THE BRAIN: build rich context before calling Claude
  const context = await buildVisionContext(params.zone);
  const contextBlock = formatVisionContext(context);

  const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${contextBlock}\n\n${directive}`;

  const zoneLabel = params.zone;
  const timestamp = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  });

  return getAnthropic().messages.stream({
    model: params.model,
    max_tokens: 3500,
    system: systemPrompt,
    tools: [REPORT_VERDICT_TOOL],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: params.mediaType, data: params.imageBase64 },
          },
          {
            type: "text",
            text: `INSPEKSI CCTV — ${zoneLabel}
Waktu: ${timestamp}
Lokasi: SPPG Gamping, Yogyakarta

Narrasikan secara spesifik apa yang Anda lihat di frame ini — sebutkan posisi di frame, pakaian pekerja, tindakan yang dilakukan, dan kondisi permukaan/alat. Kemudian panggil ${TOOL_NAME} dengan verdict lengkap Anda.`,
          },
        ],
      },
    ],
  });
}

export function extractVerdict(message: Anthropic.Message): Verdict {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!block) throw new Error("The model did not return a structured verdict.");
  return VerdictSchema.parse(block.input);
}

export function deriveAlert(zone: string, verdict: Verdict, locale: Locale): KitchenAlert | null {
  const trigger =
    verdict.violations.find((v) => v.severity === "high") ??
    (verdict.overallStatus === "fail" ? verdict.violations[0] : undefined);
  if (!trigger) return null;

  const m = messagesFor(locale);
  const rule = getSopRule(trigger.ruleId);
  const ruleLabel = (locale === "id" ? rule?.labelId : rule?.label) ?? trigger.ruleId;
  return {
    zone,
    title: `${ruleLabel} — ${zone}`,
    messageId: m.alert.bodyTpl(zone, ruleLabel, trigger.detail, trigger.recommendedAction),
    severity: trigger.severity,
    delivered: false,
  };
}
