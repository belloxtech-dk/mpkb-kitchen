import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, getModel } from "@/lib/anthropic";
import { formatIdr } from "@/lib/format";
import {
  FinanceAssessmentSchema,
  financeAssessmentJsonSchema,
  type FinanceAssessment,
  type ProcurementScenario,
} from "@/schemas/finance";
import type { ReconciliationResult } from "./reconcile";

const TOOL_NAME = "report_audit";

export const AUDIT_SYSTEM_PROMPT = `You are a forensic auditor reviewing one day of procurement and meal records for an Indonesian school-meal (MBG) kitchen. A deterministic engine has ALREADY computed the exact figures and flagged candidate irregularities.

Do NOT recompute anything — trust the provided numbers. Instead:
1. First, narrate what the books show in 2-4 short sentences, in plain language a non-accountant official could follow, referencing the concrete figures you were given.
2. Then call the ${TOOL_NAME} tool: for EACH computed finding you were given, return a judgement with a severity, a short explanation of why it matters (grounded in the numbers), and a concrete recommended action. Also give an overall risk level and a one-line summary.

Severity guidance: ghost meals and duplicate payments are typically high; sustained markup and supplier concentration are medium-to-high; threshold-gaming is medium but a clear red flag for intent. If there are no findings, say the day looks clean and return an empty findings list with low overall risk.`;

export const REPORT_AUDIT_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Report the structured financial-integrity assessment for the day.",
  input_schema: financeAssessmentJsonSchema() as Anthropic.Tool.InputSchema,
};

function factsBlock(scenario: ProcurementScenario, reconciliation: ReconciliationResult): string {
  const lines: string[] = [
    `Kitchen: ${scenario.kitchen}`,
    `Date: ${scenario.dateIso}`,
    `Meals — enrolled ${scenario.meals.enrolled}, present ${scenario.meals.present}, served ${scenario.meals.mealsServed}, billed ${scenario.meals.mealsBilled}.`,
    `Total computed leakage: ${formatIdr(reconciliation.totalLeakageIdr)}.`,
    "",
  ];

  if (reconciliation.findings.length === 0) {
    lines.push("Computed findings: NONE. The day appears clean.");
  } else {
    lines.push("Computed findings (already verified by the engine — do not recompute):");
    for (const f of reconciliation.findings) {
      const tag = f.leakageIdr > 0 ? `leakage ${formatIdr(f.leakageIdr)}` : "risk flag (no direct leakage)";
      lines.push(`- [${f.kind}] ${f.title} — ${tag}`);
      for (const e of f.evidence) lines.push(`    · ${e.label}: ${e.value}`);
    }
  }
  return lines.join("\n");
}

export interface AuditParams {
  scenario: ProcurementScenario;
  reconciliation: ReconciliationResult;
}

export function createAuditStream({ scenario, reconciliation }: AuditParams) {
  return getAnthropic().messages.stream({
    model: getModel(),
    max_tokens: 1800,
    system: AUDIT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Review these books, then call ${TOOL_NAME}.\n\n${factsBlock(scenario, reconciliation)}`,
      },
    ],
    tools: [REPORT_AUDIT_TOOL],
  });
}

export function extractAssessment(message: Anthropic.Message): FinanceAssessment {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!block) throw new Error("The model did not return a structured assessment.");
  return FinanceAssessmentSchema.parse(block.input);
}
