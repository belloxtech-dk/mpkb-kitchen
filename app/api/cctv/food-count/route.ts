/**
 * GET /api/cctv/food-count
 * Counts food portions visible in kitchen cameras using Claude AI.
 * Used to cross-verify with school delivery receipts (anti-ghost-meal check).
 */
import { NextResponse } from "next/server";
import { countAllPortions } from "@/lib/food-count";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const results = await countAllPortions();
    const totalEstimate = results.reduce((s, r) => s + r.portionsEstimate, 0);
    return NextResponse.json({ ok: true, totalEstimate, results, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
