import { getSupabase } from '@/lib/supabase';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { createFarmSchema } from '@/lib/validation/farms';
import { defaultStagesForCrops } from '@/lib/farms/growth-stages';
import { computeFarmHealth } from '@/lib/farms/health';
import type { CreateFarmInput } from '@/lib/validation/farms';

export async function GET() {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const supabase = getSupabase();
    const { data: farms, error } = await supabase
      .from('farms')
      .select('*')
      .eq('account_id', session.accountId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) return errorResponse('server_error', error.message, 500);

    const enriched = await Promise.all(
      (farms ?? []).map(async (farm) => {
        const { data: recent } = await supabase
          .from('records')
          .select('type, event_date')
          .eq('farm_id', farm.id)
          .order('event_date', { ascending: false })
          .limit(5);

        const { data: seasons } = await supabase
          .from('records')
          .select('season, year')
          .eq('farm_id', farm.id);

        const seasonsSet = new Set<string>();
        (seasons ?? []).forEach((r) => seasonsSet.add(`${r.season} ${r.year}`));

        return {
          ...farm,
          health: computeFarmHealth(farm.growth_stages as Record<string, string>, recent ?? []),
          seasons: Array.from(seasonsSet),
        };
      })
    );

    return jsonResponse(enriched);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const body = await readJsonBody(request);
    const parsed = createFarmSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as CreateFarmInput;
    const supabase = getSupabase();
    const growthStages = defaultStagesForCrops(input.crops);

    const { data, error } = await supabase
      .from('farms')
      .insert({
        account_id: session.accountId,
        name: input.name,
        location: input.location,
        district: input.district,
        lat: input.lat,
        lng: input.lng,
        crops: input.crops,
        acres: input.acres,
        growth_stages: growthStages,
      })
      .select()
      .single();

    if (error) return errorResponse('server_error', error.message, 500);
    return jsonResponse(data, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}