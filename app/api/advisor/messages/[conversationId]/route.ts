/* GET /api/advisor/messages/[conversationId] — load messages for a conversation */

import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view messages.", 401);

  const { conversationId } = await params;

  const conv = await queryOne<{ id: string }>(
    `SELECT id FROM advisor_conversations
     WHERE id = $1 AND account_id = $2`,
    [conversationId, session.accountId]
  );

  if (!conv) {
    return errorResponse("server_error", "Conversation not found.", 404);
  }

  const messages = await query<{ id: string; role: string; content: string; created_at: string }>(
    `SELECT id, role, content, created_at FROM advisor_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return jsonResponse({ messages });
}
