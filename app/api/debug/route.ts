import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const APP_ID = process.env.IMOU_APP_ID ?? "lc13e01d21d1444520";
  const APP_SECRET = process.env.IMOU_APP_SECRET ?? "ce2fed6c3ada47f981058d864a995c";
  const BASE = "https://openapi-sg.easy4ip.com/openapi";

  const ts = Math.floor(Date.now() / 1000);
  const nc = crypto.randomUUID();
  const sign = crypto.createHash("md5")
    .update(`time:${ts},nonce:${nc},appSecret:${APP_SECRET}`)
    .digest("hex");

  try {
    const r = await fetch(`${BASE}/accessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: { ver: "1.0", appId: APP_ID, sign, time: ts, nonce: nc },
        params: { appId: APP_ID, appSecret: APP_SECRET },
      }),
    });
    const data = await r.json();
    return NextResponse.json({
      env: { APP_ID: APP_ID.slice(0,8)+"...", APP_SECRET: APP_SECRET.slice(0,8)+"...", len: APP_SECRET.length },
      imou: { code: data.result?.code, msg: data.result?.msg },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
