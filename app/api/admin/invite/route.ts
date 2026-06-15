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
  const { email, name, role } = parsed.data;

  // Enforce privilege boundary: admin can invite users; superadmin can invite users + admins.
  if (!assignableRoles(session.role).includes(role)) {
    return Response.json({ error: "role not allowed" }, { status: 403 });
  }

  const h = await headers();
  try {
    // Magic-link users never use this password; it satisfies createUser's requirement.
    await auth.api.createUser({
      body: { email, name, password: randomUUID(), role },
      headers: h,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "createUser failed" }, { status: 400 });
  }

  // Best-effort: email the invitee a sign-in link now.
  try {
    await auth.api.signInMagicLink({ body: { email, callbackURL: "/" }, headers: h });
  } catch {
    /* user is created; they can also request a link themselves at /landing */
  }

  return Response.json({ ok: true });
}
