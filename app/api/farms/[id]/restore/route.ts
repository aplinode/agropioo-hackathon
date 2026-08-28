import { queryOne } from '@/lib/db';
import { errorResponse, jsonResponse } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const data = await queryOne(
      `UPDATE farms
       SET archived_at = NULL, updated_at = now()
       WHERE id = $1 AND account_id = $2 AND archived_at IS NOT NULL
       RETURNING *`,
      [id, session.accountId]
    );

    if (!data) return errorResponse('not_found', 'Farm not found', 404);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}