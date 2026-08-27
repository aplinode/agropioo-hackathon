import type { StreamedRunResult, Agent } from "@openai/agents";

/**
 * Transforms an OpenAI Agents SDK StreamedRunResult into a Server-Sent Events
 * ReadableStream suitable for Next.js Route Handlers.
 *
 * Events emitted:
 *   data: {"type":"conversation","id":"..."}  — conversation this exchange belongs to (first event)
 *   data: {"type":"text","delta":"..."}       — text chunk
 *   data: {"type":"done","output":"..."}      — full final output
 *   data: {"type":"error","message":"..."}    — error during generation
 *
 * onFinished receives the best-available advisor output exactly once — the
 * final output on success, or whatever streamed before an error/client
 * disconnect — so persistence never writes an empty row over partial text.
 */
export function toSSEStream<TAgent extends Agent<any, any>>(
  result: StreamedRunResult<any, TAgent>,
  conversationId: string,
  onFinished?: (output: string) => void | Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let accumulated = "";
  let finished = false;

  async function finish(output: string) {
    if (finished) return;
    finished = true;
    try {
      await onFinished?.(output);
    } catch {
      // Persistence failure is non-fatal: the farmer still sees the stream.
    }
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const opening = JSON.stringify({ type: "conversation", id: conversationId });
        controller.enqueue(encoder.encode(`data: ${opening}\n\n`));

        for await (const event of result) {
          if (
            event.type === "raw_model_stream_event" &&
            event.data.type === "output_text_delta"
          ) {
            accumulated += event.data.delta;
            const payload = JSON.stringify({
              type: "text",
              delta: event.data.delta,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        }

        await result.completed;

        const output = result.finalOutput ?? accumulated;
        await finish(output);

        const payload = JSON.stringify({
          type: "done",
          output,
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch (err) {
        // Client disconnected or the run failed — keep whatever streamed.
        await finish(accumulated);
        const message =
          err instanceof Error ? err.message : "Unexpected error during generation";
        const payload = JSON.stringify({ type: "error", message });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } finally {
        controller.close();
      }
    },
    async cancel() {
      // Consumer went away (navigation, abort) — persist partial text.
      await finish(accumulated);
    },
  });
}

export const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;
