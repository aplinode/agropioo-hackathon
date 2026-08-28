import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { updateFarmSchema } from '@/lib/validation/farms';
import type { UpdateFarmInput } from '@/lib/validation/farms';

async function getOwnedFarm(farmId: string, accountId: string) {
  try {
    const farm = await queryOne(
      `SELECT * FROM farms
       WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [farmId, accountId]
    );
    return { farm, error: null };
  } catch (error) {
    return { farm: null, error };
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const { farm, error } = await getOwnedFarm(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const recentRecords = await query(
      `SELECT * FROM records
       WHERE farm_id = $1
       ORDER BY event_date DESC, created_at DESC
       LIMIT 5`,
      [id]
    );

    return jsonResponse({ ...farm, recent_records: recentRecords ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const { farm, error } = await getOwnedFarm(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const body = await readJsonBody(_request);
    const parsed = updateFarmSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as UpdateFarmInput;
    const updatePayload: Record<string, unknown> = { ...input };
    if (input.growth_stages) {
      const merged = { ...(farm.growth_stages as Record<string, string>), ...input.growth_stages };
      updatePayload.growth_stages = merged;
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries(updatePayload)) {
      if (value === undefined) continue;
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    values.push(id, session.accountId);

    const data = await queryOne(
      `UPDATE farms SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $${idx} AND account_id = $${idx + 1}
       RETURNING *`,
      values
    );

    if (!data) return errorResponse('server_error', 'Failed to update farm', 500);
    return jsonResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const { farm, error } = await getOwnedFarm(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const countResult = await queryOne<{ count: string }>(
      `SELECT count(*)::text as count FROM records WHERE farm_id = $1`,
      [id]
    );

    if (Number(countResult?.count ?? 0) > 0) {
      return errorResponse('conflict', 'Delete all records first.', 409);
    }

    await query(
      `DELETE FROM farms WHERE id = $1`,
      [id]
    );
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}