import { query, queryOne } from '@/lib/db';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { updateExpenseSchema } from '@/lib/validation/profit-loss';

async function getOwnedExpense(expenseId: string, accountId: string) {
  try {
    const expense = await queryOne<Record<string, unknown>>(
      `SELECT e.* FROM expenses e
       JOIN seasons s ON s.id = e.season_id
       WHERE e.id = $1 AND s.account_id = $2`,
      [expenseId, accountId]
    );
    return { expense, error: null };
  } catch (error) {
    return { expense: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { expenseId } = await params;
    const { expense, error } = await getOwnedExpense(expenseId, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!expense) return errorResponse('not_found', 'Expense not found', 404);

    const body = await readJsonBody(_request);
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json({ error: { code: 'validation_error', message: 'Invalid input', issues } }, { status: 422 });
    }

    const input = parsed.data;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (setClauses.length === 0) {
      return jsonResponse(expense);
    }
    values.push(expenseId, session.accountId);

    const data = await queryOne(
      `UPDATE expenses SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND season_id IN (SELECT id FROM seasons WHERE account_id = $${idx + 1})
       RETURNING *`,
      values
    );

    if (!data) return errorResponse('server_error', 'Failed to update expense', 500);
    return jsonResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const { expenseId } = await params;
    const { expense, error } = await getOwnedExpense(expenseId, session.accountId);
    if (error) return errorResponse('server_error', error.message, 500);
    if (!expense) return errorResponse('not_found', 'Expense not found', 404);

    await query(
      `DELETE FROM expenses WHERE id = $1 AND season_id IN (SELECT id FROM seasons WHERE account_id = $2)`,
      [expenseId, session.accountId]
    );
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
