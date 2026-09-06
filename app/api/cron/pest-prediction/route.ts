import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { scrapeProvincialSources, getLatestIncidence } from "@/lib/pest/scraper";
import { scoreRisk, storePredictions, type PredictionInput } from "@/lib/pest/model";
import { scanAndAlert } from "@/lib/pest/alerts";
import { getForecast, type ForecastDay } from "@/lib/weather/openweather";

const CONCURRENCY = 4;

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
  let failed = 0;

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

    async function processFarm(farm: (typeof farms)[number]) {
      const crop = farm.crops[0] ?? "wheat";
      const growthStage = farm.growth_stages?.[crop] ?? "Sowing";
      const province = "Punjab";
      const district = farm.district ?? "Unknown";
      const forecast = await getForecast(Number(farm.lat), Number(farm.lng));
      const weatherSource = forecast ? "live" : "unavailable";
      const today = new Date().toISOString().slice(0, 10);
      const next7 = forecast
        ? forecast.days
        : Array.from(
            { length: 7 },
            () => ({ date: today, condition: "Clear", temp_max: 30, temp_min: 20, precip_mm: 0, humidity: 50, description: "Clear" } as ForecastDay),
          );

      const input: PredictionInput = {
        farmId: farm.id,
        accountId: farm.account_id,
        province,
        district,
        crop,
        growthStage,
        forecast: next7,
        weatherSource,
      };

      const incidence = await getLatestIncidence(province, district, crop);
      const results = await scoreRisk(input, incidence);
      await storePredictions(input, results);

      const alerts = await scanAndAlert(
        farm.account_id,
        farm.id,
        farm.name,
        crop,
        results,
        "en",
      );
      return { results: results.length, alerts: alerts.length };
    }

    const queue = [...farms];
    const workers: Promise<void>[] = [];
    let errors = 0;

    async function worker() {
      while (queue.length > 0) {
        const farm = queue.shift();
        if (!farm) return;
        try {
          const counts = await processFarm(farm);
          generated += counts.results;
          alerted += counts.alerts;
        } catch (err) {
          errors++;
          console.error(`[pest-cron] farm ${farm.id} failed:`, err instanceof Error ? err.message : err);
        }
      }
    }

    for (let i = 0; i < Math.min(CONCURRENCY, farms.length); i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    failed = errors;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }

  return NextResponse.json({ generated, alerted, scraped, failed });
}