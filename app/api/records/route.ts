import { queryOne, withTransaction } from '@/lib/db';
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

    const farm = await queryOne<{ lat: number; lng: number; crops: unknown; growth_stages: unknown; name: string }>(
      `SELECT lat, lng, crops, growth_stages, name FROM farms
       WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [input.farm_id, session.accountId]
    );

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

    const crops = Array.isArray(farm.crops) ? farm.crops.map(String) : [];
    let growthStages = { ...(farm.growth_stages as Record<string, string>) };
    for (const crop of crops) {
      growthStages = autoAdvanceStage(growthStages, input.type, crop);
    }

    const record = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `INSERT INTO records (
           account_id, farm_id, type, season, year, event_date,
           title, note, weather, yield_qty, labor_cost, transport_cost,
           client_uuid
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (client_uuid) DO NOTHING
         RETURNING *`,
        [
          session.accountId,
          input.farm_id,
          input.type,
          input.season,
          input.year,
          input.event_date,
          input.title ?? null,
          input.note ?? null,
          JSON.stringify(weatherSnapshot),
          input.yield_qty ?? null,
          input.labor_cost ?? null,
          input.transport_cost ?? null,
          input.client_uuid ?? null,
        ]
      );

      let row = insertResult.rows[0];

      if (!row && input.client_uuid) {
        const existing = await client.query(
          `SELECT * FROM records WHERE client_uuid = $1 LIMIT 1`,
          [input.client_uuid]
        );
        row = existing.rows[0];
      }

      await client.query(
        `UPDATE farms SET growth_stages = $1, updated_at = now() WHERE id = $2`,
        [JSON.stringify(growthStages), input.farm_id]
      );

      return row;
    });

    return jsonResponse(record, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
