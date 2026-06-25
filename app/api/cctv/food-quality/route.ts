/**
 * POST /api/cctv/food-quality?kitchen=gamping-yogyakarta
 * Analyzes food quality, nutrition, and portions across kitchen cameras.
 * Sends WhatsApp report automatically.
 */
import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodQuality, buildFoodQualityReport } from "@/lib/food-quality";
import { broadcastToRecipients } from "@/lib/notify/wa-broadcast";
import { WA_REPORT_RECIPIENTS } from "@/lib/notify/wa-recipients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Cameras focused on food (not storage/parking)
const FOOD_CAMERAS = {
  "gamping-yogyakarta": [
    { deviceId: "A6A76BMPSF104A8", zone: "Pemorsian" },
    { deviceId: "5058FBMPSF5C811", zone: "Pengolahan" },
    { deviceId: "1074CBMPSF98A91", zone: "Ruang Persiapan" },
  ],
  "bagelen-purwokerto": [
    { deviceId: "1074CBMPSF9A424", zone: "Pemorsian" },
    { deviceId: "1074CBMPSF88336", zone: "Pengolahan" },
    { deviceId: "1074CBMPSF4E691", zone: "Ruang Makan" },
    { deviceId: "1074CBMPSFAD2DA", zone: "Persiapan" },
  ],
};

const KITCHEN_LABELS: Record<string, string> = {
  "gamping-yogyakarta": "SPPG Gamping · Yogyakarta",
  "bagelen-purwokerto": "SPPG Bagelen · Purwokerto",
};

export async function POST(req: NextRequest) {
  const kitchenId = req.nextUrl.searchParams.get("kitchen") ?? "all";

  try {
    const kitchensToScan = kitchenId === "all"
      ? Object.entries(FOOD_CAMERAS)
      : [[kitchenId, FOOD_CAMERAS[kitchenId as keyof typeof FOOD_CAMERAS] ?? []] as const];

    const allResults = [];
    for (const [kId, cameras] of kitchensToScan) {
      if (!cameras?.length) continue;
      const results = await Promise.all(
        cameras.map(c => analyzeFoodQuality(c.deviceId, c.zone, kId))
      );
      allResults.push({ kitchenId: kId, label: KITCHEN_LABELS[kId] ?? kId, results });
    }

    // Build and send WA report for each kitchen
    let waDelivered = false;
    for (const { label, results } of allResults) {
      const report = buildFoodQualityReport(results, label);
      const ok = await broadcastToRecipients(
        WA_REPORT_RECIPIENTS.map(r => r.phone),
        report,
      );
      if (ok) waDelivered = true;
    }

    return NextResponse.json({ ok: true, allResults, waDelivered });
  } catch (err) {
    console.error("Food quality error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return POST(req); }
