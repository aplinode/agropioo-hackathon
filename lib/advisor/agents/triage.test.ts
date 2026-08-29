import http from "node:http";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { run } from "@openai/agents";
import { createTriageAgent } from "./triage";
import type { FarmerContext } from "../context";

/* Regression test: every advisor agent must send the configured ADVISOR_MODEL.
   Agents without an explicit model fall back to the Agents SDK default
   (gpt-5.6-luna), which also injects GPT-5-only request fields
   (text.verbosity, reasoning.effort) that OpenAI-compatible providers like
   Groq reject with `400 unknown field verbosity`. */

let server: http.Server;
const requests: { url: string; body: Record<string, unknown> }[] = [];

beforeAll(async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  vi.stubEnv("ADVISOR_MODEL", "test-advisor-model");
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw) as Record<string, unknown>;
      requests.push({ url: req.url ?? "", body });

      // Only the triage agent exposes handoff tools; specialists answer directly.
      const tools = (body.tools as { name?: string }[] | undefined) ?? [];
      const isTriage = tools.some(
        (t) => typeof t.name === "string" && t.name.startsWith("transfer_to_"),
      );

      let output;
      if (isTriage) {
        const transferTool = tools.find(
          (t) => typeof t.name === "string" && t.name.startsWith("transfer_to_"),
        );
        if (!transferTool?.name) throw new Error("no handoff tool exposed to triage agent");
        output = [
          {
            type: "function_call",
            id: "fc_1",
            call_id: "call_1",
            name: transferTool.name,
            arguments: "{}",
            status: "completed",
          },
        ];
      } else {
        output = [
          {
            type: "message",
            id: "msg_1",
            status: "completed",
            role: "assistant",
            content: [{ type: "output_text", text: "Specialist reply" }],
          },
        ];
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: "resp_test",
          object: "response",
          status: "completed",
          model: body.model,
          output,
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
        }),
      );
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

const ctx: FarmerContext = {
  accountId: "test-account",
  farmerName: "Test Farmer",
  language: "en",
  farms: [],
  currentSeason: "Kharif",
  seasonPhase: "mid",
  currentDate: "29 August 2026",
  currentMonth: 7,
  district: "Multan",
};

describe("advisor agent model configuration", () => {
  it("sends ADVISOR_MODEL on every agent request, including handoff targets", async () => {
    const agent = createTriageAgent(ctx);
    const result = await run(agent, "What disease is on my wheat crop?");

    expect(result.finalOutput).toBe("Specialist reply");
    expect(requests.length).toBeGreaterThanOrEqual(2);

    for (const req of requests) {
      expect(req.url).toContain("/responses");
      expect(req.body.model).toBe("test-advisor-model");
      expect(req.body.verbosity).toBeUndefined();
      expect(req.body.text).toBeUndefined();
      expect(req.body.reasoning).toBeUndefined();
      expect(req.body.reasoning_effort).toBeUndefined();
    }
  });
});
