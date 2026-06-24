/**
 * WhatsApp Webhook — provider-agnostic invoice processing bot.
 *
 * Supports: Twilio, Fonnte, 360dialog, WA Business API (Cloud API), and
 * any service that POSTs JSON with a phone number + image.
 *
 * Flow:
 * 1. Manager sends invoice photo to the WA bot number
 * 2. Webhook receives the image
 * 3. Receipt scanner extracts all items
 * 4. Price checker cross-references Yogyakarta 2026 market data
 * 5. Bot replies with a clear verdict + estimated overpayment
 * 6. Result sealed in DB (receipt_scans) for government review
 *
 * Setup: set WHATSAPP_WEBHOOK_SECRET in env to validate requests.
 * Set WHATSAPP_PROVIDER to "twilio" | "fonnte" | "360dialog" | "cloud_api"
 */

import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { receiptScans, waSessions, priceIntelligence } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scanReceipt } from "@/lib/receipt/scanner";
import { crossCheck } from "@/lib/receipt/checker";
import { getModel } from "@/lib/anthropic";
import { FLEET_KITCHENS } from "@/lib/fleet/kitchens";
import { buildReceiptReport, dispatchReport } from "@/lib/notify/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatIdr(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function riskEmoji(level: string): string {
  return { low: "✅", medium: "⚠️", high: "🚨", critical: "🔴" }[level] ?? "❓";
}

function buildReplyText(supplier: string, total: number, overpayment: number, flagged: number, itemCount: number, risk: string, scanId: string): string {
  const lines = [
    `🧾 *Verifikasi Struk — MPKB*`,
    ``,
    `📦 Pemasok: *${supplier}*`,
    `🔢 Item ditemukan: ${itemCount}`,
    `💰 Total struk: *${formatIdr(total)}*`,
    ``,
  ];

  if (overpayment > 0) {
    lines.push(`${riskEmoji(risk)} *Risiko: ${risk.toUpperCase()}*`);
    lines.push(`⚠️ Item tidak wajar: ${flagged} dari ${itemCount}`);
    lines.push(`💸 Estimasi kelebihan bayar: *${formatIdr(overpayment)}*`);
    lines.push(``);
    lines.push(`Struk ini ditandai untuk review pengawas.`);
  } else {
    lines.push(`✅ *Semua harga dalam batas wajar*`);
    lines.push(`Tidak ada indikasi markup yang mencurigakan.`);
  }

  lines.push(``);
  lines.push(`🔐 ID Audit: \`${scanId.slice(0, 8)}\``);
  lines.push(`_Detail lengkap tersedia di dashboard MPKB_`);

  return lines.join("\n");
}

// ── Normalize incoming message (provider-agnostic) ────────────────────────────

interface NormalizedMessage {
  from: string;        // WA phone number e.g. "6281234567890"
  body: string;        // text content
  imageUrl?: string;   // public URL to image (if any)
  imageBase64?: string; // or base64 directly
  mediaType?: string;
  provider: string;
}

async function normalize(req: Request): Promise<NormalizedMessage | null> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "fonnte";
  const contentType = req.headers.get("content-type") ?? "";

  // ── Twilio ──────────────────────────────────────────────────────────────────
  if (provider === "twilio" || contentType.includes("application/x-www-form-urlencoded")) {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const from = (params.get("From") ?? "").replace("whatsapp:", "").replace("+", "");
    const text = params.get("Body") ?? "";
    const mediaUrl = params.get("MediaUrl0") ?? undefined;
    const mediaType = params.get("MediaContentType0") ?? "image/jpeg";
    return { from, body: text, imageUrl: mediaUrl, mediaType, provider: "twilio" };
  }

  // ── Fonnte / 360dialog / Cloud API / Generic JSON ──────────────────────────
  const data = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!data) return null;

  // Fonnte format
  if (data.sender) {
    return {
      from: String(data.sender),
      body: String((data as Record<string, unknown>).message ?? ""),
      imageUrl: data.file ? String(data.file) : undefined,
      mediaType: "image/jpeg",
      provider: "fonnte",
    };
  }

  // WhatsApp Cloud API format
  const entry = (data.entry as Record<string,unknown>[])?.[0];
  const change = (entry?.changes as Record<string,unknown>[])?.[0];
  const value = change?.value as Record<string,unknown> | undefined;
  const msg = (value?.messages as Record<string,unknown>[])?.[0];
  if (msg) {
    const from = String(msg.from ?? "");
    const text = String((msg.text as Record<string,unknown>)?.body ?? "");
    const image = msg.image as Record<string,unknown> | undefined;
    return {
      from,
      body: text,
      imageUrl: image?.url ? String(image.url) : undefined,
      mediaType: "image/jpeg",
      provider: "cloud_api",
    };
  }

  // 360dialog format
  if (data.messages) {
    const m = (data.messages as Record<string,unknown>[])[0];
    if (!m) return null;
    const from = String(m.from ?? "");
    const image = m.image as Record<string,unknown> | undefined;
    return {
      from,
      body: String((m.text as Record<string,unknown>)?.body ?? ""),
      imageUrl: image?.id ? `https://waba.360dialog.io/v1/media/${String(image.id)}` : undefined,
      mediaType: "image/jpeg",
      provider: "360dialog",
    };
  }

  return null;
}

// ── Image fetcher ─────────────────────────────────────────────────────────────

async function fetchImageAsBase64(url: string, provider: string): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const headers: Record<string, string> = {};

    if (provider === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
      const token = process.env.TWILIO_AUTH_TOKEN ?? "";
      headers["Authorization"] = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
    }
    if (provider === "360dialog") {
      headers["D360-API-KEY"] = process.env.DIALOG360_API_KEY ?? "";
    }

    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const mediaType = ct.split(";")[0]?.trim() ?? "image/jpeg";
    return { base64, mediaType };
  } catch {
    return null;
  }
}

// ── WA reply sender ───────────────────────────────────────────────────────────

async function sendWaReply(to: string, text: string, provider: string): Promise<void> {
  if (provider === "fonnte") {
    const token = process.env.FONNTE_TOKEN;
    if (!token) return;
    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify({ target: to, message: text, delay: "1", countryCode: "62" }),
    });
    return;
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WA_NUMBER;
    if (!sid || !token || !from) return;
    const body = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:+${to}`, Body: text });
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      },
      body,
    });
    return;
  }

  if (provider === "cloud_api") {
    const token = process.env.WA_CLOUD_TOKEN;
    const phoneId = process.env.WA_PHONE_NUMBER_ID;
    if (!token || !phoneId) return;
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
    return;
  }
}

// ── Identify kitchen from phone number ────────────────────────────────────────

async function getKitchenForPhone(phone: string): Promise<string> {
  const [session] = await db.select().from(waSessions).where(eq(waSessions.waPhone, phone)).limit(1);
  if (session?.kitchenId) {
    const kitchen = FLEET_KITCHENS.find((k) => k.id === session.kitchenId);
    if (kitchen) return kitchen.label;
  }
  return "Dapur SPPG Gamping · Yogyakarta"; // default to pilot kitchen
}

// ── Main handler ──────────────────────────────────────────────────────────────

// GET: webhook verification (WhatsApp Cloud API & 360dialog)
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");
  if (token === (process.env.WHATSAPP_WEBHOOK_SECRET ?? "mpkb-webhook-2026") && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// POST: incoming message handler
export async function POST(req: Request): Promise<Response> {
  const msg = await normalize(req);
  if (!msg) return Response.json({ ok: false, error: "unrecognized format" }, { status: 400 });

  const { from, imageUrl, imageBase64: directBase64, mediaType = "image/jpeg", provider } = msg;

  // No image? Send instructions
  if (!imageUrl && !directBase64) {
    const helpText = [
      "🧾 *Bot Verifikasi Struk MPKB*",
      "",
      "Kirim *foto struk* belanja dan saya akan otomatis:",
      "• Membaca semua item & harga",
      "• Membandingkan dengan harga pasar Yogyakarta",
      "• Melaporkan jika ada harga tidak wajar",
      "",
      "_Pastikan foto jelas dan terbaca_",
    ].join("\n");
    await sendWaReply(from, helpText, provider);
    return Response.json({ ok: true, action: "sent_help" });
  }

  // Processing message
  await sendWaReply(from, "⏳ Sedang memverifikasi struk… mohon tunggu sebentar.", provider);

  try {
    // Fetch image bytes
    let base64 = directBase64;
    let resolvedMediaType = mediaType;
    if (imageUrl && !base64) {
      const fetched = await fetchImageAsBase64(imageUrl, provider);
      if (!fetched) {
        await sendWaReply(from, "❌ Tidak dapat mengunduh gambar. Coba kirim ulang.", provider);
        return Response.json({ ok: false, error: "image fetch failed" });
      }
      base64 = fetched.base64;
      resolvedMediaType = fetched.mediaType;
    }
    if (!base64) return Response.json({ ok: false });

    const kitchen = await getKitchenForPhone(from);
    const model = await getModel();

    // Run the full pipeline
    const extraction = await scanReceipt(base64, resolvedMediaType as "image/jpeg" | "image/png" | "image/webp", model);
    const check = crossCheck(extraction);
    const imageHash = createHash("sha256").update(base64).digest("hex");
    const id = randomUUID();

    // Persist scan
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
      waPhone:        from,
      source:         "whatsapp",
    });

    // Build price intelligence from this scan
    const priceRows = extraction.items
      .filter((item) => item.unitPrice > 0)
      .map((item) => ({
        id:        randomUUID(),
        kitchenId: "gamping-yogyakarta",
        itemName:  item.name,
        unit:      item.unit,
        priceIdr:  item.unitPrice,
        supplier:  extraction.supplierName,
        receiptId: id,
        source:    "whatsapp",
      }));
    if (priceRows.length > 0) {
      await db.insert(priceIntelligence).values(priceRows);
    }

    // Reply to the sender with results
    const reply = buildReplyText(
      extraction.supplierName,
      check.totalIdr,
      check.overpaymentIdr,
      check.flaggedCount,
      extraction.items.length,
      check.riskLevel,
      id,
    );
    await sendWaReply(from, reply, provider);

    // Also broadcast the full bilingual report to oversight recipients (non-blocking)
    dispatchReport(buildReceiptReport({ scanId: id, kitchen, extraction, check, source: "whatsapp" }));

    return Response.json({ ok: true, scanId: id, risk: check.riskLevel });
  } catch (err) {
    console.error("[wa-webhook]", err);
    await sendWaReply(from, "❌ Terjadi kesalahan saat memproses struk. Coba kirim ulang foto yang lebih jelas.", provider);
    return Response.json({ ok: false, error: String(err) });
  }
}
