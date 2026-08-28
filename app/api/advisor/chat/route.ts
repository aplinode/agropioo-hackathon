/* POST /api/advisor/chat — send a farmer message, receive streaming advisor
   response via SSE. Creates a conversation if conversationId is omitted.
   Saves both farmer and advisor messages to the database after the stream
   completes. Gracefully degrades with a 503 when the model is unavailable. */

import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, readJsonBody, clientIp } from "@/lib/http";
import { hitLimiter, HOUR_MS } from "@/lib/auth/rate-limit";
import { chatSchema } from "@/lib/validation/advisor";
import { createTriageAgent } from "@/lib/advisor/agents/triage";
import { getCurrentSeason } from "@/lib/advisor/context";
import type { FarmerContext, FarmSummary } from "@/lib/advisor/context";
import { run } from "@openai/agents";
import { toSSEStream, sseHeaders } from "@/lib/advisor/streaming";
import { demoFarms } from "@/app/(farmer)/(dashboard)/dashboard/demo-data";

async function createConversation(
  accountId: string,
  firstMessage: string,
): Promise<string | undefined> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO advisor_conversations (account_id, title, language)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [accountId, firstMessage.slice(0, 60) || "New conversation", "en"]
  );
  return row?.id;
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to use the advisor.", 401);

  if (!hitLimiter("advisor-chat", clientIp(request), 30, HOUR_MS)) {
    return errorResponse("rate_limited", "Too many requests. Try again in a moment.", 429);
  }

  const body = await readJsonBody(request);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
  }
  const { conversationId, message } = parsed.data;

  const convId =
    conversationId ?? (await createConversation(session.accountId, message));
  if (!convId) {
    return errorResponse("server_error", "Could not create conversation.", 500);
  }

  const farmerMessage = message;

  const existingMessages = await query<{ role: string; content: string }>(
    `SELECT role, content FROM advisor_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT 20`,
    [convId]
  );

  const historyText = (existingMessages ?? [])
    .map((m: { role: string; content: string }) =>
      m.role === "farmer" ? `Farmer: ${m.content}` : `Advisor: ${m.content}`,
    )
    .join("\n\n");

  const farms: FarmSummary[] = demoFarms.map((f) => ({
    id: f.id,
    name: f.name,
    location: f.location,
    acres: f.acres,
    crops: f.crops,
    stage: f.stage,
    health: f.health,
  }));

  const ctx: FarmerContext = {
    accountId: session.accountId,
    farmerName: "Ahmad Ali",
    language: "en",
    farms,
    currentSeason: getCurrentSeason(),
    district: "Multan",
    conversationHistory: historyText || undefined,
  };

  const agent = createTriageAgent(ctx);

  let result;
  try {
    result = await run(agent, farmerMessage, { stream: true });
  } catch {
    return errorResponse(
      "server_error",
      "Advisor service is temporarily unavailable. Please try again in a moment.",
      503,
    );
  }

  const sseStream = toSSEStream(result, convId, async (advisorOutput) => {
    await query(
      `INSERT INTO advisor_messages (conversation_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [convId, "farmer", farmerMessage, "advisor", advisorOutput]
    );

    await query(
      `UPDATE advisor_conversations SET updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), convId]
    );
  });

  return new Response(sseStream, { headers: sseHeaders });
}
