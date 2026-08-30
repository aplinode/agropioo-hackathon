import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";

/* GET /api/weather/alerts — active (unread, undismissed) alerts for the farmer. */
export async function GET() {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const alerts = await query<{
      id: string;
      farm_id: string;
      farm_name: string;
      alert_type: string;
      recommendation_key: string;
      recommendation: string;
      severity: string;
      created_at: string;
      read_at: string | null;
    }>(
      `SELECT wa.id, wa.farm_id, f.name AS farm_name, wa.alert_type,
              wa.recommendation_key, wa.recommendation, wa.severity,
              wa.created_at, wa.read_at
       FROM weather_alerts wa
       JOIN farms f ON f.id = wa.farm_id
       WHERE wa.account_id = $1 AND wa.read_at IS NULL AND wa.dismissed_at IS NULL
       ORDER BY wa.created_at DESC`,
      [session.accountId],
    );
    return jsonResponse({
      alerts: (alerts ?? []).map((a) => ({
        id: a.id,
        farm_id: a.farm_id,
        farm_name: a.farm_name,
        alert_type: a.alert_type,
        recommendation_key: a.recommendation_key,
        recommendation: a.recommendation,
        severity: a.severity,
        created_at: a.created_at,
        read: a.read_at !== null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
