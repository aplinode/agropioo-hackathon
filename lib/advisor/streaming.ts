import type { RunStreamEvent } from "@openai/agents";
import OpenAI from "openai";
import { query } from "@/lib/db";

const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Post-processing filter: detects language mixing in the advisor response.
 * If mixing is detected in an Urdu response, attempts to fix by removing
 * stray English sentences. Returns the (potentially fixed) output.
 */
function checkLanguageConsistency(text: string): string {
  if (!text || text.length < 10) return text;

  const hasUrdu = URDU_SCRIPT_RE.test(text);
  if (!hasUrdu) return text; // English response — no Urdu expected

  // Split into sentences and check each for English words
  const sentences = text.split(/[.!؟\n]+/).filter(s => s.trim().length > 0);
  const fixedSentences: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length === 0) continue;

    // Count Urdu vs total characters
    const urduChars = (trimmed.match(URDU_SCRIPT_RE) || []).length;
    const totalChars = trimmed.replace(/\s/g, "").length;
    if (totalChars === 0) {
      fixedSentences.push(trimmed);
      continue;
    }

    const urduRatio = urduChars / totalChars;

    // If a sentence has less than 30% Urdu characters and is longer than 10 chars,
    // it's likely an English sentence mixed into an Urdu response — remove it
    if (urduRatio < 0.3 && trimmed.length > 10) {
      console.warn("[Language Filter] Removed English sentence from Urdu response:", trimmed.slice(0, 80));
      continue;
    }

    fixedSentences.push(trimmed);
  }

  // If we removed sentences, rejoin
  if (fixedSentences.length < sentences.length) {
    return fixedSentences.join(". ");
  }

  return text;
}

type StreamResult = {
  [Symbol.asyncIterator](): AsyncIterator<RunStreamEvent>;
  readonly completed: Promise<void>;
  readonly finalOutput: unknown;
};

async function generateAndSaveSummary(
  conversationId: string,
  farmerMessage: string,
  advisorOutput: string,
): Promise<void> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: process.env.ADVISOR_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize this farmer-advisor exchange in 1-2 sentences. Focus on the farmer's question and the key advice given." },
        { role: "user", content: `Farmer: ${farmerMessage}\n\nAdvisor: ${advisorOutput.slice(0, 500)}` },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (summary) {
      await query(
        `UPDATE advisor_conversations SET summary = $1, summary_updated_at = now() WHERE id = $2`,
        [summary, conversationId],
      );
    }
  } catch {
    // Summary generation is non-fatal — conversation still works without it
  }
}

export function toSSEStream(
  result: StreamResult,
  conversationId: string,
  onFinished?: (output: string) => void | Promise<void>,
  farmerMessage?: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let accumulated = "";
  let finished = false;

  async function finish(output: string) {
    if (finished) return;
    finished = true;
    const checked = checkLanguageConsistency(output);
    try {
      await onFinished?.(checked);
      if (farmerMessage && output) {
        await generateAndSaveSummary(conversationId, farmerMessage, checked);
      }
    } catch (error) {
      console.error("[SSE Stream] Failed to persist message:", error);
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

        const final = result.finalOutput;
        const output = typeof final === "string" ? final : accumulated;
        const checkedOutput = checkLanguageConsistency(output);
        await finish(checkedOutput);

        const payload = JSON.stringify({
          type: "done",
          output: checkedOutput,
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch (err) {
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
      await finish(accumulated);
    },
  });
}

export const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;
