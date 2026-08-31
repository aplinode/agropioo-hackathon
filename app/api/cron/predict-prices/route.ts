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
      const rows = await query<{ price_date: string; modal_price: number }>(
        `SELECT price_date::text AS price_date,
                ROUND(AVG(modal_price))::int AS modal_price
         FROM mandi_prices
         WHERE crop_id = $1
           AND price_date >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY price_date
         ORDER BY price_date`,
        [crop.id],
      );

      if (!rows || rows.length < 7) continue;

      const result = forecastPrices(
        rows.map((r) => ({ date: r.price_date, modal_price: Number(r.modal_price) })),
      );

      // Upsert 14-day forecast into price_predictions table.
      for (const pt of result.predictions) {
        await query(
          `INSERT INTO price_predictions
             (crop_id, prediction_date, predicted_price, lower_bound, upper_bound,
              recommendation, recommendation_reason, volatility_warning, model_confidence,
              generated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (crop_id, prediction_date)
           DO UPDATE SET
             predicted_price      = EXCLUDED.predicted_price,
             lower_bound          = EXCLUDED.lower_bound,
             upper_bound          = EXCLUDED.upper_bound,
             recommendation       = EXCLUDED.recommendation,
             recommendation_reason = EXCLUDED.recommendation_reason,
             volatility_warning   = EXCLUDED.volatility_warning,
             model_confidence     = EXCLUDED.model_confidence,
             generated_at         = EXCLUDED.generated_at`,
          [
            crop.id,
            pt.date,
            pt.predicted_price,
            pt.lower_bound,
            pt.upper_bound,
            result.recommendation,
            result.recommendation_reason,
            result.volatility_warning,
            result.model_confidence,
          ],
        );
      }

      processed++;
    } catch (err) {
      errors.push(`${crop.name_en}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, processed, errors: errors.length > 0 ? errors : undefined });
}
