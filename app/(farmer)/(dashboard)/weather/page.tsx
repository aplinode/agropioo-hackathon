import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shell/page-header";
import { requireSessionPage } from "@/lib/auth/guards";
import { query, queryOne } from "@/lib/db";
import { getWeatherBundle } from "@/lib/i18n/server";
import { getAppLocale, getDictionary } from "@/lib/i18n/server";
import type { CatalogKey } from "@/catalog";
import { getForecast } from "@/lib/weather/openweather";
import { computeGrowthStage, type GrowthStage, type Severity } from "@/lib/weather/advisory";
import { generateAIAdviceBatch } from "@/lib/weather/ai-advisory";
import FarmSelector from "@/components/weather/FarmSelector";
import AdvisoryCard from "@/components/weather/AdvisoryCard";
import ForecastList from "@/components/weather/ForecastList";
import AlertBanner from "@/components/weather/AlertBanner";
import RegisterFarmForm from "@/components/weather/RegisterFarmForm";
import { CROPS } from "@/lib/farms/constants";

export const metadata: Metadata = { title: "Weather Advisory — Agropioo" };

type FarmRow = {
  id: string;
  name: string;
  primary_crop: string | null;
  sowing_date: string | null;
  crops: string[];
  lat: number;
  lng: number;
  growth_stages: Record<string, string> | null;
};

type RecordRow = {
  type: string;
  event_date: string;
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEffectiveCropInfo(
  farm: FarmRow,
  records: RecordRow[],
): { crop: string; sowingDate: string; stage: GrowthStage } | null {
  const today = new Date().toISOString().slice(0, 10);

  const sowingRecords = records.filter((r) => r.type === "sowing" || r.type === "planting");
  const latestSowing = sowingRecords.length > 0 ? sowingRecords[0] : null;

  if (latestSowing) {
    const crop = farm.primary_crop || farm.crops[0] || null;
    if (crop) {
      const stageFromDb = farm.growth_stages?.[crop.toLowerCase()];
      const stage = (stageFromDb as GrowthStage | undefined) ?? computeGrowthStage(crop, latestSowing.event_date, today);
      return { crop, sowingDate: latestSowing.event_date, stage };
    }
  }

  if (farm.primary_crop && farm.sowing_date) {
    const stageFromDb = farm.growth_stages?.[farm.primary_crop.toLowerCase()];
    const stage = (stageFromDb as GrowthStage | undefined) ?? computeGrowthStage(farm.primary_crop, farm.sowing_date, today);
    return { crop: farm.primary_crop, sowingDate: farm.sowing_date, stage };
  }

  return null;
}

export default async function WeatherPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSessionPage();
  const bundle = await getWeatherBundle();

  const farms = await query<FarmRow>(
    `SELECT id, name, primary_crop, sowing_date, crops, lat, lng, growth_stages
     FROM farms WHERE account_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [session.accountId],
  );
  const farmList = farms ?? [];

  if (farmList.length === 0) {
    return (
      <div className="pt-1">
        <PageHeader eyebrow={bundle.eyebrow} title={bundle.pageTitle} description={bundle.description} />
        <section className="mt-5 rounded-3xl border border-agro-sprout bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-agro-forest">{bundle.registerTitle}</h2>
          <p className="mt-1 text-sm text-agro-slate">{bundle.registerBody}</p>
          <Link
            href="/farms/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
          >
            {bundle.registerCta}
          </Link>
        </section>
      </div>
    );
  }

  const params = await searchParams;
  const requested = typeof params.farm === "string" ? params.farm : null;
  const selected =
    farmList.find((f) => f.id === requested) ??
    farmList.find((f) => f.primary_crop) ??
    farmList[0];

  const stageLabels: Record<GrowthStage, string> = {
    seedling: bundle.stages.seedling,
    vegetative: bundle.stages.vegetative,
    flowering: bundle.stages.flowering,
    maturation: bundle.stages.maturation,
    harvestReady: bundle.stages.harvestReady,
    generic: bundle.stages.generic,
  };
  const severityLabels: Record<Severity, string> = {
    info: bundle.severity.info,
    warning: bundle.severity.warning,
    critical: bundle.severity.critical,
  };

  const farmOptions = farmList.map((f) => ({
    id: f.id,
    name: f.name,
    cropLabel: capitalize(f.primary_crop ?? f.crops?.[0] ?? ""),
  }));

  const records = await query<RecordRow>(
    `SELECT type, event_date::text AS event_date FROM records WHERE farm_id = $1 AND account_id = $2 ORDER BY event_date DESC`,
    [selected.id, session.accountId],
  );
  const recordList = records ?? [];

  const effectiveCrop = getEffectiveCropInfo(selected, recordList);

  if (!effectiveCrop) {
    return (
      <div className="pt-1">
        <PageHeader eyebrow={bundle.eyebrow} title={bundle.pageTitle} description={bundle.description} />
        <div className="mt-5">
          <FarmSelector farms={farmOptions} selectedId={selected.id} label={bundle.farmSelectorLabel} />
        </div>
        <RegisterFarmForm
          farmId={selected.id}
          cropOptions={[...(CROPS as readonly string[])]}
          strings={bundle.registerForm}
        />
      </div>
    );
  }

  const locale = await getAppLocale();
  const dict = await getDictionary(locale);
  const t = dict.t;

  const today = new Date().toISOString().slice(0, 10);
  const forecast = await getForecast(Number(selected.lat), Number(selected.lng));

  let todayAdvice: { growth_stage: GrowthStage; advice_text: string; severity: Severity } | null = null;
  let forecastDays: Parameters<typeof ForecastList>[0]["days"] = [];
  let dataSourceLabel = bundle.source.demo;

  if (forecast) {
    dataSourceLabel = bundle.source.live;

    const recentActivities = recordList
      .slice(0, 10)
      .map((r) => `${r.type} on ${r.event_date}`);

    const aiAdvice = await generateAIAdviceBatch({
      days: forecast.days,
      crop: effectiveCrop.crop,
      growthStage: effectiveCrop.stage,
      locale,
      farmName: selected.name,
      recentActivities,
    });

    forecastDays = forecast.days.map((d) => {
      const ai = aiAdvice.get(d.date);
      return {
        date: d.date,
        weather: {
          temp_max: d.temp_max,
          temp_min: d.temp_min,
          precip_mm: d.precip_mm,
          humidity: d.humidity,
          description: d.description,
        },
        growth_stage: effectiveCrop.stage,
        advice_text: ai?.advice_text ?? "Keep monitoring your crop and the forecast.",
        severity: ai?.severity ?? "info",
        label: ai?.label,
      };
    });

    const todays = forecastDays.find((d) => d.date === today) ?? forecastDays[0];
    todayAdvice = {
      growth_stage: todays.growth_stage,
      advice_text: todays.advice_text,
      severity: todays.severity,
    };

    const snapshot = JSON.stringify({
      source: forecast.source,
      days: forecast.days.length,
      crop: effectiveCrop.crop,
      sowingDate: effectiveCrop.sowingDate,
    });
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
        selected.id,
        session.accountId,
        today,
        snapshot,
        todayAdvice.growth_stage,
        todays.advice_text ? `ai-${today}` : "generic",
        todayAdvice.advice_text,
        todayAdvice.severity,
      ],
    );
  } else {
    const cached = await queryOne<{ growth_stage: string | null; advice_text: string; severity: string }>(
      `SELECT growth_stage, advice_text, severity
       FROM weather_advisories WHERE farm_id = $1 AND advisory_date <= $2
       ORDER BY advisory_date DESC LIMIT 1`,
      [selected.id, today],
    );
    if (cached) {
      dataSourceLabel = bundle.source.cached;
      todayAdvice = {
        growth_stage: (cached.growth_stage as GrowthStage) ?? "generic",
        advice_text: cached.advice_text,
        severity: cached.severity as Severity,
      };
    }
  }

  const alerts = await query<{
    id: string;
    name: string;
    alert_type: string;
    recommendation: string;
    severity: string;
  }>(
    `SELECT wa.id, f.name, wa.alert_type, wa.recommendation, wa.severity
     FROM weather_alerts wa JOIN farms f ON f.id = wa.farm_id
     WHERE wa.account_id = $1 AND wa.read_at IS NULL AND wa.dismissed_at IS NULL
     ORDER BY wa.created_at DESC`,
    [session.accountId],
  );

  const recentRecords = recordList.slice(0, 5);
  const recordTypeLabels: Record<string, string> = {
    sowing: "Sowing",
    planting: "Planting",
    irrigation: "Irrigation",
    fertilizer: "Fertilizer",
    pesticide: "Pesticide",
    disease: "Disease",
    harvest: "Harvest",
  };

  return (
    <div className="pt-1">
      <PageHeader eyebrow={bundle.eyebrow} title={bundle.pageTitle} description={bundle.description} />

      <div className="mt-5">
        <FarmSelector farms={farmOptions} selectedId={selected.id} label={bundle.farmSelectorLabel} />
      </div>

      {!forecast && (
        <p className="mt-4 rounded-2xl border border-agro-canopy/30 bg-agro-mint px-4 py-3 text-sm text-agro-forest">
          <strong className="font-semibold">{bundle.weatherUnavailable}</strong> — {bundle.weatherUnavailableBody}
        </p>
      )}

      {todayAdvice && (
        <AdvisoryCard
          severity={todayAdvice.severity}
          severityLabel={severityLabels[todayAdvice.severity]}
          growthStageLabel={stageLabels[todayAdvice.growth_stage]}
          adviceText={todayAdvice.advice_text}
          dateLabel={bundle.todayAdvisory}
        />
      )}

      <AlertBanner
        alerts={(alerts ?? []).map((a) => ({
          id: a.id,
          farmName: a.name,
          severity: a.severity as Severity,
          recommendation: a.recommendation,
          alertType: a.alert_type,
        }))}
        title={bundle.alerts.title}
        dismissLabel={bundle.alerts.dismiss}
        noAlertsLabel={bundle.alerts.noAlerts}
        viewAllLabel={bundle.alerts.viewAll}
        viewAllHref="/notifications"
      />

      <p className="mt-4 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-agro-slate">
        <span className="inline-flex h-2 w-2 rounded-full bg-agro-canopy" aria-hidden="true" />
        {dataSourceLabel}
      </p>

      {recentRecords.length > 0 && (
        <section className="mt-6" aria-labelledby="recent-records-heading">
          <h2 id="recent-records-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            Recent Activity
          </h2>
          <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
            {recentRecords.map((record) => (
              <li key={record.event_date + record.type} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium text-agro-forest">{recordTypeLabels[record.type] || record.type}</span>
                <span className="text-agro-slate">{record.event_date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {forecastDays.length > 0 && (
        <ForecastList
          days={forecastDays}
          title={bundle.forecastTitle}
          subtitle={bundle.forecastSubtitle}
          stageLabels={stageLabels}
        />
      )}
    </div>
  );
}
