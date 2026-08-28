/* GET  /api/advisor/conversations — list the signed-in farmer's conversations
   POST /api/advisor/conversations — create a new conversation */

import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { createConversationSchema } from "@/lib/validation/advisor";

export async function GET() {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view conversations.", 401);

  const data = await query<{ id: string; title: string; language: string; created_at: string; updated_at: string }>(
    `SELECT id, title, language, created_at, updated_at
     FROM advisor_conversations
     WHERE account_id = $1
     ORDER BY updated_at DESC`,
    [session.accountId]
  );

  return jsonResponse({ conversations: data });
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to create conversations.", 401);

  const body = await readJsonBody(request);
  const parsed = createConversationSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
  }

  const conv = await queryOne<{ id: string; title: string; language: string; created_at: string; updated_at: string }>(
    `INSERT INTO advisor_conversations (account_id, title, language)
     VALUES ($1, $2, $3)
     RETURNING id, title, language, created_at, updated_at`,
    [session.accountId, "New conversation", parsed.data.language]
  );

  if (!conv) {
    return errorResponse("server_error", "Could not create conversation.", 500);
  }

  return jsonResponse({ conversation: conv }, 201);
}
