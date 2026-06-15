import { AnalyzeRequestSchema } from "@/schemas/analyze";
import { encodeSse, type AnalysisEvent } from "@/lib/events";
import { createVisionStream, deriveAlert, extractVerdict } from "@/lib/vision";
import { sendTelegramAlert } from "@/lib/telegram";
import { recordSopEvent } from "@/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 422 });
  }
  const { zone, source, imageBase64, mediaType, locale } = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AnalysisEvent) => controller.enqueue(encoder.encode(encodeSse(event)));
      try {
        send({ type: "status", state: "started", zone, source });

        const vision = createVisionStream({ imageBase64, mediaType, zone, locale });
        vision.on("text", (delta: string) => send({ type: "reasoning_delta", text: delta }));

        const final = await vision.finalMessage();
        const verdict = extractVerdict(final);

        const { event, stamp } = recordSopEvent({ zone, source, verdict });
        send({ type: "verdict", eventId: event.id, verdict, ledger: stamp });

        const alert = deriveAlert(zone, verdict, locale);
        if (alert) {
          const delivered = await sendTelegramAlert(alert);
          send({ type: "alert", alert: { ...alert, delivered } });
        }

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
