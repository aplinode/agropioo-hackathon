/* GET    /api/advisor/conversations/[id] — fetch a single conversation
   PATCH  /api/advisor/conversations/[id] — rename a conversation
   DELETE /api/advisor/conversations/[id] — delete a conversation and its messages */

import { getSupabase } from "@/lib/supabase";
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
  const supabase = getSupabase();

  const { data: conv, error } = await supabase
    .from("advisor_conversations")
    .select("id, title, language, created_at, updated_at")
    .eq("id", id)
    .eq("account_id", session.accountId)
    .single();

  if (error || !conv) {
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

  const supabase = getSupabase();
  const { data: conv, error } = await supabase
    .from("advisor_conversations")
    .update({ title: parsed.data.title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", session.accountId)
    .select("id, title, language, created_at, updated_at")
    .single();

  if (error || !conv) {
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
  const supabase = getSupabase();

  const { error } = await supabase
    .from("advisor_conversations")
    .delete()
    .eq("id", id)
    .eq("account_id", session.accountId);

  if (error) {
    return errorResponse("server_error", "Could not delete conversation.", 500);
  }

  return jsonResponse({ deleted: true });
}
