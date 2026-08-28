/* GET    /api/advisor/conversations/[id] — fetch a single conversation
   PATCH  /api/advisor/conversations/[id] — rename a conversation
   DELETE /api/advisor/conversations/[id] — delete a conversation and its messages */

import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { renameConversationSchema } from "@/lib/validation/advisor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view conversations.", 401);

  const { id } = await params;

  const conv = await queryOne<{ id: string; title: string; language: string; created_at: string; updated_at: string }>(
    `SELECT id, title, language, created_at, updated_at
     FROM advisor_conversations
     WHERE id = $1 AND account_id = $2`,
    [id, session.accountId]
  );

  if (!conv) {
    return errorResponse("server_error", "Conversation not found.", 404);
  }

  return jsonResponse({ conversation: conv });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to rename conversations.", 401);

  const { id } = await params;
  const body = await readJsonBody(request);
  const parsed = renameConversationSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
  }

  const conv = await queryOne<{ id: string; title: string; language: string; created_at: string; updated_at: string }>(
    `UPDATE advisor_conversations
     SET title = $1, updated_at = $2
     WHERE id = $3 AND account_id = $4
     RETURNING id, title, language, created_at, updated_at`,
    [parsed.data.title, new Date().toISOString(), id, session.accountId]
  );

  if (!conv) {
    return errorResponse("server_error", "Conversation not found.", 404);
  }

  return jsonResponse({ conversation: conv });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to delete conversations.", 401);

  const { id } = await params;

  await query(
    `DELETE FROM advisor_conversations WHERE id = $1 AND account_id = $2`,
    [id, session.accountId]
  );

  return jsonResponse({ deleted: true });
}
