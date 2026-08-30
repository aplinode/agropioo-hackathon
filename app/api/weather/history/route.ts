import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { historyQuerySchema } from "@/lib/validation/weather";

/* GET /api/weather/history — paginated advisory history for a farm, newest first. */
export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const url = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    farm_id: url.searchParams.get("farm_id"),
    limit: url.searchParams.get("limit"),
    cursor: url.searchParams.get("cursor"),
  });
  if (!parsed.success) {
    return Response.json(
      { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
      { status: 422 },
    );
  }

  try {
    let cursorDate: string | null = null;
    let cursorId: string | null = null;
    if (parsed.data.cursor) {
      try {
        const raw = Buffer.from(parsed.data.cursor, "base64").toString("utf8");
        const [d, id] = raw.split("__");
        if (d && id) {
          cursorDate = d;
          cursorId = id;
        }
      } catch {
        // ignore malformed cursor, treat as first page
      }
    }

    const limit = parsed.data.limit;
    const rows = await query<{
      id: string;
      farm_id: string;
      advisory_date: string;
      growth_stage: string | null;
      advice_key: string;
      advice_text: string;
      severity: string;
      acknowledged: boolean;
      acted_upon: boolean;
      created_at: string;
    }>(
      `SELECT id, farm_id, advisory_date, growth_stage, advice_key, advice_text,
              severity, acknowledged, acted_upon, created_at
       FROM weather_advisories
       WHERE farm_id = $1 AND account_id = $2
         AND ($3::text IS NULL OR advisory_date < $3
              OR (advisory_date = $3 AND id < $4))
       ORDER BY advisory_date DESC, id DESC
       LIMIT $5`,
      [parsed.data.farm_id, session.accountId, cursorDate, cursorId, limit + 1],
    );

    const list = rows ?? [];
    const hasMore = list.length > limit;
    const pageItems = hasMore ? list.slice(0, limit) : list;
    const last = pageItems[pageItems.length - 1];
    const nextCursor = hasMore && last ? Buffer.from(`${last.advisory_date}__${last.id}`).toString("base64") : null;

    return jsonResponse({
      items: pageItems.map((r) => ({
        id: r.id,
        farm_id: r.farm_id,
        advisory_date: r.advisory_date,
        growth_stage: r.growth_stage,
        advice_key: r.advice_key,
        advice_text: r.advice_text,
        severity: r.severity,
        acknowledged: r.acknowledged,
        acted_upon: r.acted_upon,
      })),
      next_cursor: nextCursor,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
