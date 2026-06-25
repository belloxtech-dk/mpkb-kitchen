/**
 * Food quality analyzer — uses AI vision to assess:
 * - Food freshness & hygiene appearance
 * - Nutritional balance (protein, carbs, vegetables)
 * - Portion size vs MBG standards (600 kcal/meal)
 * - Presentation & temperature indicators
 * - Quantity count
 *
 * Routes to Gemini Flash (medium task) — cheap + fast vision.
 */

import crypto from "crypto";
import { getModelForTask } from "./model-router";

const BASE = "https://openapi-sg.easy4ip.com/openapi";
const APP_ID = process.env.IMOU_APP_ID ?? "lc13e01d21d1444520";
const APP_SECRET = process.env.IMOU_APP_SECRET ?? "ce2fed6c3ada47f981058d864a995c";

function makeSig(ts: number, nonce: string) {
  return crypto.createHash("md5")
    .update(`time:${ts},nonce:${nonce},appSecret:${APP_SECRET}`)
    .digest("hex");
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

async function captureSnapshot(deviceId: string): Promise<string | null> {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const token = await getImouToken();
  const res = await fetch(`${BASE}/snapCamera`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: makeSig(ts, nonce), time: ts, nonce },
      id: crypto.randomUUID(),
      params: { deviceId, channelId: "0", token },
    }),
  });
  const data = await res.json();
  const imageUrl = data.result?.data?.picUrl as string;
  if (!imageUrl) return null;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
}

export interface FoodQualityResult {
  zone: string;
  kitchenId: string;
  deviceId: string;
  timestamp: string;
  // Quantity
  portionCount: number;
  portionConfidence: "high" | "medium" | "low";
  // Quality
  overallQuality: "excellent" | "good" | "fair" | "poor";
  qualityScore: number; // 0-100
  // Nutrition
  hasProtein: boolean;
  hasCarbs: boolean;
  hasVegetables: boolean;
  nutritionBalance: "balanced" | "partial" | "poor";
  // Freshness
  freshnessIndicator: "fresh" | "acceptable" | "concerning";
  // Findings
  findings: string[];
  recommendations: string[];
  // Raw summary
  summary: string;
}

const FOOD_QUALITY_PROMPT = `You are an MBG (Makan Bergizi Gratis) food quality inspector for Indonesian school meals.

Analyze this kitchen camera image and assess:

1. **QUANTITY**: Count visible meal portions/trays/containers
2. **QUALITY**: Overall food appearance (color, texture, presentation)
3. **NUTRITION**: Can you see protein (meat/fish/egg/tempe/tofu), carbs (rice/bread), vegetables?
4. **FRESHNESS**: Does food look fresh? Any signs of wilting, discoloration, improper storage?
5. **MBG STANDARDS**: Each meal should provide ~600 kcal for school children

MBG meal requirements:
- Main carbohydrate (rice, bread, or potato) 
- Protein source (chicken, fish, egg, tempe, or tofu)
- Vegetables (at least 1 serving)
- No excessive oil, seasoning, or processed food visible

Respond ONLY with valid JSON:
{
  "portionCount": <number or 0 if not visible>,
  "portionConfidence": "high|medium|low",
  "overallQuality": "excellent|good|fair|poor",
  "qualityScore": <0-100>,
  "hasProtein": <boolean>,
  "hasCarbs": <boolean>,
  "hasVegetables": <boolean>,
  "nutritionBalance": "balanced|partial|poor",
  "freshnessIndicator": "fresh|acceptable|concerning",
  "findings": ["<finding 1>", "<finding 2>"],
  "recommendations": ["<rec 1>"],
  "summary": "<2-sentence Bahasa Indonesia summary>"
}`;

/** Analyze food quality from a single camera. */
export async function analyzeFoodQuality(
  deviceId: string,
  zone: string,
  kitchenId: string,
): Promise<FoodQualityResult> {
  const ts = new Date().toISOString();
  const base: FoodQualityResult = {
    zone, kitchenId, deviceId, timestamp: ts,
    portionCount: 0, portionConfidence: "low",
    overallQuality: "fair", qualityScore: 0,
    hasProtein: false, hasCarbs: false, hasVegetables: false,
    nutritionBalance: "poor", freshnessIndicator: "acceptable",
    findings: [], recommendations: [], summary: "Kamera tidak dapat dijangkau.",
  };

  try {
    const imageBase64 = await captureSnapshot(deviceId);
    if (!imageBase64) return { ...base, summary: "Snapshot tidak tersedia." };

    // Use Gemini Flash (medium task) — cheaper than Sonnet for vision
    const { client, model, provider } = getModelForTask("food_quality");
    console.log(`🍱 Food quality check [${zone}] using ${provider}/${model}`);

    const response = await client.messages.create({
      model,
      max_tokens: 800,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: FOOD_QUALITY_PROMPT },
        ],
      }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ...base, summary: "Parse error dari AI." };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      zone, kitchenId, deviceId, timestamp: ts,
      portionCount: Number(parsed.portionCount) || 0,
      portionConfidence: parsed.portionConfidence ?? "low",
      overallQuality: parsed.overallQuality ?? "fair",
      qualityScore: Number(parsed.qualityScore) || 0,
      hasProtein: Boolean(parsed.hasProtein),
      hasCarbs: Boolean(parsed.hasCarbs),
      hasVegetables: Boolean(parsed.hasVegetables),
      nutritionBalance: parsed.nutritionBalance ?? "poor",
      freshnessIndicator: parsed.freshnessIndicator ?? "acceptable",
      findings: parsed.findings ?? [],
      recommendations: parsed.recommendations ?? [],
      summary: parsed.summary ?? "",
    };
  } catch (err) {
    return { ...base, summary: `Error: ${String(err)}` };
  }
}

/** Build WA report message from food quality results. */
export function buildFoodQualityReport(
  results: FoodQualityResult[],
  kitchenLabel: string,
): string {
  const ts = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric",
    month: "short", hour: "2-digit", minute: "2-digit",
  });

  const totalPortions = results.reduce((s, r) => s + r.portionCount, 0);
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.qualityScore, 0) / results.length)
    : 0;

  const scoreEmoji = avgScore >= 80 ? "✅" : avgScore >= 60 ? "⚠️" : "🚨";
  const qualityLabel = avgScore >= 80 ? "BAIK" : avgScore >= 60 ? "CUKUP" : "PERLU PERHATIAN";

  const lines = [
    `🍱 *MPKB — LAPORAN KUALITAS MAKANAN*`,
    `🏠 ${kitchenLabel}`,
    `🕐 ${ts} WIB`,
    ``,
    `${scoreEmoji} *Skor Kualitas: ${avgScore}/100 — ${qualityLabel}*`,
    `📦 *Estimasi Total Porsi: ${totalPortions} porsi*`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
  ];

  for (const r of results) {
    if (r.portionCount === 0 && r.portionConfidence === "low") continue;
    const qEmoji = r.overallQuality === "excellent" ? "🌟"
      : r.overallQuality === "good" ? "✅"
      : r.overallQuality === "fair" ? "⚠️" : "🚨";

    lines.push(`${qEmoji} *${r.zone}*`);
    lines.push(`   Porsi: ${r.portionCount} | Skor: ${r.qualityScore}/100`);

    const nutrition = [
      r.hasCarbs ? "🍚 Karbo" : null,
      r.hasProtein ? "🥩 Protein" : null,
      r.hasVegetables ? "🥦 Sayur" : null,
    ].filter(Boolean).join(" · ") || "❌ Tidak terdeteksi";
    lines.push(`   Gizi: ${nutrition}`);

    const fresh = r.freshnessIndicator === "fresh" ? "✅ Segar"
      : r.freshnessIndicator === "acceptable" ? "⚠️ Cukup" : "🚨 Perlu cek";
    lines.push(`   Kesegaran: ${fresh}`);

    if (r.findings.length > 0) {
      lines.push(`   📋 ${r.findings[0]}`);
    }
    lines.push("");
  }

  lines.push(`━━━━━━━━━━━━━━━━━━`);

  // Nutrition summary across all zones
  const balanced = results.filter(r => r.nutritionBalance === "balanced").length;
  lines.push(`📊 *Ringkasan Gizi:*`);
  lines.push(`   Protein: ${results.filter(r => r.hasProtein).length}/${results.length} zona`);
  lines.push(`   Sayuran: ${results.filter(r => r.hasVegetables).length}/${results.length} zona`);
  lines.push(`   Seimbang: ${balanced}/${results.length} zona`);

  // Alerts
  const issues = results.filter(r => r.freshnessIndicator === "concerning" || r.overallQuality === "poor");
  if (issues.length > 0) {
    lines.push(``, `🚨 *PERHATIAN SEGERA:*`);
    for (const r of issues) {
      lines.push(`• ${r.zone}: ${r.summary}`);
    }
  }

  lines.push(``, `🔗 Dashboard: ${process.env.BETTER_AUTH_URL ?? "http://localhost:3786"}/floor`);
  return lines.join("\n");
}
