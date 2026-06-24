import { z } from "zod";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAppSession } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ key: z.string().startsWith("sk-ant-") });

export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session || !isSuperadmin(session.role))
    return Response.json({ error: "forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid key format" }, { status: 422 });

  const envPath = join(process.cwd(), ".env.local");
  let content = "";
  try { content = readFileSync(envPath, "utf8"); } catch { /* new file */ }

  if (content.includes("ANTHROPIC_API_KEY=")) {
    content = content.replace(/^ANTHROPIC_API_KEY=.*/m, `ANTHROPIC_API_KEY=${parsed.data.key}`);
  } else {
    content = `ANTHROPIC_API_KEY=${parsed.data.key}\n` + content;
  }

  writeFileSync(envPath, content, "utf8");
  return Response.json({ ok: true });
}
