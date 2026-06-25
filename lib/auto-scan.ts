/**
 * Auto-scan engine: fetches CCTV snapshots → Claude SOP analysis → WA report.
 * Called by /api/cctv/auto-scan (manual trigger or cron).
 */

import crypto from "crypto";
import { createVisionStream, extractVerdict } from "./vision";
import { recordSopEvent } from "@/db/repo";
import { WA_REPORT_RECIPIENTS } from "@/lib/notify/wa-recipients";
import { broadcastToRecipients } from "@/lib/notify/wa-broadcast";
import { getModelForTask } from "@/lib/model-router";

const BASE = "https://openapi-sg.easy4ip.com/openapi";
const APP_ID = process.env.IMOU_APP_ID ?? "lc13e01d21d1444520";
const APP_SECRET = process.env.IMOU_APP_SECRET ?? "ce2fed6c3ada47f981058d864a995c";

// Kitchen cameras to scan on each run (priority zones)
export const SCAN_ZONES = [
  { name: "Pemorsian",        deviceId: "1074CBMPSF9A424", channelId: "0" },
  { name: "Pengolahan",       deviceId: "1074CBMPSF88336", channelId: "0" },
  { name: "Cuci Ompreng",     deviceId: "080B5BMPBVD61E4", channelId: "0" },
  { name: "Gudang Kering",    deviceId: "1074CBMPSF47827", channelId: "0" },
  { name: "Penerimaan Barang",deviceId: "1074CBMPSFB7C1C", channelId: "0" },
];

function makeSig(ts: number, nonce: string) {
  return crypto.createHash("md5")
    .update(`time:${ts},nonce:${nonce},appSecret:${APP_SECRET}`)
    .digest("hex");
}

async function imouApi(endpoint: string, params: Record<string, unknown>) {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const token = await getImouToken();
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: makeSig(ts, nonce), time: ts, nonce },
      id: crypto.randomUUID(),
      params: { ...params, token },
    }),
  });
  return res.json();
}

async function getImouToken(): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const res = await fetch(`${BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: makeSig(ts, nonce), time: ts, nonce },
      params: { appId: APP_ID, appSecret: APP_SECRET },
    }),
  });
  const data = await res.json();
  return data.result.data.accessToken;
}

/** Capture a JPEG snapshot from a camera via Imou API. Returns base64 JPEG. */
async function captureSnapshot(deviceId: string, channelId: string): Promise<string | null> {
  try {
    const r = await imouApi("snapCamera", { deviceId, channelId });
    if (r.result?.code !== "0") return null;
    const imageUrl = r.result?.data?.picUrl as string;
    if (!imageUrl) return null;

    // Fetch the image and convert to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buf = await imgRes.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch {
    return null;
  }
}

export interface ScanResult {
  zone: string;
  deviceId: string;
  score: number;
  status: string;
  summary: string;
  violations: string[];
  snapshotCaptured: boolean;
}

/** Run AI SOP scan on a single zone. */
async function scanZone(zone: { name: string; deviceId: string; channelId: string }, model: string): Promise<ScanResult> {
  // Try to get snapshot from camera
  const imageBase64 = await captureSnapshot(zone.deviceId, zone.channelId);

  if (!imageBase64) {
    return {
      zone: zone.name, deviceId: zone.deviceId,
      score: 0, status: "offline",
      summary: "Kamera tidak dapat dijangkau / Camera unreachable",
      violations: [], snapshotCaptured: false,
    };
  }

  try {
    const vision = await createVisionStream({
      imageBase64, mediaType: "image/jpeg",
      zone: zone.name, locale: "id",
      model: model, // passed from caller (heavy=Sonnet)
    });

    const final = await vision.finalMessage();
    const verdict = extractVerdict(final);

    const violations = verdict.checks
      ?.filter((c: { status: string }) => c.status === "fail" || c.status === "warn")
      .map((c: { id?: string; detail?: string }) => c.detail ?? c.id ?? "")
      .filter(Boolean) ?? [];

    // Record to DB
    await recordSopEvent({
      zone: zone.name, source: "auto_scan",
      verdict,
    });

    return {
      zone: zone.name, deviceId: zone.deviceId,
      score: verdict.complianceScore,
      status: verdict.overallStatus,
      summary: verdict.summary ?? "",
      violations, snapshotCaptured: true,
    };
  } catch (err) {
    return {
      zone: zone.name, deviceId: zone.deviceId,
      score: 0, status: "error",
      summary: `Gagal menganalisis: ${String(err)}`,
      violations: [], snapshotCaptured: true,
    };
  }
}

/** Build WA report message from scan results. */
export function buildAutoScanReport(results: ScanResult[]): string {
  const ts = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric",
    month: "short", hour: "2-digit", minute: "2-digit",
  });

  const online = results.filter(r => r.status !== "offline");
  const avgScore = online.length
    ? Math.round(online.reduce((s, r) => s + r.score, 0) / online.length)
    : 0;
  const fails = results.filter(r => r.status === "fail");
  const warns = results.filter(r => r.status === "warn");

  const statusEmoji = avgScore >= 80 ? "✅" : avgScore >= 60 ? "⚠️" : "🚨";
  const overallLabel = avgScore >= 80 ? "BAIK" : avgScore >= 60 ? "PERLU PERHATIAN" : "KRITIS";

  const lines = [
    `${statusEmoji} *MPKB — LAPORAN SOP OTOMATIS*`,
    `🏠 SPPG Gamping, Yogyakarta`,
    `🕐 ${ts} WIB`,
    ``,
    `📊 *Skor Kepatuhan: ${avgScore}/100 — ${overallLabel}*`,
    `📷 Kamera dipindai: ${online.length}/${results.length}`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
  ];

  for (const r of results) {
    const emoji = r.status === "pass" ? "✅"
      : r.status === "warn" ? "⚠️"
      : r.status === "fail" ? "🚨"
      : r.status === "offline" ? "📴"
      : "❓";
    lines.push(`${emoji} *${r.zone}*: ${Math.round(r.score)}/100`);
    if (r.violations.length > 0) {
      for (const v of r.violations.slice(0, 2)) {
        lines.push(`   └ ${v}`);
      }
    }
  }

  lines.push(``, `━━━━━━━━━━━━━━━━━━`);

  if (fails.length > 0) {
    lines.push(`🚨 *TINDAKAN SEGERA DIPERLUKAN:*`);
    for (const r of fails) {
      lines.push(`• ${r.zone}: ${r.summary.slice(0, 100)}`);
    }
    lines.push(``);
  }

  if (warns.length > 0) {
    lines.push(`⚠️ *Perlu Perhatian:*`);
    for (const r of warns) {
      lines.push(`• ${r.zone}: ${r.summary.slice(0, 80)}`);
    }
    lines.push(``);
  }

  lines.push(`🔗 Dashboard: ${process.env.BETTER_AUTH_URL ?? "http://localhost:3786"}/floor`);
  lines.push(`📋 Laporan lengkap: ${process.env.BETTER_AUTH_URL ?? "http://localhost:3786"}/reports`);

  return lines.join("\n");
}

/** Main: run full auto-scan across all zones + send WA report. */
export async function runAutoScan(): Promise<{ results: ScanResult[]; waDelivered: boolean }> {
  // SOP audit = heavy task → Claude Sonnet (best reasoning)
  const { model, provider } = getModelForTask("sop_audit");
  console.log(`🔍 SOP scan using ${provider}/${model}`);
  const results = await Promise.all(SCAN_ZONES.map(z => scanZone(z, model)));
  const report = buildAutoScanReport(results);

  // Send to all recipients
  const waDelivered = await broadcastToRecipients(
    WA_REPORT_RECIPIENTS.map(r => r.phone),
    report
  );

  return { results, waDelivered };
}
