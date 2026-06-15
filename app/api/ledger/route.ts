import { z } from "zod";
import { getLedgerState, resetDemoData, restoreLedger, tamperLedger } from "@/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(await getLedgerState());
}

const ActionSchema = z.object({ action: z.enum(["tamper", "restore", "reset"]) });

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 422 });
  }

  if (parsed.data.action === "tamper") await tamperLedger();
  else if (parsed.data.action === "reset") await resetDemoData();
  else await restoreLedger();

  return Response.json(await getLedgerState());
}
