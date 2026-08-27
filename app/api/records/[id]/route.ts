import { getSupabase } from '@/lib/supabase';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { updateRecordSchema } from '@/lib/validation/farms';
import type { UpdateRecordInput } from '@/lib/validation/farms';

async function getOwnedRecord(recordId: string, accountId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('records')
    .select('*, farm:farms!inner(account_id, archived_at)')
    .eq('id', recordId)
    .eq('farm.account_id', accountId)
    .is('farm.archived_at', null)
    .maybeSingle();

  if (error) return { record: null, error };
  return { record: data, error: null };
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
    const supabase = getSupabase();
    const updatePayload: Record<string, unknown> = { ...input };
    if (input.weather_condition !== undefined) {
      const existingWeather = (record.weather as Record<string, unknown>) ?? {};
      updatePayload.weather = {
        ...existingWeather,
        condition: input.weather_condition,
        fetched_at: new Date().toISOString(),
      };
    }

    const { data, error: updateError } = await supabase
      .from('records')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return errorResponse('server_error', updateError.message, 500);
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

    const supabase = getSupabase();
    await supabase.from('records').delete().eq('id', id);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
