/**
 * GET /api/prices/predictions — 14-day price forecast for a crop at a mandi.
 */

import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { predictionQuerySchema } from "@/lib/prices/api-types";
import { forecastPrices, canForecast } from "@/lib/prices/forecast";

export async function GET(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const parsed = predictionQuerySchema.safeParse({
    crop_id: searchParams.get("crop_id") ?? undefined,
    mandi_id: searchParams.get("mandi_id") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid query parameters", 422);
  }

  const { crop_id, mandi_id } = parsed.data;

  try {
    const historical = await query<{ date: string; modal_price: number }>(
      `select date, modal_price
       from mandi_prices
       where crop_id = $1 and mandi_id = $2 and is_holiday = false
       order by date asc`,
      [crop_id, mandi_id]
    );

    const forecastCheck = canForecast(historical);

    if (!forecastCheck.ok) {
      return jsonResponse({
        crop_id,
        mandi_id,
        can_forecast: false,
        reason: forecastCheck.reason,
        row_count: forecastCheck.rowCount,
        last_date: forecastCheck.lastDate,
        predictions: [],
        recommendation: "HOLD",
        recommendation_reason: "Not enough price data to generate a forecast.",
        volatility_warning: true,
        model_confidence: 0,
      });
    }

    const forecast = forecastPrices(historical, 14);

    return jsonResponse({
      crop_id,
      mandi_id,
      can_forecast: true,
      ...forecast,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/prices/predictions error:", message);
    return errorResponse("server_error", message, 500);
  }
}
