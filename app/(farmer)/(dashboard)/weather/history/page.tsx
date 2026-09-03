import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { getWeatherBundle } from "@/lib/i18n/server";
import { type GrowthStage, type Severity } from "@/lib/weather/advisory";
import FarmSelector from "@/components/weather/FarmSelector";
import HistoryList, { type HistoryItem } from "@/components/weather/HistoryList";

export const metadata: Metadata = { title: "Advisory history — Agropioo" };

type FarmRow = { id: string; name: string; primary_crop: string | null; crops: string[]; location: string; district: string };

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function WeatherHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSessionPage();
  const bundle = await getWeatherBundle();

  const farms = await query<FarmRow>(
    `SELECT id, name, primary_crop, crops, location, district FROM farms
     WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
    [session.accountId],
  );
  const farmList = farms ?? [];

  const params = await searchParams;
  const requested = typeof params.farm === "string" ? params.farm : null;
  const selected = farmList.find((f) => f.id === requested) ?? farmList[0] ?? null;

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

  if (!selected) {
    return (
      <div className="pt-1">
        <PageHeader eyebrow={bundle.eyebrow} title={bundle.historyTitle} description={bundle.historySubtitle} />
        <section className="mt-5 rounded-3xl border border-agro-sprout bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-agro-forest">{bundle.registerTitle}</h2>
          <p className="mt-1 text-sm text-agro-slate">{bundle.registerBody}</p>
        </section>
      </div>
    );
  }

  const rows = await query<HistoryItem>(
    `SELECT id, farm_id, advisory_date, growth_stage, advice_key, advice_text,
            severity, acknowledged, acted_upon
     FROM weather_advisories WHERE farm_id = $1 AND account_id = $2
     ORDER BY advisory_date DESC, id DESC LIMIT 20`,
    [selected.id, session.accountId],
  );

  const farmOptions = farmList.map((f) => ({
    id: f.id,
    name: f.name,
    cropLabel: capitalize(f.primary_crop ?? f.crops?.[0] ?? ""),
    location: f.location,
    district: f.district,
  }));

  return (
    <div className="pt-1">
      <PageHeader eyebrow={bundle.eyebrow} title={bundle.historyTitle} description={bundle.historySubtitle} />
      <div className="mt-5">
        <FarmSelector farms={farmOptions} selectedId={selected.id} label={bundle.farmSelectorLabel} />
      </div>

      <HistoryList
        initialItems={rows ?? []}
        initialCursor={null}
        farmId={selected.id}
        strings={{
          date: bundle.historyDate,
          severity: bundle.historySeverity,
          status: bundle.historyStatus,
          statusNew: bundle.historyStatusNew,
          statusSeen: bundle.historyStatusSeen,
          statusActed: bundle.historyStatusActed,
          loadMore: bundle.historyLoadMore,
          empty: bundle.historyEmpty,
        }}
        severityLabels={severityLabels}
        stageLabels={stageLabels}
      />
    </div>
  );
}
