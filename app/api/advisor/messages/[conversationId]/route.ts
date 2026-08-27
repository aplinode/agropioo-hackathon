/* GET /api/advisor/messages/[conversationId] — load messages for a conversation */

import { getSupabase } from "@/lib/supabase";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view messages.", 401);

  const { conversationId } = await params;
  const supabase = getSupabase();

  const { data: conv } = await supabase
    .from("advisor_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("account_id", session.accountId)
    .single();

  if (!conv) {
    return errorResponse("server_error", "Conversation not found.", 404);
  }

  const { data: messages, error } = await supabase
    .from("advisor_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return errorResponse("server_error", "Could not load messages.", 500);
  }

  return jsonResponse({ messages: messages ?? [] });
}
