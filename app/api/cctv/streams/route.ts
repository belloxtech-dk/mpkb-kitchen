import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { KITCHEN_CAMERAS, getCamerasByKitchen } from "@/lib/fleet/cameras";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s for pro plan, 10s for hobby

const BASE = "https://openapi-sg.easy4ip.com/openapi";
const APP_ID = process.env.IMOU_APP_ID ?? "lc13e01d21d1444520";
const APP_SECRET = process.env.IMOU_APP_SECRET ?? "ce2fed6c3ada47f981058d864a995c";

function sig(ts: number, nc: string) {
  return crypto.createHash("md5").update(`time:${ts},nonce:${nc},appSecret:${APP_SECRET}`).digest("hex");
}

async function token(): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const nc = crypto.randomUUID();
  const r = await fetch(`${BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: sig(ts, nc), time: ts, nonce: nc },
      params: { appId: APP_ID, appSecret: APP_SECRET },
    }),
    signal: AbortSignal.timeout(8000),
  });
  const d = await r.json();
  if (d.result?.code !== "0") throw new Error(d.result?.msg);
  return d.result.data.accessToken;
}

async function imou(endpoint: string, params: Record<string, unknown>, tok: string) {
  const ts = Math.floor(Date.now() / 1000);
  const nc = crypto.randomUUID();
  const r = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: sig(ts, nc), time: ts, nonce: nc },
      id: crypto.randomUUID(),
      params: { ...params, token: tok },
    }),
    signal: AbortSignal.timeout(8000),
  });
  return r.json();
}

async function getHls(deviceId: string, channelId: string, tok: string): Promise<string | null> {
  // Try getLiveStreamInfo first (faster — no bind needed if already bound)
  const r1 = await imou("getLiveStreamInfo", { deviceId, channelId }, tok);
  if (r1.result?.code === "0") {
    type S = { hls?: string; streamId?: number };
    const arr = r1.result.data.streams as S[];
    return arr?.find(s => s.streamId === 1)?.hls ?? arr?.[0]?.hls ?? null;
  }
  // LV1002 = not bound yet — bind it
  const r2 = await imou("bindDeviceLive", { deviceId, channelId, streamId: 1 }, tok);
  if (r2.result?.code === "0") {
    type S = { hls?: string; streamId?: number };
    const arr = r2.result.data.streams as S[];
    return arr?.find(s => s.streamId === 1)?.hls ?? arr?.[0]?.hls ?? null;
  }
  return null;
}

function proxyHls(hls: string | null, origin: string): string | null {
  if (!hls) return null;
  if (hls.startsWith("https://")) return hls;
  // Proxy HTTP streams through our HTTPS endpoint
  return `${origin}/api/cctv/proxy?url=${encodeURIComponent(hls)}`;
}

export async function GET(req: NextRequest) {
  const kitchenId = req.nextUrl.searchParams.get("kitchen");
  const origin = req.nextUrl.origin;
  const cameras = kitchenId ? getCamerasByKitchen(kitchenId) : KITCHEN_CAMERAS;

  try {
    // Get ONE token and reuse it for all cameras
    const tok = await token();

    // Process in parallel but limit concurrency
    const BATCH = 5;
    const results = [];
    for (let i = 0; i < cameras.length; i += BATCH) {
      const batch = cameras.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        batch.map(async (cam) => {
          const hls = await getHls(cam.deviceId, cam.channelId, tok);
          return {
            name: cam.name, deviceId: cam.deviceId,
            kitchenId: cam.kitchenId, zone: cam.zone,
            status: hls ? "online" : "offline",
            hls: proxyHls(hls, origin),
          };
        })
      );
      results.push(...settled.map((s, j) =>
        s.status === "fulfilled" ? s.value : {
          name: batch[j]?.name ?? "?", deviceId: batch[j]?.deviceId ?? "",
          kitchenId: batch[j]?.kitchenId ?? "", zone: batch[j]?.zone ?? "other",
          status: "offline", hls: null,
        }
      ));
    }

    return NextResponse.json({ ok: true, streams: results, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("CCTV streams error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
