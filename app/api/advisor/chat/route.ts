/* POST /api/advisor/chat — send a farmer message, receive streaming advisor
   response via SSE. Creates a conversation if conversationId is omitted.
   Saves both farmer and advisor messages to the database after the stream
   completes. Gracefully degrades with a 503 when the model is unavailable. */

import { getSupabase } from "@/lib/supabase";
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

  const supabase = getSupabase();

  let convId = conversationId;
  if (!convId) {
    const { data: newConv, error: convErr } = await supabase
      .from("advisor_conversations")
      .insert({
        account_id: session.accountId,
        title: message.slice(0, 60) || "New conversation",
        language: "en",
      })
      .select("id")
      .single();

    if (convErr || !newConv) {
      return errorResponse("server_error", "Could not create conversation.", 500);
    }
    convId = newConv.id;
  }

  const farmerMessage = message;

  const { data: existingMessages } = await supabase
    .from("advisor_messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(20);

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

  const sseStream = toSSEStream(result);

  void (async () => {
    try {
      await result.completed;
      const advisorOutput = result.finalOutput ?? "";

      await supabase.from("advisor_messages").insert([
        { conversation_id: convId, role: "farmer", content: farmerMessage },
        { conversation_id: convId, role: "advisor", content: advisorOutput },
      ]);

      await supabase
        .from("advisor_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    } catch {
      // fire-and-forget: message persistence failure is non-fatal for the stream
    }
  })();

  return new Response(sseStream, { headers: sseHeaders });
}
