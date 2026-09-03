import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { createProjectedCostSchema, type CreateProjectedCostInput } from '@/lib/validation/profit-loss';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const season = await queryOne<Record<string, unknown>>(
      `SELECT id FROM seasons WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [id, session.accountId]
    );
    if (!season) return errorResponse('not_found', 'Season not found', 404);

    const body = await readJsonBody(_request);
    const parsed = createProjectedCostSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as CreateProjectedCostInput;

    const existing = await queryOne<Record<string, unknown>>(
      `SELECT id FROM projected_costs WHERE season_id = $1 AND category = $2`,
      [id, input.category]
    );
    if (existing) {
      await query(
        `UPDATE projected_costs SET per_acre_cost_pkr = $1, total_projected_pkr = $2 WHERE id = $3`,
        [input.per_acre_cost_pkr, input.per_acre_cost_pkr * Number(season.acres ?? 1), existing.id]
      );
      return jsonResponse({ ok: true, updated: true });
    }

    const projected = await queryOne<Record<string, unknown>>(
      `INSERT INTO projected_costs (season_id, category, per_acre_cost_pkr, total_projected_pkr)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, input.category, input.per_acre_cost_pkr, input.per_acre_cost_pkr * Number(season.acres ?? 1)]
    );

    if (!projected) return errorResponse('server_error', 'Failed to create projected cost', 500);
    return jsonResponse(projected, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
