import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { listRecordsQuerySchema } from '@/lib/validation/farms';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const url = new URL(_request.url);
    const parsed = listRecordsQuerySchema.safeParse({
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      season: url.searchParams.get('season') ?? undefined,
      year: url.searchParams.get('year') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse('validation_error', 'Invalid query params', 422);
    }
    const filters = parsed.data;

    const farm = await queryOne<{ id: string }>(
      `SELECT id FROM farms
       WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [id, session.accountId]
    );

    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const conditions = ['farm_id = $1'];
    const values: unknown[] = [id];
    let idx = 2;

    if (filters.season) {
      conditions.push(`season = $${idx}`);
      values.push(filters.season);
      idx++;
    }
    if (filters.year) {
      conditions.push(`year = $${idx}`);
      values.push(filters.year);
      idx++;
    }
    if (filters.cursor) {
      const [cursorEventDate, cursorId] = filters.cursor.split('|');
      if (cursorEventDate && cursorId) {
        conditions.push(`(event_date < $${idx} OR (event_date = $${idx} AND id < $${idx + 1}))`);
        values.push(cursorEventDate, cursorId);
        idx += 2;
      }
    }

    const data = await query(
      `SELECT * FROM records
       WHERE ${conditions.join(' AND ')}
       ORDER BY event_date DESC, created_at DESC
       LIMIT $${idx}`,
      [...values, filters.limit]
    );

    return jsonResponse(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}