import { query } from "@/lib/db";
import type {
  BudgetBracket,
  CropCategory,
  CropSummary,
  Season,
  SoilType,
} from "./api-types";

/** Upper bound (PKR/acre) for each budget bracket; very_high is uncapped. */
export const BUDGET_CAP: Record<BudgetBracket, number> = {
  low: 25000,
  medium: 60000,
  high: 120000,
  very_high: Infinity,
};

type CropRow = {
  id: string;
  name_en: string;
  name_key: string;
  category: CropCategory;
  typical_yield_per_acre_kg: number;
  growing_duration_days: number;
  season_windows: Season[];
  water_requirement_level: "low" | "medium" | "high";
  labour_cost_level: "low" | "medium" | "high";
  capital_requirement_per_acre_pkr: number;
  market_risk_baseline: "low" | "medium" | "high";
};

function mapRow(row: CropRow): CropSummary {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameKey: row.name_key,
    category: row.category,
    typicalYieldPerAcreKg: Number(row.typical_yield_per_acre_kg),
    growingDurationDays: Number(row.growing_duration_days),
    seasonWindows: row.season_windows,
    waterRequirementLevel: row.water_requirement_level,
    labourCostLevel: row.labour_cost_level,
    capitalRequirementPerAcrePkr: Number(row.capital_requirement_per_acre_pkr),
    marketRiskBaseline: row.market_risk_baseline,
  };
}

/** Crops whose season window includes `season` AND whose capital cost fits `budget`. */
export async function getCropsBySeasonAndBudget(
  season: Season,
  budget: BudgetBracket,
): Promise<CropSummary[]> {
  const rows = await query<CropRow>(
    `SELECT * FROM crops
     WHERE season_windows @> $1::season_enum[]
       AND capital_requirement_per_acre_pkr <= $2
     ORDER BY name_en`,
    [[season], BUDGET_CAP[budget] === Infinity ? 9_999_999_999 : BUDGET_CAP[budget]],
  );
  return (rows ?? []).map(mapRow);
}

export async function getCropById(id: string): Promise<CropSummary | null> {
  const row = await query<CropRow>(`SELECT * FROM crops WHERE id = $1`, [id]);
  return row[0] ? mapRow(row[0]) : null;
}

export async function listCrops(
  opts: { season?: Season; category?: CropCategory } = {},
): Promise<CropSummary[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.season) {
    values.push([opts.season]);
    clauses.push(`season_windows @> $${values.length}::season_enum[]`);
  }
  if (opts.category) {
    values.push(opts.category);
    clauses.push(`category = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await query<CropRow>(
    `SELECT * FROM crops ${where} ORDER BY name_en`,
    values,
  );
  return (rows ?? []).map(mapRow);
}

/** Soil-compatibility suitability score (0..1) per crop for a given soil type. */
export async function getCompatibilityByCrop(
  soilType: SoilType,
): Promise<Record<string, number>> {
  const rows = await query<{ crop_id: string; suitability_score: number }>(
    `SELECT crop_id, suitability_score FROM crop_soil_compatibility WHERE soil_type = $1`,
    [soilType],
  );
  const out: Record<string, number> = {};
  for (const r of rows ?? []) out[r.crop_id] = Number(r.suitability_score);
  return out;
}
