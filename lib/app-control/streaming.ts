import type { RunStreamEvent } from "@openai/agents";
import OpenAI from "openai";
import { query } from "@/lib/db";

const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function checkLanguageConsistency(text: string): string {
  if (!text || text.length < 10) return text;

  const hasUrdu = URDU_SCRIPT_RE.test(text);
  if (!hasUrdu) return text;

  const sentences = text.split(/[.!؟\n]+/).filter((s) => s.trim().length > 0);
  const fixedSentences: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length === 0) continue;

    const urduChars = (trimmed.match(URDU_SCRIPT_RE) || []).length;
    const totalChars = trimmed.replace(/\s/g, "").length;
    if (totalChars === 0) {
      fixedSentences.push(trimmed);
      continue;
    }

    const urduRatio = urduChars / totalChars;

    if (urduRatio < 0.3 && trimmed.length > 10) {
      console.warn("[Language Filter] Removed English sentence from Urdu response:", trimmed.slice(0, 80));
      continue;
    }

    fixedSentences.push(trimmed);
  }

  if (fixedSentences.length < sentences.length) {
    return fixedSentences.join(". ");
  }

  return text;
}

export type StreamResult = {
  [Symbol.asyncIterator](): AsyncIterator<RunStreamEvent>;
  readonly completed: Promise<void>;
  readonly finalOutput: unknown;
};

export type ActionCard = {
  type: "price_table" | "pnl_summary" | "weather_forecast" | "record_diff" | "confirmation";
  data: Record<string, unknown>;
};

export type AppControlEvent =
  | { type: "tool_start"; name: string }
  | { type: "tool_result"; name: string; result: string }
  | { type: "action_card"; card: ActionCard }
  | { type: "navigation_button"; path: string; label: string }
  | { type: "retry"; message: string };

const ACTION_CARD_RE = /\[ACTION_CARD:(\{.*?\})\]/s;
const NAVIGATION_RE = /\[NAVIGATION:(.*?)\|(.*?)\]/;
const RETRY_RE = /\[RETRY:(.*?)\]/;

async function generateAndSaveSummary(
  conversationId: string,
  farmerMessage: string,
  output: string,
): Promise<void> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: process.env.ADVISOR_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize this farmer-app-control exchange in 1-2 sentences. Focus on what the farmer asked and what action was taken or suggested." },
        { role: "user", content: `Farmer: ${farmerMessage}\n\nAgent: ${output.slice(0, 500)}` },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (summary) {
      await query(
        `UPDATE app_control_conversations SET summary = $1, updated_at = now() WHERE id = $2`,
        [summary, conversationId],
      );
    }
  } catch {
    // summary generation is non-fatal
  }
}

export function toAppControlSSEStream(
  result: StreamResult,
  conversationId: string,
  onEvent?: (event: AppControlEvent) => void,
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
          if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
            accumulated += event.data.delta;
            const payload = JSON.stringify({ type: "text", delta: event.data.delta });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          } else if (event.type === "tool_call_stream_event" || event.type === "tool_call_item") {
            onEvent?.({ type: "tool_start", name: event.name ?? "unknown" });
          } else if (event.type === "tool_output_stream_event" || event.type === "tool_output_item") {
            const resultText = typeof event.output === "string" ? event.output : JSON.stringify(event.output);
            onEvent?.({ type: "tool_result", name: event.name ?? "unknown", result: resultText });
          }
        }

        await result.completed;

        const final = result.finalOutput;
        const output = typeof final === "string" ? final : accumulated;

        const checkedOutput = checkLanguageConsistency(output);

        const actionCardMatch = output.match(ACTION_CARD_RE);
        if (actionCardMatch) {
          try {
            const cardData = JSON.parse(actionCardMatch[1]);
            onEvent?.({ type: "action_card", card: cardData as ActionCard });
          } catch {
            // ignore malformed marker
          }
        }

        const navMatch = output.match(NAVIGATION_RE);
        if (navMatch) {
          onEvent?.({ type: "navigation_button", path: navMatch[1], label: navMatch[2] });
        }

        const retryMatch = output.match(RETRY_RE);
        if (retryMatch) {
          onEvent?.({ type: "retry", message: retryMatch[1] });
        }

        await finish(checkedOutput);

        const payload = JSON.stringify({ type: "done", output: checkedOutput });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch (err) {
        await finish(accumulated);
        const message = err instanceof Error ? err.message : "Unexpected error during generation";
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
