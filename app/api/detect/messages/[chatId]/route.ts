import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view messages.", 401);

  const { chatId } = await params;

  const chatRow = await queryOne<{ id: string }>(
    `SELECT id FROM detect_chats WHERE id = $1 AND account_id = $2`,
    [chatId, session.accountId],
  );

  if (!chatRow) {
    return errorResponse("not_found", "Chat not found.", 404);
  }

  const messages = await query<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>(
    `SELECT id, role, content, created_at FROM detect_messages WHERE chat_id = $1 ORDER BY created_at ASC`,
    [chatId],
  );

  return jsonResponse({ messages: messages ?? [] });
}
