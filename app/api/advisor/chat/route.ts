/* POST /api/advisor/chat — send a farmer message, receive streaming advisor
   response via SSE. Creates a conversation if conversationId is omitted.
   Saves both farmer and advisor messages to the database after the stream
   completes. Generates a conversation summary for memory. Gracefully
   degrades with a 503 when the model is unavailable. */

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

const MAX_INPUT_TOKENS_ESTIMATE = 2000; // ~500 words, generous for farming questions
const MAX_CONTEXT_MESSAGES = 20;

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

async function loadUserProfile(accountId: string): Promise<{ fullName: string; district: string }> {
  const user = await queryOne<{ full_name: string }>(
    `SELECT full_name FROM users WHERE id = $1`,
    [accountId],
  );

  const firstFarm = await queryOne<{ district: string; lat: string; lng: string }>(
    `SELECT district, lat, lng FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [accountId],
  );

  return {
    fullName: user?.full_name ?? "Farmer",
    district: firstFarm?.district ?? "Multan",
  };
}

async function loadFarms(accountId: string): Promise<FarmSummary[]> {
  const rows = await query<{
    id: string;
    name: string;
    location: string;
    acres: string;
    crops: string | string[];
    growth_stages: Record<string, string>;
  }>(
    `SELECT id, name, location, acres, crops, growth_stages
     FROM farms WHERE account_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [accountId],
  );

  return rows.map(f => {
    const crops = Array.isArray(f.crops)
      ? f.crops.join(", ")
      : typeof f.crops === "string"
        ? ((): string => {
            try {
              const parsed = JSON.parse(f.crops as string);
              return Array.isArray(parsed) ? parsed.join(", ") : String(f.crops);
            } catch {
              return String(f.crops);
            }
          })()
        : String(f.crops);

    const stages = f.growth_stages ?? {};
    const stageEntries = Object.entries(stages);
    const stage = stageEntries.length > 0
      ? stageEntries[0][1]
      : "unknown";

    return {
      id: f.id,
      name: f.name,
      location: f.location,
      acres: Number(f.acres),
      crops,
      stage,
      health: "good" as const,
    };
  });
}

async function loadRecentSummaries(
  accountId: string,
  excludeConvId: string,
): Promise<string> {
  const rows = await query<{ title: string; summary: string; updated_at: string }>(
    `SELECT title, summary, updated_at
     FROM advisor_conversations
     WHERE account_id = $1
       AND summary IS NOT NULL
       AND id != $2
     ORDER BY updated_at DESC
     LIMIT 3`,
    [accountId, excludeConvId],
  );

  if (rows.length === 0) return "";

  return rows.map(r => {
    const date = new Date(r.updated_at).toLocaleDateString("en-PK", {
      month: "short", day: "numeric",
    });
    return `• "${r.title}" (${date}): ${r.summary}`;
  }).join("\n");
}

/**
 * Estimate token count: rough heuristic of 1 token ≈ 4 chars for English,
 * ~2 chars for Urdu script. Used for cost control.
 */
function estimateTokens(text: string): number {
  const urduChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const otherChars = text.length - urduChars;
  return Math.ceil(urduChars / 2 + otherChars / 4);
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to use the advisor.", 401);

  // Dual rate limiting: per-IP and per-account
  if (!hitLimiter("advisor-chat", clientIp(request), 30, HOUR_MS)) {
    return errorResponse("rate_limited", "Too many requests. Try again in a moment.", 429);
  }
  if (!hitLimiter("advisor-chat-account", session.accountId, 50, HOUR_MS)) {
    return errorResponse("rate_limited", "You've used the advisor a lot today. Try again later.", 429);
  }

  const body = await readJsonBody(request);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
  }
  const { conversationId, message } = parsed.data;

  // Token budget: reject absurdly long messages
  const inputTokens = estimateTokens(message);
  if (inputTokens > MAX_INPUT_TOKENS_ESTIMATE) {
    return errorResponse(
      "validation_error",
      "Your message is too long. Please keep it under 2000 characters.",
      422,
    );
  }

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
     LIMIT $2`,
    [convId, MAX_CONTEXT_MESSAGES]
  );

  const historyText = (existingMessages ?? [])
    .map((m: { role: string; content: string }) =>
      m.role === "farmer" ? `Farmer: ${m.content}` : `Advisor: ${m.content}`,
    )
    .join("\n\n");

  const [profile, farms, recentSummaries] = await Promise.all([
    loadUserProfile(session.accountId),
    loadFarms(session.accountId),
    loadRecentSummaries(session.accountId, convId),
  ]);

  const seasonInfo = getCurrentSeason();
  const now = new Date();

  const ctx: FarmerContext = {
    accountId: session.accountId,
    farmerName: profile.fullName,
    language: "en",
    farms,
    currentSeason: seasonInfo.season,
    seasonPhase: seasonInfo.phase,
    currentDate: now.toLocaleDateString("en-PK", {
      year: "numeric", month: "long", day: "numeric",
    }),
    currentMonth: now.getMonth(),
    district: profile.district,
    conversationHistory: historyText || undefined,
    recentSummaries: recentSummaries || undefined,
  };

  const agent = createTriageAgent(ctx);

  let result;
  try {
    result = await run(agent, farmerMessage, {
      stream: true,
      maxTurns: 10, // Limit agent turns to prevent infinite loops
    });
  } catch (err) {
    console.error("[Advisor Chat] Agent run failed:", err);
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
      [now.toISOString(), convId]
    );

    // Log token usage for cost monitoring
    const outputTokens = estimateTokens(advisorOutput);
    console.log(
      `[Advisor Chat] account=${session.accountId} input≈${inputTokens}t output≈${outputTokens}t conv=${convId}`
    );
  }, farmerMessage);

  return new Response(sseStream, { headers: sseHeaders });
}
