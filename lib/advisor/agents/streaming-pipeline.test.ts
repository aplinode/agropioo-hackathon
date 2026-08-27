import http from "node:http";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { run } from "@openai/agents";
import { toSSEStream } from "../streaming";
import { createTriageAgent } from "./triage";

/* Bug found in production testing: advisor messages persisted as empty
   strings. This pins the full pipeline — run stream, drain events, await
   completed, read finalOutput — so persistence gets real text. */

let server: http.Server;

beforeAll(async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  vi.stubEnv("ADVISOR_MODEL", "test-model");
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      const body = JSON.parse(raw);
      // The SDK requests stream:true — respond with a real SSE stream.
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      const finalResponse = JSON.stringify({
        id: "r",
        object: "response",
        status: "completed",
        model: body.model,
        output: [
          {
            type: "message",
            id: "m1",
            status: "completed",
            role: "assistant",
            content: [{ type: "output_text", text: "Hello farmer" }],
          },
        ],
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      });
      res.write(`data: ${JSON.stringify({ type: "response.output_text.delta", delta: "Hello " })}\n\n`);
      // "slow" requests hold the second delta back so the cancel test can
      // disconnect deterministically after the first one.
      if (JSON.stringify(body.input).includes("slow")) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      res.write(`data: ${JSON.stringify({ type: "response.output_text.delta", delta: "farmer" })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "response.completed", response: JSON.parse(finalResponse) })}\n\n`);
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address === "object" && address) {
    vi.stubEnv("OPENAI_BASE_URL", `http://127.0.0.1:${address.port}/v1`);
  }
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("streaming + persistence pipeline", () => {
  it("finalOutput is non-empty after awaiting completed", async () => {
    const agent = createTriageAgent({ accountId: "a", farmerName: "T", language: "en", farms: [], currentSeason: "Kharif" });
    const result = await run(agent, "hello", { stream: true });
    const stream = toSSEStream(result, "conv-1");

    const reader = stream.getReader();
    const chunks: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }

    const sseText = chunks.join("");
    expect(sseText).toContain('{"type":"conversation","id":"conv-1"}');
    expect(sseText).toContain('"delta":"Hello "');
    expect(sseText).toContain('"delta":"farmer"');
    expect(sseText).toContain('"type":"done"');

    await result.completed;
    expect(result.finalOutput).toBe("Hello farmer");
  });

  it("onFinished receives the full output exactly once on success", async () => {
    const agent = createTriageAgent({ accountId: "a", farmerName: "T", language: "en", farms: [], currentSeason: "Kharif" });
    const result = await run(agent, "hello", { stream: true });
    let calls = 0;
    let persisted = "";
    const stream = toSSEStream(result, "conv-1", (output) => {
      calls += 1;
      persisted = output;
    });

    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      void value;
    }

    expect(calls).toBe(1);
    expect(persisted).toBe("Hello farmer");
  });

  it("onFinished receives partial text when the consumer disconnects mid-stream", async () => {
    const agent = createTriageAgent({ accountId: "a", farmerName: "T", language: "en", farms: [], currentSeason: "Kharif" });
    const result = await run(agent, "slow hello", { stream: true });
    let calls = 0;
    let persisted = "";
    const stream = toSSEStream(result, "conv-2", (output) => {
      calls += 1;
      persisted = output;
    });

    // Read until the first delta lands, then walk away (client disconnect).
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (decoder.decode(value).includes('"delta":"Hello "')) break;
    }
    await reader.cancel();

    expect(calls).toBe(1);
    expect(persisted).toBe("Hello ");
  });
});
