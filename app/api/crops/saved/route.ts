import { jsonResponse, errorResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { query } from "@/lib/db";

export async function GET() {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const plans = await query<{
    id: string;
    farm_id: string;
    recommendation_id: string;
    target_season: string;
    target_year: number;
    created_at: string;
    updated_at: string;
    farm_name: string;
    crop_name: string;
  }>(
    `SELECT fpe.id, fpe.farm_id, fpe.recommendation_id, fpe.target_season, fpe.target_year, fpe.created_at, fpe.updated_at,
            f.name AS farm_name, c.name_en AS crop_name
     FROM farm_plan_entries fpe
     JOIN farms f ON f.id = fpe.farm_id
     JOIN crop_recommendations cr ON cr.id = fpe.recommendation_id
     JOIN crops c ON c.id = cr.crop_id
     WHERE fpe.account_id = $1
     ORDER BY fpe.updated_at DESC`,
    [session.accountId],
  );

  return jsonResponse({ plans: plans ?? [] });
}
