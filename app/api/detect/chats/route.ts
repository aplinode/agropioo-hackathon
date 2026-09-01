import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET() {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view chats.", 401);

  const chats = await query<{
    id: string;
    title: string;
    scan_id: string | null;
    updated_at: string;
  }>(
    `SELECT id, title, scan_id, updated_at FROM detect_chats WHERE account_id = $1 ORDER BY updated_at DESC`,
    [session.accountId],
  );

  return jsonResponse({ chats: chats ?? [] });
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to start a chat.", 401);

  const body = await request.json().catch(() => null);
  const scanId = body?.scanId ?? null;

  let row;
  if (scanId) {
    row = await queryOne<{ id: string }>(
      `SELECT id FROM detect_chats WHERE account_id = $1 AND scan_id = $2 ORDER BY updated_at DESC LIMIT 1`,
      [session.accountId, scanId],
    );
  }

  if (!row) {
    row = await queryOne<{ id: string }>(
      `INSERT INTO detect_chats (account_id, scan_id, title) VALUES ($1, $2, $3) RETURNING id`,
      [session.accountId, scanId, "New detection chat"],
    );
  }

  return jsonResponse({ chatId: row?.id ?? null });
}
