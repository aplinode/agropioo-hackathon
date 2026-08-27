/* GET  /api/advisor/conversations — list the signed-in farmer's conversations
   POST /api/advisor/conversations — create a new conversation */

import { getSupabase } from "@/lib/supabase";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { createConversationSchema } from "@/lib/validation/advisor";

export async function GET() {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view conversations.", 401);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("advisor_conversations")
    .select("id, title, language, created_at, updated_at")
    .eq("account_id", session.accountId)
    .order("updated_at", { ascending: false });

  if (error) {
    return errorResponse("server_error", "Could not load conversations.", 500);
  }

  return jsonResponse({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to create conversations.", 401);

  const body = await readJsonBody(request);
  const parsed = createConversationSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
  }

  const supabase = getSupabase();
  const { data: conv, error } = await supabase
    .from("advisor_conversations")
    .insert({
      account_id: session.accountId,
      title: "New conversation",
      language: parsed.data.language,
    })
    .select("id, title, language, created_at, updated_at")
    .single();

  if (error || !conv) {
    return errorResponse("server_error", "Could not create conversation.", 500);
  }

  return jsonResponse({ conversation: conv }, 201);
}
