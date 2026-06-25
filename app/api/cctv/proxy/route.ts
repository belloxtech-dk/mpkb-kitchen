/**
 * HLS stream proxy — solves mixed-content (HTTP stream on HTTPS site).
 * Usage: /api/cctv/proxy?url=<encoded-hls-url>
 * Streams m3u8 playlists and TS segments with proper headers.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_HOSTS = [
  "cmgw-sg.easy4ipcloud.com",
  "easy4ipcloud.com",
  "lechange.com",
  "imoulife.com",
];

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let targetUrl: URL;
  try {
    targetUrl = new URL(decodeURIComponent(rawUrl));
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Security: only proxy from known Imou/Dahua CDN hosts
  if (!ALLOWED_HOSTS.some(h => targetUrl.hostname.endsWith(h))) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: { "User-Agent": "ImouPlayer/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    // For m3u8 playlists: rewrite all URLs to go through proxy too
    if (contentType.includes("mpegurl") || targetUrl.pathname.endsWith(".m3u8")) {
      const text = new TextDecoder().decode(body);
      const base = `${targetUrl.protocol}//${targetUrl.host}`;
      const baseDir = targetUrl.pathname.split("/").slice(0, -1).join("/");
      const origin = req.nextUrl.origin;

      const rewritten = text.replace(/^(?!#)(.+\.(?:m3u8|ts|mp4))(\?.*)?$/gm, (match, path, qs) => {
        let fullUrl: string;
        if (path.startsWith("http")) {
          fullUrl = path + (qs ?? "");
        } else if (path.startsWith("/")) {
          fullUrl = base + path + (qs ?? "");
        } else {
          fullUrl = `${base}${baseDir}/${path}${qs ?? ""}`;
        }
        return `${origin}/api/cctv/proxy?url=${encodeURIComponent(fullUrl)}`;
      });

      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
