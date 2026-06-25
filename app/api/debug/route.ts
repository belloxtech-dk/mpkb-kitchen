import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    IMOU_APP_ID: process.env.IMOU_APP_ID?.slice(0,8) + "...",
    IMOU_APP_SECRET: process.env.IMOU_APP_SECRET?.slice(0,8) + "...",
    GEMINI: process.env.GEMINI_API_KEY?.slice(0,8) + "...",
    NODE_ENV: process.env.NODE_ENV,
  });
}
