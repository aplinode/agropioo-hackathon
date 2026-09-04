import { tool } from "@openai/agents";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { getForecast } from "@/lib/weather/openweather";
import { getCropsBySeasonAndBudget, getCompatibilityByCrop } from "@/lib/crops/catalogue";
import { resolveSoilType } from "@/lib/crops/soil-profiles";
import { rankCandidates, type ScoreContext } from "@/lib/crops/scoring";
import type { CropCategory, Season, SoilType, IrrigationType, BudgetBracket } from "@/lib/crops/api-types";

type FarmRow = {
  id: string;
  name: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  acres: string;
  crops: string | string[];
  soil_type: string | null;
  irrigation_method: string | null;
  primary_crop: string | null;
  sowing_date: string | null;
};

type PriceTrendRow = {
  crop_id: string;
  price_per_maan_pkr: number;
  trend: "up" | "stable" | "down";
  volatility: number;
  observed_at: string;
};

export const getCropCandidates = tool({
  name: "get_crop_candidates",
  description:
    "Get the top 3 recommended crops for a farm based on scoring engine analysis. Returns ranked candidates with scores for suitability, weather fit, profitability, risk, and sustainability. Use this when recommending what crops to plant. The tool fetches weather forecast, market prices, and soil compatibility internally.",
  parameters: z.object({
    farmId: z.string().describe("The farm ID to get recommendations for"),
    soilType: z.string().describe("Soil type: sandy, sandy_loam, loamy, clay_loam, clay, silty, saline, rocky, or other"),
    irrigationType: z.string().describe("Irrigation type: rainfed, canal, tubewell, or mixed"),
    budgetBracket: z.string().describe("Budget bracket: low, medium, high, or very_high"),
    season: z.string().describe("Target season: summer, winter, autumn, spring, rainy, or windy"),
    year: z.number().describe("Target year (e.g. 2026)"),
  }),
  async execute({ farmId, soilType, irrigationType, budgetBracket, season, year }) {
    const farm = await queryOne<FarmRow>(
      `SELECT id, name, location, district, lat, lng, acres, crops, soil_type, irrigation_method, primary_crop, sowing_date
       FROM farms WHERE id = $1`,
      [farmId],
    );

    if (!farm) {
      return "Farm not found. Please check the farm ID.";
    }

    const lat = Number(farm.lat);
    const lng = Number(farm.lng);

    // Check Pakistan bounds
    if (lat < 23.5 || lat > 37.0 || lng < 60.5 || lng > 77.0) {
      return "Farm coordinates are outside Pakistan. Crop recommendations are only available for farms within Pakistan.";
    }

    const resolvedSoil = await resolveSoilType(soilType as SoilType, farm.district ?? "");

    // Fetch weather forecast
    let weatherAvailable = false;
    const forecast = await getForecast(lat, lng);
    if (forecast && forecast.source === "live" && forecast.days.length > 0) {
      weatherAvailable = true;
    }

    // Fetch market prices
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

    // Get crop catalogue
    const catalogue = await getCropsBySeasonAndBudget(
      season as Season,
      budgetBracket as BudgetBracket,
    );

    if (catalogue.length === 0) {
      return `No crops match the ${season} season and ${budgetBracket} budget bracket. Try a different season or higher budget bracket.`;
    }

    // Get soil compatibility
    const compatibility = await getCompatibilityByCrop(resolvedSoil.soilType);

    // Get past crop for rotation
    const pastCrop = await queryOne<{ category: CropCategory | null }>(
      `SELECT c.category
       FROM farms f
       JOIN crops c ON c.name_en = f.primary_crop
       WHERE f.id = $1
       LIMIT 1`,
      [farmId],
    );

    // Build scoring context
    const ctx: ScoreContext = {
      soilType: resolvedSoil.soilType,
      season: season as Season,
      budget: budgetBracket as BudgetBracket,
      irrigation: irrigationType as IrrigationType,
      weatherAvailable,
      marketAvailable,
      soilConfidence: resolvedSoil.note === "exact" ? "full" : "degraded",
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

    // Score and rank
    const ranked = rankCandidates(catalogue, ctx, 3);

    // Format output
    const lines = [
      `Top 3 crop recommendations for ${farm.name} (${farm.location}, ${farm.district}):`,
      `Season: ${season} ${year} | Soil: ${resolvedSoil.soilType} | Irrigation: ${irrigationType} | Budget: ${budgetBracket}`,
      "",
    ];

    for (const item of ranked) {
      const confidence = item.revenueConfidence;
      lines.push(`**#${ranked.indexOf(item) + 1} ${item.crop.nameEn}** (${item.crop.category})`);
      lines.push(`  Final score: ${(item.scores.final * 100).toFixed(1)}%`);
      lines.push(`  Expected revenue: PKR ${item.expectedRevenuePerAcrePkr.toLocaleString()}/acre (${confidence} confidence)`);
      lines.push(`  Scores: suitability ${(item.scores.suitability * 100).toFixed(0)}%, weather ${(item.scores.weatherFit * 100).toFixed(0)}%, profit ${(item.scores.profitability * 100).toFixed(0)}%, risk ${(item.scores.risk * 100).toFixed(0)}%, sustainability ${(item.scores.sustainability * 100).toFixed(0)}%`);
      lines.push(`  Growing duration: ${item.crop.growingDurationDays} days`);
      lines.push(`  Water requirement: ${item.crop.waterRequirementLevel}`);
      lines.push(`  Labour cost: ${item.crop.labourCostLevel}`);
      lines.push(`  Capital needed: PKR ${item.crop.capitalRequirementPerAcrePkr.toLocaleString()}/acre`);
      if (item.riskFactors.length > 0) {
        lines.push(`  Risk factors: ${item.riskFactors.join(", ")}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  },
});
