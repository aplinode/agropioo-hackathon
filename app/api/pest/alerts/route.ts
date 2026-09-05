import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { alertsQuerySchema } from "@/lib/validation/pest";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const parsed = alertsQuerySchema.safeParse({
      limit: url.searchParams.get("limit"),
    });
    if (!parsed.success) {
      return Response.json(
        { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
        { status: 422 },
      );
    }

    const rows = await query(
      `SELECT id, farm_id, pest_type, risk_score, severity, recommendation_text, sent_via, read_at, dismissed_at, created_at
       FROM pest_alerts
       WHERE account_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [session.accountId, parsed.data.limit],
    );

    return jsonResponse(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
