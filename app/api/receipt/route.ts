import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { receiptScans } from "@/db/schema";
import { getModel } from "@/lib/anthropic";
import { getAppSession } from "@/lib/auth/session";
import { scanReceipt } from "@/lib/receipt/scanner";
import { crossCheck } from "@/lib/receipt/checker";
import { buildReceiptReport, dispatchReport } from "@/lib/notify/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedType = (typeof ACCEPTED_TYPES)[number];

const BodySchema = z.object({
  imageBase64: z.string().min(100),
  mediaType:   z.enum(ACCEPTED_TYPES),
  kitchen:     z.string().default("Dapur SPPG Gamping · Yogyakarta"),
});

export async function POST(req: Request): Promise<Response> {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid request" }, { status: 422 });

  const { imageBase64, mediaType, kitchen } = parsed.data;

  // Image hash (for deduplication / tamper evidence)
  const imageHash = createHash("sha256").update(imageBase64).digest("hex");

  const model = await getModel();

  try {
    // Step 1: Claude extracts all line items
    const extraction = await scanReceipt(imageBase64, mediaType as AcceptedType, model);

    // Step 2: Cross-check against market benchmarks
    const check = crossCheck(extraction);

    // Step 3: Persist
    const id = randomUUID();
    await db.insert(receiptScans).values({
      id,
      kitchen,
      supplier:       extraction.supplierName,
      receiptDate:    extraction.receiptDate ?? null,
      receiptNumber:  extraction.receiptNumber ?? null,
      totalIdr:       check.totalIdr,
      overpaymentIdr: check.overpaymentIdr,
      riskLevel:      check.riskLevel,
      itemCount:      extraction.items.length,
      flaggedCount:   check.flaggedCount,
      items:          extraction.items,
      checks:         check.checks,
      summary:        check.summary,
      imageHash,
    });

    // Bilingual report → broadcast to configured WA recipients (non-blocking)
    dispatchReport(buildReceiptReport({ scanId: id, kitchen, extraction, check, source: "web" }));

    return Response.json({
      id,
      extraction,
      check,
      imageHash,
    });
  } catch (err) {
    console.error("[receipt/scan]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "scan failed" },
      { status: 500 },
    );
  }
}
