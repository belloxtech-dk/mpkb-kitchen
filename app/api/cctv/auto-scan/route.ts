/**
 * POST /api/cctv/auto-scan
 * Triggers a full AI SOP scan across all kitchen cameras.
 * Sends WhatsApp report to configured recipients.
 * Can be called manually from dashboard or by an external cron.
 */
import { NextResponse } from "next/server";
import { runAutoScan } from "@/lib/auto-scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 min — Claude + multi-camera

export async function POST() {
  try {
    const { results, waDelivered } = await runAutoScan();

    const summary = {
      scanned: results.length,
      online: results.filter(r => r.status !== "offline").length,
      pass: results.filter(r => r.status === "pass").length,
      warn: results.filter(r => r.status === "warn").length,
      fail: results.filter(r => r.status === "fail").length,
      avgScore: Math.round(
        results.filter(r => r.status !== "offline")
          .reduce((s, r) => s + r.score, 0) /
        Math.max(1, results.filter(r => r.status !== "offline").length)
      ),
      waDelivered,
      results,
    };

    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("Auto-scan error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Allow GET for easy browser testing
export async function GET() {
  return POST();
}
