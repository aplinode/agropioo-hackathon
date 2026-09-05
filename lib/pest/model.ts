import "server-only";

import { query } from "@/lib/db";
import { getLatestIncidence } from "./scraper";
import type { ForecastDay } from "@/lib/weather/openweather";

export type PredictionInput = {
  farmId: string;
  accountId: string;
  province: string;
  district: string;
  crop: string;
  growthStage: string;
  forecast: ForecastDay[];
  weatherSource: "live" | "unavailable";
};

export type PredictionResult = {
  date: string;
  riskScore: number;
  predictedPest: string | null;
  confidence: number;
  status: "active" | "monitoring";
};

const PEST_RULES: Record<string, { weight: number; stages: string[]; conditions: string[] }> = {
  aphid: { weight: 1.0, stages: ["Vegetative", "Tillering", "Panicle initiation"], conditions: ["Clear", "Cloudy"] },
  whitefly: { weight: 1.2, stages: ["Squaring", "Flowering", "Boll filling"], conditions: ["Clear", "Cloudy"] },
  bollworm: { weight: 1.3, stages: ["Squaring", "Flowering", "Boll filling"], conditions: ["Clear"] },
  jassid: { weight: 0.9, stages: ["Vegetative", "Tillering"], conditions: ["Clear", "Cloudy"] },
  armyworm: { weight: 1.1, stages: ["Vegetative", "Grain filling", "Tasselling"], conditions: ["Clear"] },
  rust: { weight: 1.4, stages: ["Vegetative", "Grain filling", "Panicle initiation"], conditions: ["Rainy", "Cloudy"] },
  locust: { weight: 1.5, stages: ["Sowing", "Vegetative", "Grand growth"], conditions: ["Clear", "Cloudy"] },
};

const STAGE_VULNERABILITY: Record<string, number> = {
  Sowing: 0.3,
  Tillering: 0.7,
  Vegetative: 0.9,
  Grain_filling: 0.8,
  Ready: 0.4,
  Squaring: 0.8,
  Flowering: 0.9,
  Boll_filling: 0.85,
  Grand_growth: 0.8,
  Ripening: 0.5,
  Harvest: 0.2,
  Panicle_initiation: 0.75,
  Tasselling: 0.8,
};

function normalizeStage(stage: string): string {
  return stage.replace(/\s+/g, "_").toLowerCase();
}

function weatherFactor(day: ForecastDay): number {
  let score = 0;
  if (day.condition === "Rain" || day.condition === "Drizzle") score += 15;
  if (day.humidity > 80) score += 10;
  if (day.temp_max > 35 && day.temp_max < 30) score += 5;
  if (day.precip_mm > 5) score += 10;
  return Math.min(score, 30);
}

async function historicalFactor(province: string, district: string, crop: string, pest: string): Promise<number> {
  const rows = await getLatestIncidence(province, district, crop);
  const all = rows as Array<{ pest_type: string; reported_count: number | null }>;
  const match = all.find((r) => r.pest_type === pest && r.reported_count && r.reported_count > 0);
  if (!match) return 0;
  const count = Math.min(match.reported_count ?? 0, 100);
  return (count / 100) * 25;
}

export async function scoreRisk(input: PredictionInput): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];
  const stageKey = normalizeStage(input.growthStage);
  const stageVuln = STAGE_VULNERABILITY[stageKey] ?? 0.5;

  for (const day of input.forecast) {
    if (input.weatherSource === "unavailable") {
      results.push({
        date: day.date,
        riskScore: 0,
        predictedPest: null,
        confidence: 0,
        status: "monitoring",
      });
      continue;
    }

    let bestPest: string | null = null;
    let bestScore = 0;
    let totalConfidence = 0;
    let pestCount = 0;

    for (const [pest, rule] of Object.entries(PEST_RULES)) {
      const stageMatch = rule.stages.some((s) => normalizeStage(s) === stageKey) ? 15 : 0;
      const weatherMatch = rule.conditions.includes(day.condition) ? 10 : 0;
      const hist = await historicalFactor(input.province, input.district, input.crop, pest);
      const pestScore = (stageVuln * 30) + stageMatch + weatherMatch + weatherFactor(day) + hist;
      const weighted = pestScore * rule.weight;

      if (weighted > bestScore) {
        bestScore = weighted;
        bestPest = pest;
      }
      totalConfidence += weighted;
      pestCount++;
    }

    const riskScore = Math.min(Math.round(bestScore), 100);
    const confidence = pestCount > 0 ? Math.min(Math.round((bestScore / (totalConfidence / pestCount)) * 100), 100) : 0;

    results.push({
      date: day.date,
      riskScore,
      predictedPest: riskScore >= 20 ? bestPest : null,
      confidence,
      status: confidence < 60 ? "monitoring" : "active",
    });
  }

  return results;
}

export async function storePredictions(input: PredictionInput, results: PredictionResult[]): Promise<void> {
  for (const r of results) {
    await query(
      `INSERT INTO pest_predictions (farm_id, account_id, prediction_date, risk_score, predicted_pest, confidence, model_version, weather_snapshot, farm_snapshot, province, district, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (farm_id, prediction_date) DO UPDATE SET
         risk_score = EXCLUDED.risk_score,
         predicted_pest = EXCLUDED.predicted_pest,
         confidence = EXCLUDED.confidence,
         weather_snapshot = EXCLUDED.weather_snapshot,
         farm_snapshot = EXCLUDED.farm_snapshot,
         status = EXCLUDED.status,
         updated_at = now()`,
      [
        input.farmId,
        input.accountId,
        r.date,
        r.riskScore,
        r.predictedPest,
        r.confidence,
        "v1",
        JSON.stringify(input.forecast.find((d) => d.date === r.date)),
        JSON.stringify({ crop: input.crop, growthStage: input.growthStage }),
        input.province,
        input.district,
        r.status,
      ],
    );
  }
}
