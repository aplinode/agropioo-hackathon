import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { createExpenseSchema, listExpensesQuerySchema, type CreateExpenseInput } from '@/lib/validation/profit-loss';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const season = await queryOne<Record<string, unknown>>(
      `SELECT id FROM seasons WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [id, session.accountId]
    );
    if (!season) return errorResponse('not_found', 'Season not found', 404);

    const { searchParams } = new URL(request.url);
    const parsed = listExpensesQuerySchema.safeParse({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse('validation_error', 'Invalid query', 422);
    }

    const { cursor, limit } = parsed.data;
    const fetchLimit = limit + 1;

    const clauses = ['e.season_id = $1'];
    const values: unknown[] = [id];
    let idx = 2;

    if (cursor) {
      clauses.push(`e.created_at < (SELECT created_at FROM expenses WHERE id = $${idx++})`);
      values.push(cursor);
    }

    const rows = await query<Record<string, unknown>>(
      `SELECT e.*, pc.per_acre_cost_pkr, pc.total_projected_pkr
       FROM expenses e
       LEFT JOIN projected_costs pc ON pc.season_id = e.season_id AND pc.category = e.category
       WHERE ${clauses.join(' AND ')}
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT $${idx}`,
      [...values, fetchLimit]
    );

    const enriched = (rows ?? []).map((expense) => {
      const projectedTotal = expense.total_projected_pkr ? Number(expense.total_projected_pkr) : 0;
      const actualTotal = Number(expense.amount);
      const variance = actualTotal - projectedTotal;
      const variancePct = projectedTotal > 0 ? Math.round((variance / projectedTotal) * 1000) / 10 : null;
      return {
        ...expense,
        variance,
        variance_percentage: variancePct,
      } as Record<string, unknown> & { id: string; variance: number; variance_percentage: number | null };
    });

    const hasMore = enriched.length > limit;
    const data = hasMore ? enriched.slice(0, limit) : enriched;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return jsonResponse({ expenses: data, next_cursor: nextCursor });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { id } = await params;
    const season = await queryOne<Record<string, unknown>>(
      `SELECT id FROM seasons WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [id, session.accountId]
    );
    if (!season) return errorResponse('not_found', 'Season not found', 404);

    const body = await readJsonBody(request);
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data as CreateExpenseInput;
    const expense = await queryOne<Record<string, unknown>>(
      `INSERT INTO expenses (season_id, account_id, category, amount, date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, session.accountId, input.category, input.amount, input.date, input.note ?? null]
    );

    if (!expense) return errorResponse('server_error', 'Failed to create expense', 500);
    return jsonResponse(expense, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
