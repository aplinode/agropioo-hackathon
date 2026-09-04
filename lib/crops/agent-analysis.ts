import "server-only";

import OpenAI from "openai";
import { query, queryOne } from "@/lib/db";
import { getForecast } from "@/lib/weather/openweather";
import type { CropRecommendation, CropRecommendationRequest } from "@/lib/crops/api-types";

type FarmRow = {
  name: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  acres: string;
  soil_type: string | null;
  irrigation_method: string | null;
  primary_crop: string | null;
  crops: string | string[];
};

type PriceTrendRow = {
  crop_id: string;
  price_per_maan_pkr: number;
  trend: "up" | "stable" | "down";
  volatility: number;
};

export type AgentAnalysis = {
  summary: string;
  cropAnalyses: Array<{
    cropName: string;
    analysis: string;
    timingAdvice: string;
    riskContext: string;
  }>;
  weatherInsight: string;
  overallRecommendation: string;
};

function formatCrops(crops: string | string[]): string {
  if (Array.isArray(crops)) return crops.join(", ");
  if (typeof crops === "string") {
    try {
      const parsed = JSON.parse(crops);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch { /* not JSON */ }
  }
  return String(crops);
}

export async function generateAgentAnalysis(
  request: CropRecommendationRequest,
  recommendations: CropRecommendation[],
  accountId: string,
): Promise<AgentAnalysis | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    // Fetch farm data
    const farm = await queryOne<FarmRow>(
      `SELECT name, location, district, lat, lng, acres, soil_type, irrigation_method, primary_crop, crops
       FROM farms WHERE id = $1 AND account_id = $2`,
      [request.farmId, accountId],
    );

    if (!farm) return null;

    // Fetch weather forecast
    let weatherText = "Weather data unavailable";
    const forecast = await getForecast(Number(farm.lat), Number(farm.lng));
    if (forecast && forecast.source === "live" && forecast.days.length > 0) {
      const days = forecast.days.slice(0, 5).map(d => {
        const date = new Date(d.date);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        return `${dayName}: ${d.temp_min}-${d.temp_max}°C, ${d.condition}, rain ${d.precip_mm}mm, humidity ${d.humidity}%`;
      });
      weatherText = `5-day forecast for ${farm.location}, ${farm.district}:\n${days.join("\n")}`;
    }

    // Fetch market prices for recommended crops
    const cropIds = recommendations.map(r => r.crop.id);
    const priceRows = await query<PriceTrendRow>(
      `SELECT DISTINCT ON (crop_id) crop_id, price_per_maan_pkr, trend, volatility
       FROM crop_price_trends
       WHERE crop_id = ANY($1)
       ORDER BY crop_id, observed_at DESC`,
      [cropIds],
    );

    const priceMap = new Map(priceRows.map(r => [r.crop_id, r]));

    // Build recommendations text
    const recsText = recommendations.map((r, i) => {
      const price = priceMap.get(r.crop.id);
      return `#${i + 1} ${r.crop.nameEn} (${r.crop.category})
  Score: ${(r.scores.final * 100).toFixed(1)}%
  Revenue: PKR ${r.expectedRevenuePerAcrePkr.toLocaleString()}/acre (${r.revenueConfidence} confidence)
  Duration: ${r.crop.growingDurationDays} days | Water: ${r.crop.waterRequirementLevel} | Labour: ${r.crop.labourCostLevel}
  Capital needed: PKR ${r.crop.capitalRequirementPerAcrePkr.toLocaleString()}/acre
  Risks: ${r.riskFactors.join(", ") || "none"}
  ${price ? `Price: Rs ${price.price_per_maan_pkr}/maund, trend: ${price.trend}` : "Price data unavailable"}`;
    }).join("\n\n");

    const client = new OpenAI({ apiKey });
    const model = process.env.ADVISOR_MODEL ?? "gpt-4o-mini";

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a crop recommendation analyst for Pakistani farmers. You analyze scoring engine results and provide personalized, actionable advice.

RULES:
- NEVER invent metrics, scores, or revenue figures — use only the data provided
- ALWAYS reference the farmer's specific farm data (soil, crops, irrigation)
- ALWAYS reference the weather forecast with specific days and conditions
- ALWAYS reference current market prices
- Be specific and actionable — tell the farmer exactly what to do and when
- Use plain language suitable for a farmer with no technical background
- Keep the summary to 3-4 sentences
- Each crop analysis should be 2-3 sentences
- Weather insight should be 2-3 sentences
- Overall recommendation should be 1-2 sentences

OUTPUT FORMAT (JSON):
{
  "summary": "Personalized overview paragraph referencing the farmer's specific situation",
  "cropAnalyses": [
    {
      "cropName": "Crop name",
      "analysis": "Why this crop is recommended for THIS farmer",
      "timingAdvice": "When to plant based on weather forecast",
      "riskContext": "Risk factors with farm-specific context"
    }
  ],
  "weatherInsight": "How the upcoming weather affects the planting decision",
  "overallRecommendation": "Final personalized recommendation"
}`,
        },
        {
          role: "user",
          content: `Farmer's farm data:
- Name: ${farm.name}
- Location: ${farm.location}, ${farm.district}
- Size: ${farm.acres} acres
- Soil type: ${farm.soil_type || "not recorded"}
- Irrigation: ${farm.irrigation_method || "not recorded"}
- Current crops: ${formatCrops(farm.crops)}
- Past crop: ${farm.primary_crop || "none recorded"}

Recommendation request:
- Season: ${request.targetSeason} ${request.targetYear}
- Soil type used: ${request.soilType}
- Irrigation type: ${request.irrigationType}
- Budget bracket: ${request.budgetBracket}

Scoring engine results:
${recsText}

Weather forecast:
${weatherText}

Provide your analysis as JSON.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as AgentAnalysis;

    // Validate the shape
    if (!parsed.summary || !Array.isArray(parsed.cropAnalyses)) return null;

    return parsed;
  } catch (error) {
    console.error("[Agent Analysis] Failed to generate analysis:", error);
    return null;
  }
}
