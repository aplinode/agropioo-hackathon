import "server-only";

import { randomUUID } from "node:crypto";
import { query, queryOne, withTransaction } from "@/lib/db";
import { getForecast } from "@/lib/weather/openweather";
import {
  getCropsBySeasonAndBudget,
  getCompatibilityByCrop,
} from "@/lib/crops/catalogue";
import { resolveSoilType } from "@/lib/crops/soil-profiles";
import { rankCandidates, type ScoreContext } from "@/lib/crops/scoring";
import { pickReason } from "@/lib/crops/reasons";
import type {
  CropCategory,
  CropRecommendation,
  CropRecommendationRequest,
  CropSummary,
  RecommendCropsInput,
  SoilType,
  Season,
} from "./api-types";

export class WeatherUnavailableError extends Error {
  code = "service_unavailable" as const;
  status = 503;
  constructor() {
    super("Weather forecast is unavailable and no cached advisory exists.");
  }
}

export class NoCandidatesError extends Error {
  code = "no_candidates" as const;
  status = 422;
  lowestViableBracket: "low" | "medium" | "high" | "very_high";
  constructor(lowestViableBracket: NoCandidatesError["lowestViableBracket"]) {
    super("No crops match the season and budget filters.");
    this.lowestViableBracket = lowestViableBracket;
  }
}

export class OutsidePakistanError extends Error {
  code = "outside_pakistan" as const;
  status = 422;
  constructor() {
    super("Farm coordinates are outside Pakistan.");
  }
}

const PAKISTAN_BOUNDS = {
  latMin: 23.5,
  latMax: 37.0,
  lngMin: 60.5,
  lngMax: 77.0,
};

type FarmRow = {
  id: string;
  account_id: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
};

type PriceTrendRow = {
  crop_id: string;
  price_per_maan_pkr: number;
  trend: "up" | "stable" | "down";
  volatility: number;
  observed_at: string;
};

type PastCropRow = {
  category: CropCategory | null;
};

function withinPakistan(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  return (
    lat >= PAKISTAN_BOUNDS.latMin &&
    lat <= PAKISTAN_BOUNDS.latMax &&
    lng >= PAKISTAN_BOUNDS.lngMin &&
    lng <= PAKISTAN_BOUNDS.lngMax
  );
}

function seasonLabel(season: Season): string {
  const map: Record<Season, string> = {
    summer: "Summer",
    winter: "Winter",
    autumn: "Autumn",
    spring: "Spring",
    rainy: "Rainy",
    windy: "Windy",
  };
  return map[season];
}

function soilLabel(soil: SoilType): string {
  const map: Record<SoilType, string> = {
    sandy: "Sandy",
    sandy_loam: "Sandy loam",
    loamy: "Loamy",
    clay_loam: "Clay loam",
    clay: "Clay",
    silty: "Silty",
    saline: "Saline",
    rocky: "Rocky",
    other: "Not sure / Other",
  };
  return map[soil];
}

function computeLowestViableBracket(
  budget: "low" | "medium" | "high" | "very_high",
  catalogue: CropSummary[],
): "low" | "medium" | "high" | "very_high" {
  const caps: Array<{ b: "low" | "medium" | "high" | "very_high"; cap: number }> = [
    { b: "low", cap: 25_000 },
    { b: "medium", cap: 60_000 },
    { b: "high", cap: 120_000 },
    { b: "very_high", cap: Infinity },
  ];
  const viable = caps.filter(({ cap }) =>
    catalogue.some((c) => c.capitalRequirementPerAcrePkr <= cap),
  );
  if (viable.length === 0) return "very_high";
  const best = viable.find((x) => x.b === budget) ?? viable[0];
  return best.b;
}

export async function recommendCrops(
  input: RecommendCropsInput,
  accountId: string,
): Promise<{
  request: CropRecommendationRequest;
  recommendations: CropRecommendation[];
}> {
  const farm = await queryOne<FarmRow>(
    `SELECT id, account_id, district, lat, lng FROM farms WHERE id = $1`,
    [input.farmId],
  );
  if (!farm) throw new Error("Farm not found.");
  if (farm.account_id !== accountId)
    throw new Error("Farm does not belong to the account.");

  const lat = Number(farm.lat);
  const lng = Number(farm.lng);

  if (!withinPakistan(lat, lng)) {
    throw new OutsidePakistanError();
  }

  const resolved = await resolveSoilType(input.soilType, farm.district ?? "");

  const forecast = await getForecast(lat, lng);
  if (!forecast) throw new WeatherUnavailableError();
  const weatherAvailable = true;

  const priceRows = await query<PriceTrendRow>(
    `SELECT crop_id, price_per_maan_pkr, trend, volatility, observed_at
     FROM crop_price_trends
     ORDER BY crop_id, observed_at DESC`,
  );

  const latestPriceByCrop = new Map<string, PriceTrendRow>();
  for (const r of priceRows ?? []) {
    if (!latestPriceByCrop.has(r.crop_id)) latestPriceByCrop.set(r.crop_id, r);
  }
  const marketAvailable = latestPriceByCrop.size > 0;

  const catalogue = await getCropsBySeasonAndBudget(
    input.targetSeason,
    input.budgetBracket,
  );
  if (catalogue.length === 0) {
    throw new NoCandidatesError(
      computeLowestViableBracket(input.budgetBracket, []),
    );
  }

  const compatibility = await getCompatibilityByCrop(resolved.soilType);

  let dataFreshnessSeconds = 0;
  if (marketAvailable) {
    const now = Date.now();
    for (const r of latestPriceByCrop.values()) {
      const ageSec = Math.floor(
        (now - new Date(r.observed_at).getTime()) / 1000,
      );
      if (ageSec > dataFreshnessSeconds) dataFreshnessSeconds = ageSec;
    }
  }

  const pastCrop = await queryOne<PastCropRow>(
    `SELECT c.category
     FROM records r
     JOIN crops c ON c.name_en = r.crop
     WHERE r.farm_id = $1
     ORDER BY r.event_date DESC
     LIMIT 1`,
    [input.farmId],
  );

  const ctx: ScoreContext = {
    soilType: resolved.soilType,
    season: input.targetSeason,
    budget: input.budgetBracket,
    irrigation: input.irrigationType,
    weatherAvailable,
    marketAvailable,
    soilConfidence: resolved.note === "exact" ? "full" : "degraded",
    compatibilityByCrop: compatibility,
    priceByCrop: Object.fromEntries(
      [...latestPriceByCrop.entries()].map(([id, r]) => [
        id,
        {
          pricePerMaanPkr: Number(r.price_per_maan_pkr),
          trend: r.trend,
          volatility: Number(r.volatility),
        },
      ]),
    ),
    lastCropCategory: pastCrop?.category ?? null,
  };

  const ranked = rankCandidates(catalogue, ctx, 3);
  const nowIso = new Date().toISOString();

  return await withTransaction(async (client) => {
    const requestRow = await client.query<CropRecommendationRequest>(
      `INSERT INTO crop_recommendation_requests
        (id, account_id, farm_id, target_season, target_year, soil_type,
         soil_is_regional_default, irrigation_type, budget_bracket,
         weather_confidence, market_confidence, soil_confidence,
         inputs_snapshot, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        randomUUID(),
        accountId,
        input.farmId,
        input.targetSeason,
        input.targetYear,
        resolved.soilType,
        resolved.isRegionalDefault,
        input.irrigationType,
        input.budgetBracket,
        weatherAvailable ? "full" : "missing",
        marketAvailable ? "full" : "missing",
        resolved.note === "exact" ? "full" : "degraded",
        JSON.stringify(input),
        nowIso,
      ],
    );

    const request = requestRow.rows[0]!;
    const recommendations: CropRecommendation[] = [];

    for (let rank = 1; rank <= ranked.length; rank++) {
      const item = ranked[rank - 1];
      const reason = pickReason(item, {
        seasonLabel: seasonLabel(input.targetSeason),
        soilLabel: soilLabel(resolved.soilType),
      });

      const recRow = await client.query<CropRecommendation>(
        `INSERT INTO crop_recommendations
          (id, request_id, rank, crop_id, expected_revenue_per_acre_pkr,
           revenue_confidence, reason_key, risk_factors,
           water_requirement_level, suitability_score, weather_fit_score,
           profitability_score, risk_score, sustainability_score, final_score,
           data_sources_used, data_fresheness_seconds, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          randomUUID(),
          request.id,
          rank,
          item.crop.id,
          item.expectedRevenuePerAcrePkr,
          item.revenueConfidence,
          reason.key,
          item.riskFactors,
          item.crop.waterRequirementLevel,
          item.scores.suitability,
          item.scores.weatherFit,
          item.scores.profitability,
          item.scores.risk,
          item.scores.sustainability,
          item.scores.final,
          item.dataSourcesUsed,
          dataFreshnessSeconds,
          nowIso,
        ],
      );

      recommendations.push({
        ...recRow.rows[0]!,
        crop: item.crop,
        scores: item.scores,
      });
    }

    return { request, recommendations };
  });
}
