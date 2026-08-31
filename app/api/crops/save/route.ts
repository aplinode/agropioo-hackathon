import { jsonResponse, errorResponse, readJsonBody } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { saveRecommendationSchema, getSavedPlanQuerySchema } from "@/lib/validation/crops";
import { query, queryOne, withTransaction } from "@/lib/db";
import { buildRotation } from "@/lib/crops/rotation";
import type { CropRecommendation, FarmPlanEntry, RotationSuggestion } from "@/lib/crops/api-types";

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const body = await readJsonBody(request);
  const parsed = saveRecommendationSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
    return new Response(
      JSON.stringify({ error: { code: "validation_error", message: "Invalid input", issues } }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const { recommendation_id } = parsed.data;
  const rec = await queryOne<CropRecommendation & { request_id: { farm_id: string; target_season: string; target_year: number } }>(
    `SELECT r.*, req.farm_id, req.target_season, req.target_year
     FROM crop_recommendations r
     JOIN crop_recommendation_requests req ON req.id = r.request_id
     WHERE r.id = $1`,
    [recommendation_id],
  );
  if (!rec) return errorResponse("not_found", "Recommendation not found", 404);

  const farm = await queryOne<{ account_id: string }>(
    `SELECT account_id FROM farms WHERE id = $1`,
    [(rec as any).farm_id],
  );
  if (!farm || farm.account_id !== session.accountId) {
    return errorResponse("forbidden", "Forbidden", 403);
  }

  // fetch the saved crop summary for rotation
  const cropRow = await queryOne(
    `SELECT * FROM crops WHERE id = $1`,
    [(rec as any).crop_id],
  );
  const cropSummary: any = {
    id: (cropRow as any)?.id,
    nameEn: (cropRow as any)?.name_en,
    nameKey: (cropRow as any)?.name_key,
    category: (cropRow as any)?.category,
    typicalYieldPerAcreKg: Number((cropRow as any)?.typical_yield_per_acre_kg),
    growingDurationDays: Number((cropRow as any)?.growing_duration_days),
    seasonWindows: (cropRow as any)?.season_windows,
    waterRequirementLevel: (cropRow as any)?.water_requirement_level,
    labourCostLevel: (cropRow as any)?.labour_cost_level,
    capitalRequirementPerAcrePkr: Number((cropRow as any)?.capital_requirement_per_acre_pkr),
    marketRiskBaseline: (cropRow as any)?.market_risk_baseline,
  };

  const allCrops = await query(`SELECT * FROM crops`);

  const result = await withTransaction(async (client) => {
    // upsert farm_plan_entries
    const planRow = await client.query<FarmPlanEntry>(
      `INSERT INTO farm_plan_entries
        (id, account_id, farm_id, recommendation_id, target_season, target_year, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,now(),now())
       ON CONFLICT (farm_id, target_season, target_year)
       DO UPDATE SET recommendation_id = EXCLUDED.recommendation_id, updated_at = now()
       RETURNING *`,
      [
        require("node:crypto").randomUUID(),
        session.accountId,
        (rec as any).farm_id,
        recommendation_id,
        (rec as any).target_season,
        (rec as any).target_year,
      ],
    );

    // delete old rotation suggestions for this farm/season/year (there's at most one plan entry but safe)
    await client.query(
      `DELETE FROM crop_rotation_suggestions
       WHERE farm_plan_entry_id = $1`,
      [planRow.rows[0].id],
    );

    const pastCrop = await queryOne<{ category: string | null }>(
      `SELECT c.category
       FROM records r
       JOIN crops c ON c.name_en = r.crop
       WHERE r.farm_id = $1
       ORDER BY r.event_date DESC
       LIMIT 1`,
      [(rec as any).farm_id],
    );

    const rotations = await buildRotation(
      cropSummary,
      (rec as any).target_season as any,
      (rec as any).target_year as number,
      !!pastCrop?.category,
      (allCrops ?? []).map((r: any) => ({
        id: r.id,
        nameEn: r.name_en,
        nameKey: r.name_key,
        category: r.category,
        typicalYieldPerAcreKg: Number(r.typical_yield_per_acre_kg),
        growingDurationDays: Number(r.growing_duration_days),
      seasonWindows: r.season_windows as unknown as RotationSuggestion["crop"]["seasonWindows"],
        waterRequirementLevel: r.water_requirement_level,
        labourCostLevel: r.labour_cost_level,
        capitalRequirementPerAcrePkr: Number(r.capital_requirement_per_acre_pkr),
        marketRiskBaseline: r.market_risk_baseline,
      })),
    );

    const savedRotations: RotationSuggestion[] = [];
    for (const rot of rotations) {
      const row = await client.query(
        `INSERT INTO crop_rotation_suggestions
          (id, farm_plan_entry_id, sequence_position, target_season, target_year,
           crop_id, reason_key, is_generic, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
         RETURNING *`,
        [
          require("node:crypto").randomUUID(),
          planRow.rows[0].id,
          rot.sequencePosition,
          rot.targetSeason,
          rot.targetYear,
          rot.crop.id,
          rot.reasonKey,
          rot.isGeneric,
        ],
      );
      savedRotations.push({ ...row.rows[0]!, crop: rot.crop });
    }

    return { plan: planRow.rows[0]!, rotations: savedRotations };
  });

  return jsonResponse({
    farm_plan_entry: result.plan,
    rotation_suggestions: result.rotations,
  });
}

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const url = new URL(request.url);
  const parsed = getSavedPlanQuerySchema.safeParse({
    farm_id: url.searchParams.get("farm_id") ?? undefined,
    season: url.searchParams.get("season") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
    return new Response(
      JSON.stringify({ error: { code: "validation_error", message: "Invalid query", issues } }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const { farm_id, season, year } = parsed.data;
  const farm = await queryOne<{ account_id: string }>(
    `SELECT account_id FROM farms WHERE id = $1`,
    [farm_id],
  );
  if (!farm || farm.account_id !== session.accountId) {
    return errorResponse("forbidden", "Forbidden", 403);
  }

  const plan = await queryOne<FarmPlanEntry>(
    `SELECT * FROM farm_plan_entries WHERE farm_id = $1 AND target_season = $2 AND target_year = $3`,
    [farm_id, season, year],
  );
  if (!plan) return errorResponse("not_found", "No saved plan", 404);

  const rec = await queryOne<CropRecommendation>(
    `SELECT * FROM crop_recommendations WHERE id = $1`,
    [(plan as any).recommendation_id],
  );
  if (!rec) return errorResponse("not_found", "Recommendation not found", 404);

  const rotations = await query<{
    sequence_position: number;
    target_season: string;
    target_year: number;
    crop_id: string;
    reason_key: string;
    is_generic: boolean;
    name_en: string;
    name_key: string;
    category: string;
    typical_yield_per_acre_kg: number;
    growing_duration_days: number;
    season_windows: string[];
    water_requirement_level: string;
    labour_cost_level: string;
    capital_requirement_per_acre_pkr: number;
    market_risk_baseline: string;
  }>(
    `SELECT rs.*, c.id AS crop_id, c.name_en, c.name_key, c.category,
            c.typical_yield_per_acre_kg, c.growing_duration_days, c.season_windows,
            c.water_requirement_level, c.labour_cost_level,
            c.capital_requirement_per_acre_pkr, c.market_risk_baseline
     FROM crop_rotation_suggestions rs
     JOIN crops c ON c.id = rs.crop_id
     WHERE rs.farm_plan_entry_id = $1
     ORDER BY rs.sequence_position ASC`,
    [plan.id],
  );

  const rotationSuggestions: RotationSuggestion[] = (rotations ?? []).map((r): RotationSuggestion => ({
    sequencePosition: r.sequence_position,
    targetSeason: r.target_season as RotationSuggestion["targetSeason"],
    targetYear: r.target_year,
    crop: {
      id: r.crop_id,
      nameEn: r.name_en,
      nameKey: r.name_key,
      category: r.category as RotationSuggestion["crop"]["category"],
      typicalYieldPerAcreKg: Number(r.typical_yield_per_acre_kg),
      growingDurationDays: Number(r.growing_duration_days),
      seasonWindows: r.season_windows as RotationSuggestion["crop"]["seasonWindows"],
      waterRequirementLevel: r.water_requirement_level as RotationSuggestion["crop"]["waterRequirementLevel"],
      labourCostLevel: r.labour_cost_level as RotationSuggestion["crop"]["labourCostLevel"],
      capitalRequirementPerAcrePkr: Number(r.capital_requirement_per_acre_pkr),
      marketRiskBaseline: r.market_risk_baseline as RotationSuggestion["crop"]["marketRiskBaseline"],
    },
    reasonKey: r.reason_key,
    isGeneric: r.is_generic,
  }));

  return jsonResponse({ farm_plan_entry: plan, rotation_suggestions: rotationSuggestions });
}
