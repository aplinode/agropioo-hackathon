import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { updateRecordSchema } from '@/lib/validation/farms';
import type { UpdateRecordInput } from '@/lib/validation/farms';

async function getOwnedRecord(recordId: string, accountId: string) {
  try {
    const record = await queryOne<Record<string, unknown>>(
      `SELECT r.* FROM records r
       JOIN farms f ON f.id = r.farm_id
       WHERE r.id = $1 AND f.account_id = $2 AND f.archived_at IS NULL`,
      [recordId, accountId]
    );
    return { record, error: null };
  } catch (error) {
    return { record: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const { record, error } = await getOwnedRecord(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!record) return errorResponse('not_found', 'Record not found', 404);

    const body = await readJsonBody(_request);
    const parsed = updateRecordSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as UpdateRecordInput;
    const updatePayload: Record<string, unknown> = { ...input };
    if (input.weather_condition !== undefined) {
      const existingWeather = (record.weather as Record<string, unknown>) ?? {};
      updatePayload.weather = {
        ...existingWeather,
        condition: input.weather_condition,
        fetched_at: new Date().toISOString(),
      };
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
    values.push(id);

    const data = await queryOne(
      `UPDATE records SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    );

    if (!data) return errorResponse('server_error', 'Failed to update record', 500);
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
    const { record, error } = await getOwnedRecord(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!record) return errorResponse('not_found', 'Record not found', 404);

    await query(
      `DELETE FROM records WHERE id = $1`,
      [id]
    );
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
