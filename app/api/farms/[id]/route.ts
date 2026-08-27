import { getSupabase } from '@/lib/supabase';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { updateFarmSchema } from '@/lib/validation/farms';
import type { UpdateFarmInput } from '@/lib/validation/farms';

async function getOwnedFarm(farmId: string, accountId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('account_id', accountId)
    .is('archived_at', null)
    .maybeSingle();
  if (error) return { farm: null, error };
  return { farm: data, error: null };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const { farm, error } = await getOwnedFarm(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const supabase = getSupabase();
    const { data: recentRecords } = await supabase
      .from('records')
      .select('*')
      .eq('farm_id', id)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

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
    const supabase = getSupabase();
    const updatePayload: Record<string, unknown> = { ...input };
    if (input.growth_stages) {
      const merged = { ...(farm.growth_stages as Record<string, string>), ...input.growth_stages };
      updatePayload.growth_stages = merged;
    }

    const { data, error: updateError } = await supabase
      .from('farms')
      .update(updatePayload)
      .eq('id', id)
      .eq('account_id', session.accountId)
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
    const { farm, error } = await getOwnedFarm(id, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const supabase = getSupabase();
    const { count } = await supabase
      .from('records')
      .select('id', { count: 'exact', head: true })
      .eq('farm_id', id);

    if ((count ?? 0) > 0) {
      return errorResponse('conflict', 'Delete all records first.', 409);
    }

    await supabase.from('farms').delete().eq('id', id);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}