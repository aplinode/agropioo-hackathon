import { query, queryOne } from '@/lib/db';
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
    const farms = await query<Record<string, unknown>>(
      `SELECT * FROM farms
       WHERE account_id = $1 AND archived_at IS NULL
       ORDER BY created_at DESC`,
      [session.accountId]
    );

    const enriched = await Promise.all(
      (farms ?? []).map(async (farm) => {
        const recent = await query<{ type: string; event_date: string }>(
          `SELECT type, event_date FROM records
           WHERE farm_id = $1
           ORDER BY event_date DESC
           LIMIT 5`,
          [farm.id]
        );

        const seasons = await query<{ season: string; year: string }>(
          `SELECT season, year FROM records WHERE farm_id = $1`,
          [farm.id]
        );

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
    const growthStages = defaultStagesForCrops(input.crops);
    const primaryCrop = input.primary_crop ?? input.crops[0];

    const data = await queryOne(
      `INSERT INTO farms (
          account_id, name, location, district, lat, lng, crops, acres, growth_stages,
          primary_crop, sowing_date, soil_type, irrigation_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
      [
        session.accountId,
        input.name,
        input.location,
        input.district,
        input.lat,
        input.lng,
        JSON.stringify(input.crops),
        input.acres,
        JSON.stringify(growthStages),
        primaryCrop,
        input.sowing_date ?? null,
        input.soil_type ?? null,
        input.irrigation_method ?? null,
      ]
    );

    if (!data) return errorResponse('server_error', 'Failed to create farm', 500);
    return jsonResponse(data, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}