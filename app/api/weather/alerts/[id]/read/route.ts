import { query } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";

/* POST /api/weather/alerts/[id]/read — mark an alert as read (farmer opened it). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const { id } = await params;
    const result = await query<{ id: string }>(
      `UPDATE weather_alerts SET read_at = now()
       WHERE id = $1 AND account_id = $2 AND read_at IS NULL
       RETURNING id`,
      [id, session.accountId],
    );
    if (!result || result.length === 0) {
      return errorResponse("not_found", "Alert not found", 404);
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
