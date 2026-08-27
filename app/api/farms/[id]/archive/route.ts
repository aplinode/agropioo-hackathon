import { getSupabase } from '@/lib/supabase';
import { errorResponse, jsonResponse } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('farms')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('account_id', session.accountId)
      .is('archived_at', null)
      .select()
      .maybeSingle();

    if (error) return errorResponse('server_error', error.message, 500);
    if (!data) return errorResponse('not_found', 'Farm not found', 404);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}