import { z } from "zod";
import { encodeSse, type FinanceEvent } from "@/lib/events";
import { getScenario } from "@/lib/finance/scenarios";
import { reconcile } from "@/lib/finance/reconcile";
import { createAuditStream, extractAssessment } from "@/lib/finance/audit";
import { recordFinanceEvent } from "@/db/repo";
import { LocaleSchema } from "@/lib/i18n/locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ scenarioId: z.string().min(1), locale: LocaleSchema.default("id") });

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 422 });
  }

  const { scenarioId, locale } = parsed.data;
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return Response.json({ error: `Unknown scenario: ${scenarioId}` }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: FinanceEvent) => controller.enqueue(encoder.encode(encodeSse(event)));
      try {
        send({ type: "status", state: "started", scenarioId: scenario.id });

        // Exact numbers first — UI renders findings immediately, before the AI narrates.
        const reconciliation = reconcile(scenario, locale);
        send({ type: "reconciliation", result: reconciliation });

        const audit = createAuditStream({ scenario, reconciliation, locale });
        audit.on("text", (delta: string) => send({ type: "reasoning_delta", text: delta }));

        const final = await audit.finalMessage();
        const assessment = extractAssessment(final);

        const { event, stamp } = recordFinanceEvent({ scenario, reconciliation, assessment });
        send({ type: "assessment", eventId: event.id, assessment, ledger: stamp });

        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
