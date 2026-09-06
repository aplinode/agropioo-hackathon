import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { scrapeProvincialSources } from "@/lib/pest/scraper";
import { scoreRisk, type PredictionInput } from "@/lib/pest/model";
import { scanAndAlert } from "@/lib/pest/alerts";
import { getForecast, type ForecastDay } from "@/lib/weather/openweather";

export async function POST(request: Request) {
  const secret = process.env.PEST_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: { code: "MISCONFIGURED", message: "PEST_CRON_SECRET not set" } }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } }, { status: 401 });
  }

  let generated = 0;
  let alerted = 0;
  let scraped = 0;

  try {
    const records = await scrapeProvincialSources();
    scraped = records.length;

    const farms = await query<{
      id: string;
      account_id: string;
      name: string;
      district: string;
      lat: number;
      lng: number;
      crops: string[];
      growth_stages: Record<string, string>;
    }>(
      `SELECT id, account_id, name, district, lat, lng, crops, growth_stages FROM farms WHERE archived_at IS NULL`,
    );

    for (const farm of farms) {
      const crop = farm.crops[0] ?? "wheat";
      const growthStage = farm.growth_stages?.[crop] ?? "Sowing";
      const forecast = await getForecast(Number(farm.lat), Number(farm.lng));
      const weatherSource = forecast ? "live" : "unavailable";
      const today = new Date().toISOString().slice(0, 10);
    const next7 = forecast
      ? forecast.days
      :       Array.from({ length: 7 }, () => ({ date: today, condition: "Clear", temp_max: 30, temp_min: 20, precip_mm: 0, humidity: 50, description: "Clear" } as ForecastDay));

      const input: PredictionInput = {
        farmId: farm.id,
        accountId: farm.account_id,
        province: "Punjab",
        district: farm.district ?? "Unknown",
        crop,
        growthStage,
        forecast: next7,
        weatherSource,
      };

      const results = await scoreRisk(input);
      generated += results.length;

      const alerts = await scanAndAlert(
        farm.account_id,
        farm.id,
        farm.name,
        crop,
        results,
        "en",
      );
      alerted += alerts.length;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }

  return NextResponse.json({ generated, alerted, scraped });
}
