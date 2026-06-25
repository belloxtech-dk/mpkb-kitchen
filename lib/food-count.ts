/**
 * Food portion counter — uses Claude vision to count meal trays/portions
 * leaving the kitchen (Penerimaan Barang / Pemorsian cameras).
 * 
 * Future: compare with school receipt counts to detect ghost meals.
 */

import crypto from "crypto";
import { getAnthropic } from "./anthropic";
import { getModel } from "./anthropic";

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

async function captureSnapshot(deviceId: string, channelId = "0"): Promise<string | null> {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const token = await getImouToken();
  const res = await fetch(`${BASE}/snapCamera`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: makeSig(ts, nonce), time: ts, nonce },
      id: crypto.randomUUID(),
      params: { deviceId, channelId, token },
    }),
  });
  const data = await res.json();
  const imageUrl = data.result?.data?.picUrl as string;
  if (!imageUrl) return null;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
}

export interface FoodCountResult {
  deviceId: string;
  zone: string;
  portionsEstimate: number;
  confidence: "high" | "medium" | "low";
  notes: string;
  timestamp: string;
}

/** Count food portions visible in a camera frame using Claude. */
export async function countPortionsInFrame(
  deviceId: string,
  zone: string,
): Promise<FoodCountResult> {
  const ts = new Date().toISOString();
  const imageBase64 = await captureSnapshot(deviceId);

  if (!imageBase64) {
    return { deviceId, zone, portionsEstimate: 0, confidence: "low", notes: "Camera offline", timestamp: ts };
  }

  const model = await getModel();
  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model,
    max_tokens: 500,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: imageBase64 },
        },
        {
          type: "text",
          text: `You are counting food portions in an MBG school-meal kitchen in Indonesia.

Look at this image from the "${zone}" area and count:
1. Visible meal trays, food containers, or packed meals
2. Estimate total portions if stacked or grouped
3. Note if portions are being loaded onto transport

Respond in JSON only:
{
  "portionsEstimate": <number>,
  "confidence": "high" | "medium" | "low",
  "notes": "<brief observation in English>"
}`,
        },
      ],
    }],
  });

  try {
    const content = response.content[0];
    const text = content?.type === "text" ? content.text : "";
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return {
      deviceId, zone, timestamp: ts,
      portionsEstimate: Number(json.portionsEstimate) || 0,
      confidence: json.confidence ?? "low",
      notes: json.notes ?? "",
    };
  } catch {
    return { deviceId, zone, portionsEstimate: 0, confidence: "low", notes: "Parse error", timestamp: ts };
  }
}

/** Count portions across all distribution cameras. */
export async function countAllPortions(): Promise<FoodCountResult[]> {
  const cameras = [
    { deviceId: "1074CBMPSF9A424", zone: "Pemorsian" },        // Plating/portioning
    { deviceId: "1074CBMPSFB7C1C", zone: "Penerimaan Barang" }, // Dispatch
    { deviceId: "1074CBMPSF4E691", zone: "Ruang Makan" },       // Serving area
  ];

  return Promise.all(cameras.map(c => countPortionsInFrame(c.deviceId, c.zone)));
}
