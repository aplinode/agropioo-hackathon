import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shell/page-header";
import { requireSessionPage } from "@/lib/auth/guards";
import { queryOne } from "@/lib/db";
import { getWeatherBundle } from "@/lib/i18n/server";
import type { GrowthStage, Severity } from "@/lib/weather/advisory";
import WeatherAcknowledge from "@/components/weather/WeatherAcknowledge";

export const metadata: Metadata = { title: "Advisory detail — Agropioo" };

export default async function AdvisoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionPage();
  const bundle = await getWeatherBundle();
  const { id } = await params;

  const advisory = await queryOne<{
    id: string;
    farm_id: string;
    advisory_date: string;
    growth_stage: string | null;
    advice_text: string;
    severity: string;
  }>(
    `SELECT id, farm_id, advisory_date, growth_stage, advice_text, severity
     FROM weather_advisories WHERE id = $1 AND account_id = $2`,
    [id, session.accountId],
  );
  if (!advisory) notFound();

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
  const stage = (advisory.growth_stage as GrowthStage) ?? "generic";
  const severity = advisory.severity as Severity;

  return (
    <div className="pt-1">
      <PageHeader eyebrow={bundle.eyebrow} title={bundle.historyTitle} description={bundle.historySubtitle} />

      <Link
        href={`/weather/history?farm=${advisory.farm_id}`}
        className="mt-4 inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy underline-offset-4 hover:underline"
      >
        ← {bundle.detail.back}
      </Link>

      <section className="mt-4 rounded-3xl border border-agro-sprout bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">{advisory.advisory_date}</p>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold ${
              severity === "critical"
                ? "bg-agro-forest text-white"
                : severity === "warning"
                  ? "bg-agro-canopy/10 text-agro-canopy"
                  : "bg-agro-mint text-agro-slate"
            }`}
          >
            {severityLabels[severity]}
          </span>
        </div>

        <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-agro-slate">
          {bundle.growthStage}: {stageLabels[stage]}
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug text-agro-forest">
          {bundle.detail.recommendation}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-agro-ink">{advisory.advice_text}</p>

        <WeatherAcknowledge advisoryId={advisory.id} strings={bundle.detail} />
      </section>
    </div>
  );
}
