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

export type PestIncidence = {
  pest_type: string;
  reported_count: number | null;
  district: string;
};

const AFFECTED_STAGE_POINTS = 25;
const AMBIENT_WEATHER_POINTS = 15;
const RISK_ACTIVE = 70;

const PEST_RULES: Record<
  string,
  { weight: number; stages: string[]; conditions: string[] }
> = {
  aphid: { weight: 1.0, stages: ["Vegetative", "Tillering", "Panicle initiation"], conditions: ["Clear", "Clouds"] },
  jassid: { weight: 0.95, stages: ["Vegetative", "Tillering"], conditions: ["Clear", "Clouds"] },
  whitefly: { weight: 1.05, stages: ["Squaring", "Flowering", "Boll filling"], conditions: ["Clear", "Clouds", "Mist"] },
  bollworm: { weight: 1.1, stages: ["Squaring", "Flowering", "Boll filling"], conditions: ["Clear", "Clouds"] },
  armyworm: { weight: 1.0, stages: ["Vegetative", "Grain filling", "Tasselling"], conditions: ["Clear", "Clouds", "Mist", "Rain"] },
  rust: { weight: 1.05, stages: ["Vegetative", "Grain filling", "Panicle initiation"], conditions: ["Rain", "Clouds", "Mist"] },
  locust: { weight: 1.0, stages: ["Sowing", "Vegetative", "Grand growth"], conditions: ["Clear", "Clouds"] },
};

const STAGE_VULNERABILITY: Record<string, number> = {
  sowing: 0.3,
  tillering: 0.7,
  vegetative: 0.9,
  grain_filling: 0.8,
  ready: 0.4,
  squaring: 0.8,
  flowering: 0.9,
  boll_filling: 0.85,
  grand_growth: 0.8,
  ripening: 0.5,
  harvest: 0.2,
  panicle_initiation: 0.75,
  tasselling: 0.8,
};

const CONDITION_FAMILY: Record<string, string> = {
  Thunderstorm: "Rain",
  Squall: "Rain",
  Tornado: "Rain",
  Drizzle: "Rain",
  Rain: "Rain",
  Snow: "Rain",
  Mist: "Mist",
  Haze: "Mist",
  Fog: "Mist",
  Smoke: "Mist",
  Dust: "Mist",
  Sand: "Mist",
  Ash: "Mist",
  Clouds: "Clouds",
  Clear: "Clear",
};

function normalizeStage(stage: string): string {
  return stage.replace(/\s+/g, "_").toLowerCase();
}

function familyOf(condition: string): string {
  return CONDITION_FAMILY[condition] ?? "Clear";
}

function weatherFactor(day: ForecastDay): number {
  let score = 0;
  const family = familyOf(day.condition);
  if (family === "Rain") score += 15;
  if (day.precip_mm > 5) score += 10;
  if (day.humidity > 80) score += 10;
  if (day.humidity > 60) score += 5;
  if (day.temp_max > 35) score += 5;
  return Math.min(score, 30);
}

function historicalFactor(incidence: PestIncidence[], pest: string): number {
  let total = 0;
  for (const row of incidence) {
    if (row.pest_type === pest && row.reported_count && row.reported_count > 0) {
      total += row.reported_count;
    }
  }
  if (total <= 0) return 0;
  return Math.min(total, 25);
}

export async function scoreRisk(
  input: PredictionInput,
  incidence?: PestIncidence[],
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];
  const stageKey = normalizeStage(input.growthStage);
  const stageVuln = STAGE_VULNERABILITY[stageKey] ?? 0.5;

  const rows = incidence ?? (await getLatestIncidence(input.province, input.district, input.crop));
  const incidenceRows = rows as PestIncidence[];

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

    const family = familyOf(day.condition);
    const weather = weatherFactor(day);

    let bestPest: string | null = null;
    let bestScore = 0;
    let secondBest = 0;

    for (const [pest, rule] of Object.entries(PEST_RULES)) {
      const stageMatchesVulnerable = rule.stages.some((s) => normalizeStage(s) === stageKey) ? 1 : 0;
      const weatherConducive = rule.conditions.includes(family) ? 1 : 0;

      const stageBase = stageVuln * 35;
      const raw =
        stageBase +
        stageMatchesVulnerable * AFFECTED_STAGE_POINTS +
        weatherConducive * AMBIENT_WEATHER_POINTS +
        weather +
        historicalFactor(incidenceRows, pest);

      const weighted = Math.round(raw * rule.weight);

      if (weighted > bestScore) {
        secondBest = bestScore;
        bestScore = weighted;
        bestPest = pest;
      } else if (weighted > secondBest) {
        secondBest = weighted;
      }
    }

    const riskScore = Math.min(Math.round(bestScore), 100);
    const confidence = Math.min(100, Math.max(15, Math.round(45 + (bestScore - secondBest) * 2)));
    const status: "active" | "monitoring" =
      riskScore >= RISK_ACTIVE || confidence >= 60 ? "active" : "monitoring";

    results.push({
      date: day.date,
      riskScore,
      predictedPest: riskScore >= 20 ? bestPest : null,
      confidence,
      status,
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