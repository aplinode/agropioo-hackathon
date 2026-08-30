import { queryOne } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { forecastQuerySchema } from "@/lib/validation/weather";
import { getForecast } from "@/lib/weather/openweather";
import { buildAdvisoryDays } from "@/lib/weather/advisory";
import { getAppLocale, getDictionary } from "@/lib/i18n/server";
import type { CatalogKey } from "@/catalog";

/* GET /api/weather/forecast — 7-day forecast with a daily farming recommendation
   for the farm's crop + growth stage. Degrades to the last cached advisory when
   the provider is unavailable (spec edge case). */
export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const url = new URL(request.url);
  const parsed = forecastQuerySchema.safeParse({ farm_id: url.searchParams.get("farm_id") });
  if (!parsed.success) {
    return Response.json(
      { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
      { status: 422 },
    );
  }

  try {
    const farm = await queryOne<{
      id: string;
      name: string;
      primary_crop: string | null;
      sowing_date: string | null;
      lat: number;
      lng: number;
    }>(
      `SELECT id, name, primary_crop, sowing_date, lat, lng
       FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [parsed.data.farm_id, session.accountId],
    );
    if (!farm) return errorResponse("not_found", "Farm not found", 404);

    const today = new Date().toISOString().slice(0, 10);
    const forecast = await getForecast(Number(farm.lat), Number(farm.lng));

    if (!forecast) {
      const cached = await queryOne<{
        advisory_date: string;
        growth_stage: string | null;
        advice_text: string;
        severity: string;
      }>(
        `SELECT advisory_date, growth_stage, advice_text, severity
         FROM weather_advisories WHERE farm_id = $1 AND advisory_date <= $2
         ORDER BY advisory_date DESC LIMIT 1`,
        [farm.id, today],
      );
      return jsonResponse({
        farm_id: farm.id,
        farm_name: farm.name,
        weather_data_unavailable: true,
        today: cached
          ? { date: cached.advisory_date, growth_stage: cached.growth_stage, advice_text: cached.advice_text, severity: cached.severity }
          : null,
        days: [],
      });
    }

    const advisoryDays = buildAdvisoryDays(farm.primary_crop, farm.sowing_date, forecast);

    const locale = await getAppLocale();
    const dict = await getDictionary(locale);
    const t = dict.t;

    const days = advisoryDays.map((d) => ({
      date: d.date,
      weather: d.weather,
      growth_stage: d.growth_stage,
      advice_key: d.advice_key,
      advice_text: t(d.advice_key as CatalogKey).text,
      severity: d.severity,
    }));

    const todayAdvice = advisoryDays.find((d) => d.date === today) ?? advisoryDays[0];
    if (todayAdvice) {
      const snapshot = JSON.stringify({ source: forecast.source, days: advisoryDays.length });
      await queryOne(
        `INSERT INTO weather_advisories (
           farm_id, account_id, advisory_date, forecast_snapshot, growth_stage,
           advice_key, advice_text, severity
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (farm_id, advisory_date) DO UPDATE SET
           forecast_snapshot = EXCLUDED.forecast_snapshot,
           growth_stage = EXCLUDED.growth_stage,
           advice_key = EXCLUDED.advice_key,
           advice_text = EXCLUDED.advice_text,
           severity = EXCLUDED.severity`,
        [
          farm.id,
          session.accountId,
          today,
          snapshot,
          todayAdvice.growth_stage,
          todayAdvice.advice_key,
          t(todayAdvice.advice_key as CatalogKey).text,
          todayAdvice.severity,
        ],
      );
    }

    return jsonResponse({
      farm_id: farm.id,
      farm_name: farm.name,
      weather_data_unavailable: false,
      days,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
