import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAppSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { getUserBrief } from "@/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ userId: z.string().min(1), action: z.enum(["revoke", "restore"]) });

export async function POST(req: Request): Promise<Response> {
  const session = await getAppSession();
  if (!session || !isAdmin(session.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 422 });
  }
  const { userId, action } = parsed.data;

  const target = await getUserBrief(userId);
  if (!target) return Response.json({ error: "user not found" }, { status: 404 });
  if (target.role === "superadmin") {
    return Response.json({ error: "cannot revoke a superadmin" }, { status: 403 });
  }
  if (target.id === session.userId) {
    return Response.json({ error: "cannot revoke yourself" }, { status: 403 });
  }

  const h = await headers();
  try {
    if (action === "revoke") {
      await auth.api.banUser({ body: { userId, banReason: "Revoked by admin" }, headers: h });
    } else {
      await auth.api.unbanUser({ body: { userId }, headers: h });
    }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "action failed" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
