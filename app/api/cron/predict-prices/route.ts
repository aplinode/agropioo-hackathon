import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { forecastPrices } from "@/lib/prices/forecast";

// Maximum crops to process per run — keeps cold-start time bounded.
const CROP_LIMIT = 20;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: { code: "MISCONFIGURED", message: "CRON_SECRET not set" } }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } }, { status: 401 });
  }

  const crops = await query<{ id: string; name_en: string }>(
    `SELECT id, name_en FROM crops ORDER BY name_en LIMIT $1`,
    [CROP_LIMIT],
  );

  if (!crops || crops.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const crop of crops) {
    try {
      // Pull 90 days of daily average modal prices for this crop.
      const rows = await query<{ date: string; modal_price: number }>(
        `SELECT date::text AS date,
                ROUND(AVG(modal_price))::int AS modal_price
         FROM mandi_prices
         WHERE crop_id = $1
           AND date >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY date
         ORDER BY date`,
        [crop.id],
      );

      if (!rows || rows.length < 7) continue;

      const result = forecastPrices(
        rows.map((r) => ({ date: r.date, modal_price: Number(r.modal_price) })),
      );

      // Upsert crop-level 14-day forecast into price_predictions table.
      // The full forecast series is stored as JSONB (data-model.md §4).
      await query(
        `INSERT INTO price_predictions
           (crop_id, mandi_id, calculated_at, forecast_json,
            recommendation, recommendation_reason, volatility_warning, model_confidence)
         VALUES ($1, NULL, NOW(), $2::jsonb, $3, $4, $5, $6)
         ON CONFLICT (crop_id) DO UPDATE SET
           calculated_at         = NOW(),
           forecast_json         = EXCLUDED.forecast_json,
           recommendation        = EXCLUDED.recommendation,
           recommendation_reason = EXCLUDED.recommendation_reason,
           volatility_warning    = EXCLUDED.volatility_warning,
           model_confidence      = EXCLUDED.model_confidence`,
        [
          crop.id,
          JSON.stringify(result.predictions),
          result.recommendation,
          result.recommendation_reason,
          result.volatility_warning,
          result.model_confidence,
        ],
      );

      processed++;
    } catch (err) {
      errors.push(`${crop.name_en}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, processed, errors: errors.length > 0 ? errors : undefined });
}
