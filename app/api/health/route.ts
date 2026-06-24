import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({
      status: "ok",
      db: "connected",
      ai: !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("PASTE_")),
      ts: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      { status: "error", db: "disconnected", error: String(err) },
      { status: 503 }
    );
  }
}
