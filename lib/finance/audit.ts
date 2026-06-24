import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/anthropic";
import { formatIdr } from "@/lib/format";
import { messagesFor } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import {
  FinanceAssessmentSchema,
  financeAssessmentJsonSchema,
  type FinanceAssessment,
  type ProcurementScenario,
} from "@/schemas/finance";
import type { ReconciliationResult } from "./reconcile";
import { YOGYAKARTA_MARKET_CONTEXT_2026, MBG_REGULATORY_CONTEXT } from "@/lib/context/kitchen-context";
import { PRICE_BENCHMARKS } from "./benchmarks";

const TOOL_NAME = "report_audit";

const AUDIT_SYSTEM_PROMPT = `You are a forensic auditor and anti-corruption specialist embedded in Indonesia's MBG (Makan Bergizi Gratis) school-meal program. You audit daily procurement records for SPPG kitchens in Yogyakarta and report findings to government supervisors who take real enforcement action.

MANDATE:
• Protect public funds — every irregularity you miss could mean children receive lower-quality meals.
• Be precise — your findings will be used to question suppliers and kitchen managers. Cite specific numbers.
• Be fair — honest procurement errors exist; distinguish them from deliberate manipulation.
• Speak clearly — supervisors are government officials, not accountants. Explain in plain Bahasa Indonesia.

A deterministic reconciliation engine has ALREADY computed the exact figures and flagged candidate irregularities. DO NOT recompute anything — the numbers are correct.

YOUR JOB:
1. Narrate what the books show in 3-5 sentences. Reference the concrete figures. Explain to a non-accountant WHY this is a problem, using real-world analogy if helpful (e.g., "ini seperti membeli 100 buku tapi hanya 80 yang sampai ke sekolah").
2. Call ${TOOL_NAME} tool: for EACH finding, give severity + specific explanation + concrete recommended action (WHO should do WHAT by WHEN).

SEVERITY GUIDANCE (based on Indonesian anti-corruption case law):
• ghost_meals: HIGH — direct theft of public funds. File report to BPKP if >5% of meals billed.
• duplicate_invoice: HIGH — clear double-payment fraud. Requires immediate supplier audit.
• price_markup >20%: HIGH — procurement fraud. Flag to KPK whistle-blower system.
• price_markup 10-20%: MEDIUM — possible negligence or supplier negotiation failure.
• threshold_gaming: MEDIUM — strong indicator of intentional fraud to avoid oversight. Escalate.
• supplier_concentration >70%: MEDIUM — anti-competitive. Require open tender next cycle.
• supplier_concentration 50-70%: LOW — worth monitoring, not necessarily problematic.

If there are NO findings: give an overall clean assessment. Low risk. Briefly confirm the figures look normal.`;

// Build a price reference table for the most common items in the scenario
function buildPriceReferenceBlock(scenario: ProcurementScenario): string {
  const itemsInScenario = scenario.lineItems.map((li) => li.item.toLowerCase());
  const relevant = PRICE_BENCHMARKS.filter((b) =>
    itemsInScenario.some((item) => item.includes(b.item.toLowerCase()) || b.item.toLowerCase().includes(item.split(" ")[0]!))
  ).slice(0, 10);

  if (relevant.length === 0) return "";

  const lines = ["HARGA REFERENSI PASAR YOGYAKARTA (Juni 2026):"];
  for (const b of relevant) {
    const warn = Math.round(b.referenceIdr * (1 + b.warnThresholdPct / 100));
    const fail = Math.round(b.referenceIdr * (1 + b.failThresholdPct / 100));
    lines.push(`• ${b.item}: Rp ${b.referenceIdr.toLocaleString("id-ID")}/${b.unit} (peringatan >${b.warnThresholdPct}%, pelanggaran >${b.failThresholdPct}%)`);
  }
  return lines.join("\n");
}

function factsBlock(scenario: ProcurementScenario, reconciliation: ReconciliationResult): string {
  const lines: string[] = [
    `═══ DATA PEMBUKUAN ═══`,
    `Dapur: ${scenario.kitchen}`,
    `Tanggal: ${scenario.dateIso}`,
    `Batas persetujuan mandiri: ${formatIdr(scenario.approvalThresholdIdr)}`,
    "",
    "JUMLAH PORSI:",
    `• Terdaftar: ${scenario.meals.enrolled} siswa`,
    `• Hadir: ${scenario.meals.present} siswa`,
    `• Disajikan: ${scenario.meals.mealsServed} porsi`,
    `• Ditagih: ${scenario.meals.mealsBilled} porsi`,
    `• Biaya per porsi: ${formatIdr(scenario.costPerPortionIdr)}`,
    "",
    "ITEM PENGADAAN:",
  ];

  for (const item of scenario.lineItems) {
    const total = item.qty * item.unitPriceIdr;
    const diff = item.unitPriceIdr - item.referencePriceIdr;
    const diffPct = ((diff / item.referencePriceIdr) * 100).toFixed(1);
    const flag = diff > 0 ? ` ⚠ +${diffPct}% di atas referensi` : "";
    lines.push(`• ${item.item} (${item.supplier}): ${item.qty} ${item.unit} × ${formatIdr(item.unitPriceIdr)} = ${formatIdr(total)}${flag}`);
  }

  lines.push("", "FAKTUR DITERIMA:");
  for (const inv of scenario.invoices) {
    lines.push(`• ${inv.id} — ${inv.supplier}: ${formatIdr(inv.amountIdr)} (${inv.dateIso})`);
  }

  lines.push("", "PEMENANG TENDER BULAN INI:");
  for (const a of scenario.awards) {
    lines.push(`• ${a.supplier}: ${a.awards} kali`);
  }

  lines.push("", `TOTAL KEBOCORAN TERHITUNG: ${formatIdr(reconciliation.totalLeakageIdr)}`, "");

  if (reconciliation.findings.length === 0) {
    lines.push("TEMUAN: TIDAK ADA. Pembukuan hari ini tampak bersih.");
  } else {
    lines.push(`TEMUAN (${reconciliation.findings.length} masalah — sudah diverifikasi mesin, JANGAN dihitung ulang):`);
    for (const f of reconciliation.findings) {
      const tag = f.leakageIdr > 0 ? `kebocoran ${formatIdr(f.leakageIdr)}` : "bendera risiko (tanpa kebocoran langsung)";
      lines.push(`\n[${f.kind.toUpperCase()}] ${f.title} — ${tag}`);
      for (const e of f.evidence) lines.push(`  · ${e.label}: ${e.value}`);
    }
  }

  return lines.join("\n");
}

export interface AuditParams {
  scenario: ProcurementScenario;
  reconciliation: ReconciliationResult;
  locale: Locale;
  model: string;
}

export function createAuditStream({ scenario, reconciliation, locale, model }: AuditParams) {
  const directive = messagesFor(locale).aiDirective;
  const priceRef = buildPriceReferenceBlock(scenario);

  // THE BRAIN: inject full regulatory + market context before Claude evaluates
  const systemPrompt = [
    AUDIT_SYSTEM_PROMPT,
    "",
    "═══ REGULASI MBG ═══",
    MBG_REGULATORY_CONTEXT,
    "",
    "═══ KONTEKS PASAR ═══",
    YOGYAKARTA_MARKET_CONTEXT_2026,
    priceRef ? `\n${priceRef}` : "",
    "",
    directive,
  ].filter(Boolean).join("\n");

  return getAnthropic().messages.stream({
    model,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Tinjau pembukuan ini dan panggil ${TOOL_NAME} dengan penilaian lengkap Anda.\n\n${factsBlock(scenario, reconciliation)}`,
      },
    ],
    tools: [REPORT_AUDIT_TOOL],
  });
}

export const REPORT_AUDIT_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Laporkan penilaian integritas keuangan terstruktur untuk hari pengadaan ini.",
  input_schema: financeAssessmentJsonSchema() as Anthropic.Tool.InputSchema,
};

export function extractAssessment(message: Anthropic.Message): FinanceAssessment {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!block) throw new Error("The model did not return a structured assessment.");
  return FinanceAssessmentSchema.parse(block.input);
}
