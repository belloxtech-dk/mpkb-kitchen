/**
 * SSOT for the kitchen food-safety SOP rules the vision model evaluates.
 * Rule ids are referenced by the model's verdict (checks[].id, violations[].ruleId)
 * and constrained by the Zod schema, so this list is the single source of truth.
 */

export type SopCriticality = "critical" | "major" | "minor";

export interface SopRule {
  id: string;
  /** English label (demo UI). */
  label: string;
  /** Bahasa Indonesia label (for realistic alerts). */
  labelId: string;
  /** What the inspector should look for. Fed to the model. */
  description: string;
  criticality: SopCriticality;
}

export const SOP_RULES = [
  {
    id: "hairnet",
    label: "Hairnet / cap",
    labelId: "Jaring rambut / topi",
    description: "Every person handling food wears a hairnet or cap fully covering the hair.",
    criticality: "major",
  },
  {
    id: "gloves",
    label: "Gloves",
    labelId: "Sarung tangan",
    description: "Food handlers wear clean gloves when touching ready-to-eat or raw food.",
    criticality: "critical",
  },
  {
    id: "apron",
    label: "Apron",
    labelId: "Celemek",
    description: "Workers wear a clean apron over their clothing.",
    criticality: "minor",
  },
  {
    id: "handwashing",
    label: "Hand hygiene",
    labelId: "Cuci tangan",
    description: "Hands appear clean; no obvious contamination between raw handling and other tasks.",
    criticality: "critical",
  },
  {
    id: "food_storage",
    label: "Food storage",
    labelId: "Penyimpanan makanan",
    description: "Food is covered and stored off the floor; raw and cooked food kept separate.",
    criticality: "major",
  },
  {
    id: "clean_surfaces",
    label: "Clean surfaces",
    labelId: "Permukaan bersih",
    description: "Prep surfaces and floor are free of spills, debris, and standing water.",
    criticality: "major",
  },
  {
    id: "uniform",
    label: "Uniform / clothing",
    labelId: "Seragam",
    description: "Clothing is appropriate and clean; no loose sleeves or jewellery over food.",
    criticality: "minor",
  },
  {
    id: "cross_contamination",
    label: "Cross-contamination",
    labelId: "Kontaminasi silang",
    description: "No raw food contacting cooked/ready food; separate tools and boards in use.",
    criticality: "critical",
  },
] as const satisfies readonly SopRule[];

export type SopRuleId = (typeof SOP_RULES)[number]["id"];

export const SOP_RULE_IDS = SOP_RULES.map((r) => r.id) as [SopRuleId, ...SopRuleId[]];

const RULE_BY_ID = new Map<string, SopRule>(SOP_RULES.map((r) => [r.id, r]));

export function getSopRule(id: string): SopRule | undefined {
  return RULE_BY_ID.get(id);
}
