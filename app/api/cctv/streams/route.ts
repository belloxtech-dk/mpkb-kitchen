import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { KITCHEN_CAMERAS, getCamerasByKitchen } from "@/lib/fleet/cameras";

const BASE = "https://openapi-sg.easy4ip.com/openapi";
const APP_ID = process.env.IMOU_APP_ID ?? "lc13e01d21d1444520";
const APP_SECRET = process.env.IMOU_APP_SECRET ?? "ce2fed6c3ada47f981058d864a995c";

function makeSig(ts: number, nonce: string) {
  return crypto.createHash("md5")
    .update(`time:${ts},nonce:${nonce},appSecret:${APP_SECRET}`)
    .digest("hex");
}

async function getToken(): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const res = await fetch(`${BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: makeSig(ts, nonce), time: ts, nonce },
      params: { appId: APP_ID, appSecret: APP_SECRET },
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.result?.code !== "0") throw new Error(`Token error: ${data.result?.msg}`);
  return data.result.data.accessToken;
}

async function apiCall(endpoint: string, params: Record<string, unknown>, token: string) {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: { ver: "1.0", appId: APP_ID, sign: makeSig(ts, nonce), time: ts, nonce },
      id: crypto.randomUUID(),
      params: { ...params, token },
    }),
    cache: "no-store",
  });
  return res.json();
}

export const dynamic = "force-dynamic";

/** Wrap HTTP HLS URL in proxy for HTTPS sites (avoids mixed-content block). */
function proxyHls(hls: string | null, origin: string): string | null {
  if (!hls) return null;
  if (hls.startsWith("https")) return hls; // already HTTPS
  return `${origin}/api/cctv/proxy?url=${encodeURIComponent(hls)}`;
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const kitchenId = req.nextUrl.searchParams.get("kitchen");

  try {
    // Filter cameras by kitchen if specified
    const cameras = kitchenId
      ? getCamerasByKitchen(kitchenId)
      : KITCHEN_CAMERAS;

    const streams = await Promise.allSettled(
      cameras.map(async (cam) => {
        const t = await getToken();
        let r = await apiCall("bindDeviceLive", {
          deviceId: cam.deviceId, channelId: cam.channelId, streamId: 1,
        }, t);

        // LV1001 = already bound — get stream info directly
        if (r.result?.code === "LV1001") {
          const t2 = await getToken();
          r = await apiCall("getLiveStreamInfo", {
            deviceId: cam.deviceId, channelId: cam.channelId,
          }, t2);
        }

        type S = { hls?: string; streamId?: number };
        const arr = r.result?.data?.streams as S[] | undefined;
        const preferred = arr?.find(s => s.streamId === 1) ?? arr?.[0];

        const rawHls = preferred?.hls ?? null;
        return {
          name: cam.name,
          deviceId: cam.deviceId,
          kitchenId: cam.kitchenId,
          zone: cam.zone,
          status: r.result?.code === "0" ? "online" : "offline",
          hls: proxyHls(rawHls, origin),
        };
      })
    );

    const result = streams.map((s, i) =>
      s.status === "fulfilled" ? s.value : {
        name: cameras[i]?.name ?? "Unknown",
        deviceId: cameras[i]?.deviceId ?? "",
        kitchenId: cameras[i]?.kitchenId ?? "",
        zone: cameras[i]?.zone ?? "other",
        status: "offline", hls: null,
      }
    );

    return NextResponse.json({ ok: true, streams: result, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("CCTV streams error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
