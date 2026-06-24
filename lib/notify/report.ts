/**
 * Bilingual (English + Indonesian) report builder for WhatsApp delivery.
 *
 * Reports are built from structured data — no extra AI cost, deterministic,
 * and always shows BOTH languages so local staff + international oversight
 * (e.g. +1 US number) can read the same message.
 */

import type { CrossCheckResult } from "@/lib/receipt/checker";
import type { ReceiptExtraction } from "@/lib/receipt/scanner";
import { broadcastReport } from "./wa-send";

const APP_URL = process.env.BETTER_AUTH_URL ?? "https://mpkb-kitchen-production.up.railway.app";

function fmtIdr(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const RISK_BILINGUAL: Record<string, { en: string; id: string; emoji: string }> = {
  low:      { en: "LOW",      id: "RENDAH", emoji: "✅" },
  medium:   { en: "MEDIUM",   id: "SEDANG", emoji: "⚠️" },
  high:     { en: "HIGH",     id: "TINGGI", emoji: "🚨" },
  critical: { en: "CRITICAL", id: "KRITIS", emoji: "🔴" },
};

// ── Receipt report ──────────────────────────────────────────────────────────

export function buildReceiptReport(params: {
  scanId: string;
  kitchen: string;
  extraction: ReceiptExtraction;
  check: CrossCheckResult;
  source: "web" | "whatsapp";
}): string {
  const { scanId, kitchen, extraction, check, source } = params;
  const risk = RISK_BILINGUAL[check.riskLevel] ?? RISK_BILINGUAL["low"]!;
  const ts = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });

  const lines: string[] = [
    `${risk.emoji} *MPKB — RECEIPT VERIFIED / STRUK TERVERIFIKASI*`,
    ``,
    `🏠 *Kitchen / Dapur:* ${kitchen}`,
    `📦 *Supplier / Pemasok:* ${extraction.supplierName}`,
    extraction.receiptDate ? `📅 *Date / Tanggal:* ${extraction.receiptDate}` : ``,
    `🕐 *Scanned / Dipindai:* ${ts}`,
    `📲 *Via:* ${source === "whatsapp" ? "WhatsApp" : "Web"}`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `💰 *Total:* ${fmtIdr(check.totalIdr)}`,
    `🔢 *Items / Item:* ${extraction.items.length}`,
    `${risk.emoji} *Risk / Risiko:* ${risk.en} / ${risk.id}`,
  ].filter(Boolean);

  if (check.overpaymentIdr > 0) {
    lines.push(
      `🚩 *Flagged / Ditandai:* ${check.flaggedCount} of/dari ${extraction.items.length}`,
      `💸 *Overpayment / Kelebihan Bayar:* ${fmtIdr(check.overpaymentIdr)}`,
      ``,
      `🇬🇧 ${check.flaggedCount} item(s) priced above market reference. Estimated overpayment: ${fmtIdr(check.overpaymentIdr)}. Review recommended.`,
      `🇮🇩 ${check.flaggedCount} item di atas harga pasar. Estimasi kelebihan bayar: ${fmtIdr(check.overpaymentIdr)}. Perlu ditinjau.`,
    );

    // List the flagged items (bilingual headers)
    const flagged = check.checks.filter((c) => c.status === "warn" || c.status === "fail");
    if (flagged.length > 0) {
      lines.push(``, `📋 *Flagged Items / Item Bermasalah:*`);
      for (const c of flagged.slice(0, 8)) {
        const pct = c.pctAboveRef !== null ? `+${c.pctAboveRef.toFixed(0)}%` : "?";
        lines.push(`• ${c.itemName}: ${fmtIdr(c.unitPrice)}/${c.unit} (${pct} vs ${c.referencePrice ? fmtIdr(c.referencePrice) : "?"})`);
      }
    }
  } else {
    lines.push(
      ``,
      `🇬🇧 All prices within market range. No irregularities detected.`,
      `🇮🇩 Semua harga dalam batas wajar. Tidak ada indikasi kecurangan.`,
    );
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `🔐 *Audit ID:* \`${scanId.slice(0, 8)}\``,
    `🔗 ${APP_URL}/receipts`,
    ``,
    `_Sealed in tamper-proof ledger / Tersegel di buku besar anti-manipulasi_`,
  );

  return lines.filter((l) => l !== undefined).join("\n");
}

// ── CCTV / SOP report ───────────────────────────────────────────────────────

export function buildSopReport(params: {
  eventId: string;
  zone: string;
  score: number;
  status: string;
  summary: string;
  violations: { ruleId: string; severity: string; detail: string }[];
}): string {
  const { eventId, zone, score, status, violations } = params;
  const statusMap: Record<string, { en: string; id: string; emoji: string }> = {
    pass: { en: "PASS", id: "LULUS", emoji: "✅" },
    warn: { en: "WARNING", id: "PERINGATAN", emoji: "⚠️" },
    fail: { en: "FAIL", id: "GAGAL", emoji: "🚨" },
  };
  const s = statusMap[status] ?? statusMap["warn"]!;
  const ts = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });

  const lines: string[] = [
    `${s.emoji} *MPKB — CCTV INSPECTION / INSPEKSI CCTV*`,
    ``,
    `📷 *Zone / Zona:* ${zone}`,
    `🕐 *Time / Waktu:* ${ts}`,
    `📊 *Score / Skor:* ${Math.round(score)}/100`,
    `${s.emoji} *Status:* ${s.en} / ${s.id}`,
    ``,
  ];

  if (violations.length > 0) {
    lines.push(
      `🚩 *Violations / Pelanggaran:* ${violations.length}`,
      ``,
    );
    for (const v of violations.slice(0, 6)) {
      lines.push(`• [${v.severity.toUpperCase()}] ${v.ruleId}: ${v.detail}`);
    }
  } else {
    lines.push(
      `🇬🇧 No violations detected. Kitchen compliant.`,
      `🇮🇩 Tidak ada pelanggaran. Dapur memenuhi standar.`,
    );
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `🔐 *Audit ID:* \`${eventId.slice(0, 8)}\``,
    `🔗 ${APP_URL}/floor`,
    ``,
    `_Sealed in tamper-proof ledger / Tersegel di buku besar_`,
  );

  return lines.join("\n");
}

// ── Fire-and-forget broadcaster ─────────────────────────────────────────────

/** Send a report to all configured recipients without blocking the response. */
export function dispatchReport(text: string): void {
  // Fire and forget — don't block the API response on WA delivery.
  void broadcastReport(text).then((results) => {
    const ok = results.filter((r) => r.ok).length;
    if (ok > 0) console.log(`[notify] report sent to ${ok}/${results.length} recipients`);
    else console.log(`[notify] report not delivered (${results[0]?.reason ?? "no provider"}) — saved to DB`);
  });
}
