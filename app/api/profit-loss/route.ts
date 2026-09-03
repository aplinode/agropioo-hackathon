import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { createSeasonSchema, listSeasonsQuerySchema, type CreateSeasonInput } from '@/lib/validation/profit-loss';
import { getSeasonStartDate } from '@/lib/calculations/profit-loss';
import { fetchCACPProjections } from '@/lib/cacp/client';

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { searchParams } = new URL(request.url);
    const parsed = listSeasonsQuerySchema.safeParse({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse('validation_error', 'Invalid query', 422);
    }

    const { cursor, limit } = parsed.data;
    const fetchLimit = limit + 1;

    const clauses = ['account_id = $1', 'archived_at IS NULL'];
    const values: unknown[] = [session.accountId];
    let idx = 2;

    if (cursor) {
      clauses.push(`created_at < (SELECT created_at FROM seasons WHERE id = $${idx++})`);
      values.push(cursor);
    }

    const rows = await query<Record<string, unknown>>(
      `SELECT s.*, f.name as farm_name, c.name_en as crop_name
       FROM seasons s
       JOIN farms f ON f.id = s.farm_id
       JOIN crops c ON c.id = s.crop_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY s.created_at DESC
       LIMIT $${idx}`,
      [...values, fetchLimit]
    );

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return jsonResponse({ seasons: data, next_cursor: nextCursor });
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
    const parsed = createSeasonSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as CreateSeasonInput;
    const startDate = getSeasonStartDate(input.season);

    const season = await queryOne<Record<string, unknown>>(
      `INSERT INTO seasons (account_id, farm_id, crop_id, season, year, start_date, acres)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [session.accountId, input.farm_id, input.crop_id, input.season, input.year, startDate, input.acres]
    );

    if (!season) return errorResponse('server_error', 'Failed to create season', 500);

    const projections = await fetchCACPProjections(input.crop_id, input.acres);
    let cacpFallback = false;
    if (projections) {
      await query(
        `INSERT INTO projected_costs (season_id, category, per_acre_cost_pkr, total_projected_pkr)
         VALUES ($1, $2, $3, $4), ($1, $5, $6, $7), ($1, $8, $9, $10), ($1, $11, $12, $13), ($1, $14, $15, $16)`,
        [
          season.id,
          projections[0].category, projections[0].per_acre_cost_pkr, projections[0].total_projected_pkr,
          projections[1].category, projections[1].per_acre_cost_pkr, projections[1].total_projected_pkr,
          projections[2].category, projections[2].per_acre_cost_pkr, projections[2].total_projected_pkr,
          projections[3].category, projections[3].per_acre_cost_pkr, projections[3].total_projected_pkr,
          projections[4].category, projections[4].per_acre_cost_pkr, projections[4].total_projected_pkr,
        ]
      );
    } else {
      cacpFallback = true;
    }

    return jsonResponse({ ...season, cacp_fallback: cacpFallback }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
