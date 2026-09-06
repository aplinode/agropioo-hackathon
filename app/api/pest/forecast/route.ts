import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { forecastQuerySchema } from "@/lib/validation/pest";
import { scoreRisk, type PredictionInput } from "@/lib/pest/model";
import { getForecast, type ForecastDay } from "@/lib/weather/openweather";

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const parsed = forecastQuerySchema.safeParse({
      farm_id: url.searchParams.get("farm_id"),
      crop: url.searchParams.get("crop"),
    });
    if (!parsed.success) {
      return Response.json(
        { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
        { status: 422 },
      );
    }

    const farm = await query<{
      id: string;
      name: string;
      district: string;
      lat: number;
      lng: number;
      crops: string[];
      growth_stages: Record<string, string>;
      primary_crop: string | null;
    }>(
      `SELECT id, name, district, lat, lng, crops, growth_stages, primary_crop FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [parsed.data.farm_id, session.accountId],
    );
    if (!farm || farm.length === 0) return errorResponse("not_found", "Farm not found", 404);
    const farmRow = farm[0];

    const crop = parsed.data.crop ?? farmRow.primary_crop ?? farmRow.crops[0] ?? "wheat";
    const growthStage = farmRow.growth_stages?.[crop] ?? "Sowing";

    const forecast = await getForecast(Number(farmRow.lat), Number(farmRow.lng));
    const weatherSource = forecast ? "live" : "unavailable";

    const today = new Date().toISOString().slice(0, 10);
    const next7 = forecast ? forecast.days : Array.from({ length: 7 }, () => ({ date: today, condition: "Clear", temp_max: 30, temp_min: 20, precip_mm: 0, humidity: 50, description: "Clear" } as ForecastDay));

    const input: PredictionInput = {
      farmId: farmRow.id,
      accountId: session.accountId,
      province: "Punjab",
      district: farmRow.district ?? "Unknown",
      crop,
      growthStage,
      forecast: next7,
      weatherSource,
    };

    const results = await scoreRisk(input);

    return jsonResponse({
      farm_id: farmRow.id,
      farm_name: farmRow.name,
      crop,
      weather_data_unavailable: weatherSource === "unavailable",
      days: results.map((r) => ({
        date: r.date,
        risk_score: r.riskScore,
        predicted_pest: r.predictedPest,
        confidence: r.confidence,
        status: r.status,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
