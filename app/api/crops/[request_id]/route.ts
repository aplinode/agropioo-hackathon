import { jsonResponse, errorResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { query, queryOne } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ request_id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { request_id } = await params;
  const req = await queryOne<Record<string, unknown>>(
    `SELECT * FROM crop_recommendation_requests WHERE id = $1`,
    [request_id],
  );
  if (!req) return errorResponse("not_found", "Not found", 404);

  const farm = await queryOne<{ account_id: string }>(
    `SELECT account_id FROM farms WHERE id = $1`,
    [req.farm_id as string],
  );
  if (!farm || farm.account_id !== session.accountId) {
    return errorResponse("forbidden", "Forbidden", 403);
  }

  const recs = await query<{
    crop_id: string;
    name_en: string;
    name_key: string;
    category: string;
    typical_yield_per_acre_kg: unknown;
    growing_duration_days: unknown;
    season_windows: unknown;
    water_requirement_level: string;
    labour_cost_level: string;
    capital_requirement_per_acre_pkr: unknown;
    market_risk_baseline: string;
  }>(
    `SELECT r.*, c.id AS crop_id, c.name_en, c.name_key, c.category,
            c.typical_yield_per_acre_kg, c.growing_duration_days, c.season_windows,
            c.water_requirement_level, c.labour_cost_level,
            c.capital_requirement_per_acre_pkr, c.market_risk_baseline
     FROM crop_recommendations r
     JOIN crops c ON c.id = r.crop_id
     WHERE r.request_id = $1
     ORDER BY r.rank ASC`,
    [request_id],
  );

  const recommendations = (recs ?? []).map((r) => ({
    id: r.id,
    rank: r.rank,
    crop: {
      id: r.crop_id,
      nameEn: r.name_en,
      nameKey: r.name_key,
      category: r.category,
      typicalYieldPerAcreKg: Number(r.typical_yield_per_acre_kg),
      growingDurationDays: Number(r.growing_duration_days),
      seasonWindows: r.season_windows,
      waterRequirementLevel: r.water_requirement_level,
      labourCostLevel: r.labour_cost_level,
      capitalRequirementPerAcrePkr: Number(r.capital_requirement_per_acre_pkr),
      marketRiskBaseline: r.market_risk_baseline,
    },
    expectedRevenuePerAcrePkr: Number(r.expected_revenue_per_acre_pkr),
    revenueConfidence: r.revenue_confidence,
    reasonKey: r.reason_key,
    riskFactors: r.risk_factors,
    waterRequirementLevel: r.water_requirement_level,
    scores: {
      suitability: Number(r.suitability_score),
      weatherFit: Number(r.weather_fit_score),
      profitability: Number(r.profitability_score),
      risk: Number(r.risk_score),
      sustainability: Number(r.sustainability_score),
      final: Number(r.final_score),
    },
    dataSourcesUsed: r.data_sources_used,
    dataFreshnessSeconds: r.data_fresheness_seconds,
  }));

  return jsonResponse({ request: req, recommendations });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ request_id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { request_id } = await params;
  const existing = await queryOne<{ farm_id: string; account_id: string }>(
    `SELECT r.farm_id, f.account_id
     FROM crop_recommendation_requests r
     JOIN farms f ON f.id = r.farm_id
     WHERE r.id = $1`,
    [request_id],
  );
  if (!existing) return errorResponse("not_found", "Not found", 404);
  if (existing.account_id !== session.accountId) {
    return errorResponse("forbidden", "Forbidden", 403);
  }

  await query(`DELETE FROM crop_recommendation_requests WHERE id = $1`, [
    request_id,
  ]);
  return new Response(null, { status: 204 });
}
