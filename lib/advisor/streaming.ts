import type { StreamedRunResult, Agent, UnknownContext } from "@openai/agents";

/**
 * Transforms an OpenAI Agents SDK StreamedRunResult into a Server-Sent Events
 * ReadableStream suitable for Next.js Route Handlers.
 *
 * Events emitted:
 *   data: {"type":"text","delta":"..."}   — text chunk
 *   data: {"type":"done","output":"..."}  — full final output
 *   data: {"type":"error","message":"..."} — error during generation
 */
export function toSSEStream<TAgent extends Agent<UnknownContext>>(
  result: StreamedRunResult<UnknownContext, TAgent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of result) {
          if (
            event.type === "raw_model_stream_event" &&
            event.data.type === "output_text_delta"
          ) {
            const payload = JSON.stringify({
              type: "text",
              delta: event.data.delta,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        }

        await result.completed;

        const payload = JSON.stringify({
          type: "done",
          output: result.finalOutput ?? "",
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error during generation";
        const payload = JSON.stringify({ type: "error", message });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

export const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;
