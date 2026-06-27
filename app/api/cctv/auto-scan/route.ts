/**
 * POST /api/cctv/auto-scan
 * Triggers a full AI SOP scan across all kitchen cameras.
 * POST only — no GET to prevent accidental browser triggers.
 * Requires secret header to prevent unauthorized calls.
 */
import { NextResponse } from "next/server";
import { runAutoScan } from "@/lib/auto-scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SCAN_SECRET = process.env.AUTO_SCAN_SECRET ?? "";

export async function POST(req: Request) {
  // Block if no secret configured or wrong secret
  const auth = req.headers.get("x-scan-secret");
  if (!SCAN_SECRET || auth !== SCAN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: check last scan time via header
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
