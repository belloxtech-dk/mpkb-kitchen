/**
 * Receipt Scanner — Claude Vision extraction + structured JSON output.
 *
 * THE BRAIN injects Yogyakarta market context before Claude reads the receipt.
 * Claude extracts every line item; we then cross-check against benchmarks.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/anthropic";
import { YOGYAKARTA_MARKET_CONTEXT_2026, MBG_REGULATORY_CONTEXT } from "@/lib/context/kitchen-context";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const ExtractedItemSchema = z.object({
  name:       z.string(),          // item name as written on receipt
  quantity:   z.number().positive(),
  unit:       z.string(),          // kg / L / pcs / porsi / etc
  unitPrice:  z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  notes:      z.string().optional(), // any oddity noticed (e.g. "unit unclear")
});

export const ReceiptExtractionSchema = z.object({
  supplierName:   z.string(),
  receiptNumber:  z.string().optional(),
  receiptDate:    z.string().optional(),   // YYYY-MM-DD if readable
  items:          z.array(ExtractedItemSchema),
  subtotal:       z.number().nonnegative(),
  tax:            z.number().nonnegative().optional(),
  total:          z.number().nonnegative(),
  currency:       z.string().default("IDR"),
  confidence:     z.enum(["high", "medium", "low"]),
  notes:          z.string().optional(),   // image quality, partial visibility, etc
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

// ── Tool definition ───────────────────────────────────────────────────────────

const TOOL_NAME = "report_receipt";

const RECEIPT_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Report the fully structured extraction of a grocery/supplier receipt.",
  input_schema: {
    type: "object",
    required: ["supplierName", "items", "subtotal", "total", "confidence"],
    properties: {
      supplierName:  { type: "string", description: "Name of the supplier/vendor" },
      receiptNumber: { type: "string", description: "Receipt/invoice number if visible" },
      receiptDate:   { type: "string", description: "Date in YYYY-MM-DD format if readable" },
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "quantity", "unit", "unitPrice", "totalPrice"],
          properties: {
            name:       { type: "string" },
            quantity:   { type: "number" },
            unit:       { type: "string" },
            unitPrice:  { type: "number" },
            totalPrice: { type: "number" },
            notes:      { type: "string" },
          },
        },
      },
      subtotal:   { type: "number" },
      tax:        { type: "number" },
      total:      { type: "number" },
      currency:   { type: "string", default: "IDR" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      notes:      { type: "string" },
    },
  } as Anthropic.Tool.InputSchema,
};

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a forensic receipt digitizer for Indonesia's MBG (Makan Bergizi Gratis) anti-corruption program. You extract every line item from grocery/supplier receipts photographed by kitchen staff.

YOUR MANDATE:
• Extract ALL line items — every row on the receipt, even if partially visible.
• Do NOT round or estimate prices — copy the exact numbers shown.
• If a unit is ambiguous (e.g., "ikat", "papan", "bungkus"), keep it as-is.
• If text is unclear, include your best reading and set confidence appropriately.
• If you can't read a number, use 0 and note it in the item's notes field.
• Prices in Indonesia are in IDR (Rupiah) — no decimal points in normal pricing.

IMPORTANT:
• Indonesian receipts often use period (.) as thousands separator: 15.000 = Rp 15,000
• Unit prices may be written as "@ Rp 14.000" or "14.000/kg"
• Tax is "PPN" (11%) — extract if shown separately
• Receipts may be handwritten — do your best

After narrating what you see (1-2 sentences), call ${TOOL_NAME} with the complete structured extraction.`;

// ── Main export ───────────────────────────────────────────────────────────────

export async function scanReceipt(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  model: string,
): Promise<ReceiptExtraction> {
  const systemPrompt = [
    SYSTEM_PROMPT,
    "",
    "═══ KONTEKS PASAR (untuk referensi verifikasi) ═══",
    YOGYAKARTA_MARKET_CONTEXT_2026,
    "═══════════════════════════════════════════════",
  ].join("\n");

  const response = await getAnthropic().messages.create({
    model,
    max_tokens: 3000,
    system: systemPrompt,
    tools: [RECEIPT_TOOL],
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: `Baca struk/faktur ini dengan teliti. Narrasikan apa yang Anda lihat, lalu ekstrak SEMUA item ke dalam ${TOOL_NAME}. Jangan lewatkan satu item pun.`,
          },
        ],
      },
    ],
    tool_choice: { type: "auto" },
  });

  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!block) throw new Error("Claude did not return a structured receipt extraction.");

  return ReceiptExtractionSchema.parse(block.input);
}
