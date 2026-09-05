import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { growthStageSchema } from "@/lib/validation/pest";
import { query, queryOne } from "@/lib/db";
import { scoreRisk, type PredictionInput } from "@/lib/pest/model";
import { getForecast, type ForecastDay } from "@/lib/weather/openweather";

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = growthStageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
        { status: 422 },
      );
    }

    const { farm_id, crop, stage } = parsed.data;

    const farm = await queryOne<{
      id: string;
      name: string;
      district: string;
      lat: number;
      lng: number;
      crops: string[];
      growth_stages: Record<string, string>;
    }>(
      `SELECT id, name, district, lat, lng, crops, growth_stages FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [farm_id, session.accountId],
    );
    if (!farm) return errorResponse("not_found", "Farm not found", 404);

    const updatedStages = { ...(farm.growth_stages ?? {}), [crop]: stage };
    await query(`UPDATE farms SET growth_stages = $1, updated_at = now() WHERE id = $2`, [JSON.stringify(updatedStages), farm.id]);

    const forecast = await getForecast(Number(farm.lat), Number(farm.lng));
    const weatherSource = forecast ? "live" : "unavailable";
    const today = new Date().toISOString().slice(0, 10);
    const next7 = forecast
      ? forecast.days
      : Array.from({ length: 7 }, () => ({ date: today, condition: "Clear", temp_max: 30, temp_min: 20, precip_mm: 0, humidity: 50, description: "Clear" } as ForecastDay));

    const input: PredictionInput = {
      farmId: farm.id,
      accountId: session.accountId,
      province: "Punjab",
      district: farm.district ?? "Unknown",
      crop,
      growthStage: stage,
      forecast: next7,
      weatherSource,
    };

    const results = await scoreRisk(input);

    return jsonResponse({
      farm_id: farm.id,
      crop,
      stage,
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
