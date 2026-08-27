import { getSupabase } from '@/lib/supabase';
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
    const query = parsed.data;

    const supabase = getSupabase();
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('id')
      .eq('id', id)
      .eq('account_id', session.accountId)
      .is('archived_at', null)
      .maybeSingle();

    if (farmError) return errorResponse('server_error', farmError.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    let recordsQuery = supabase
      .from('records')
      .select('*')
      .eq('farm_id', id)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(query.limit);

    if (query.season) {
      recordsQuery = recordsQuery.eq('season', query.season);
    }
    if (query.year) {
      recordsQuery = recordsQuery.eq('year', query.year);
    }
    if (query.cursor) {
      const [cursorCreatedAt, cursorId] = query.cursor.split('|');
      if (cursorCreatedAt && cursorId) {
        recordsQuery = recordsQuery.or(`and(event_date.lt.${cursorCreatedAt}),and(event_date.eq.${cursorCreatedAt},id.lt.${cursorId})`);
      }
    }

    const { data, error } = await recordsQuery;
    if (error) return errorResponse('server_error', error.message, 500);
    return jsonResponse(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}