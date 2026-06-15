import { z } from "zod";
import { SeveritySchema } from "@/schemas/verdict";

/** SSOT for the financial-integrity domain: scenario input + AI assessment output. */

export const FindingKindSchema = z.enum([
  "ghost_meals",
  "price_markup",
  "duplicate_invoice",
  "threshold_gaming",
  "supplier_concentration",
]);
export type FindingKind = z.infer<typeof FindingKindSchema>;

export const LineItemSchema = z.object({
  item: z.string(),
  supplier: z.string(),
  qty: z.number(),
  unit: z.string(),
  unitPriceIdr: z.number(),
  referencePriceIdr: z.number(),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  supplier: z.string(),
  dateIso: z.string(),
  amountIdr: z.number(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const MealCountSchema = z.object({
  enrolled: z.number(),
  present: z.number(),
  mealsServed: z.number(),
  mealsBilled: z.number(),
});
export type MealCount = z.infer<typeof MealCountSchema>;

export const SupplierAwardSchema = z.object({
  supplier: z.string(),
  awards: z.number(),
});
export type SupplierAward = z.infer<typeof SupplierAwardSchema>;

export const ProcurementScenarioSchema = z.object({
  id: z.string(),
  label: z.string(),
  labelId: z.string(),
  dateIso: z.string(),
  kitchen: z.string(),
  meals: MealCountSchema,
  costPerPortionIdr: z.number(),
  approvalThresholdIdr: z.number(),
  lineItems: z.array(LineItemSchema),
  invoices: z.array(InvoiceSchema),
  awards: z.array(SupplierAwardSchema),
});
export type ProcurementScenario = z.infer<typeof ProcurementScenarioSchema>;

/** Claude's judgement of the computed facts (model tool output). */
export const AssessedFindingSchema = z.object({
  kind: FindingKindSchema,
  severity: SeveritySchema,
  explanation: z.string().describe("Plain-language explanation of why this matters, grounded in the numbers."),
  recommendedAction: z.string().describe("The concrete next step for an auditor or the kitchen."),
});
export type AssessedFinding = z.infer<typeof AssessedFindingSchema>;

export const OverallRiskSchema = z.enum(["low", "medium", "high", "critical"]);
export type OverallRisk = z.infer<typeof OverallRiskSchema>;

export const FinanceAssessmentSchema = z.object({
  summary: z.string().describe("One-line plain-language summary of the books for this day."),
  overallRisk: OverallRiskSchema,
  findings: z.array(AssessedFindingSchema).describe("One judgement per computed finding you were given."),
});
export type FinanceAssessment = z.infer<typeof FinanceAssessmentSchema>;

export function financeAssessmentJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(FinanceAssessmentSchema) as Record<string, unknown>;
  delete schema["$schema"];
  return schema;
}
