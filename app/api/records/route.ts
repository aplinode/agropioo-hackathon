import { getSupabase } from '@/lib/supabase';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { createRecordSchema } from '@/lib/validation/farms';
import { autoAdvanceStage } from '@/lib/farms/growth-stages';
import { fetchCurrentWeather } from '@/lib/farms/weather';
import type { CreateRecordInput } from '@/lib/validation/farms';

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const body = await readJsonBody(request);
    const parsed = createRecordSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as CreateRecordInput;
    const supabase = getSupabase();

    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('lat, lng, crops, growth_stages, name')
      .eq('id', input.farm_id)
      .eq('account_id', session.accountId)
      .is('archived_at', null)
      .maybeSingle();

    if (farmError) return errorResponse('server_error', farmError.message, 500);
    if (!farm) return errorResponse('not_found', 'Farm not found', 404);

    const weatherCondition = input.weather_condition ?? null;
    let weatherSnapshot: { condition: string | null; temp_c: number | null; humidity: number | null; fetched_at: string | null } = {
      condition: weatherCondition,
      temp_c: null,
      humidity: null,
      fetched_at: null,
    };

    if (!weatherCondition && farm.lat != null && farm.lng != null) {
      const fetched = await fetchCurrentWeather(farm.lat, farm.lng, input.event_date);
      weatherSnapshot = { ...fetched, condition: fetched.condition ?? weatherCondition };
    } else if (weatherCondition) {
      weatherSnapshot.fetched_at = new Date().toISOString();
    }

    const { data: record, error } = await supabase
      .from('records')
      .insert({
        account_id: session.accountId,
        farm_id: input.farm_id,
        type: input.type,
        season: input.season,
        year: input.year,
        event_date: input.event_date,
        title: input.title,
        note: input.note,
        weather: weatherSnapshot,
        yield_qty: input.yield_qty,
        labor_cost: input.labor_cost,
        transport_cost: input.transport_cost,
      })
      .select()
      .single();

    if (error) return errorResponse('server_error', error.message, 500);

    const crops = Array.isArray(farm.crops) ? farm.crops.map(String) : [];
    let growthStages = { ...(farm.growth_stages as Record<string, string>) };
    for (const crop of crops) {
      growthStages = autoAdvanceStage(growthStages, input.type, crop);
    }

    await supabase
      .from('farms')
      .update({ growth_stages: growthStages })
      .eq('id', input.farm_id);

    return jsonResponse(record, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
