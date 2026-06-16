import { z } from "zod";
import { getAppSession } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/roles";
import { setSetting } from "@/db/settings";
import { ModelIdSchema, MODEL_SETTING_KEY } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ model: ModelIdSchema });

export async function POST(req: Request): Promise<Response> {
  const session = await getAppSession();
  if (!session || !isSuperadmin(session.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid model" }, { status: 422 });
  }

  await setSetting(MODEL_SETTING_KEY, parsed.data.model);
  return Response.json({ ok: true, model: parsed.data.model });
}
