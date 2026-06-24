import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAppSession } from "@/lib/auth/session";
import { assignableRoles, isAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["user", "admin", "superadmin"]),
  password: z.string().min(6).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const session = await getAppSession();
  if (!session || !isAdmin(session.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 422 });
  }
  const { email, name, role, password } = parsed.data;

  // Enforce privilege boundary: admin can invite users; superadmin can invite users + admins.
  if (!assignableRoles(session.role).includes(role)) {
    return Response.json({ error: "role not allowed" }, { status: 403 });
  }

  // Use supplied password or fall back to "mbg123" default.
  const finalPassword = password ?? "mbg123";

  const h = await headers();
  try {
    await auth.api.createUser({
      body: { email, name, password: finalPassword, role },
      headers: h,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "createUser failed" }, { status: 400 });
  }

  return Response.json({ ok: true, defaultPassword: finalPassword });
}
