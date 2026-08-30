import type { Metadata } from "next";
import { CloudRainIcon } from "@/components/icons";
import PageHeader from "@/components/shell/page-header";
import { getWeatherBundle } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Weather — Agropioo",
};

export default async function WeatherPage() {
  const bundle = await getWeatherBundle();

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Weather"
        title="Your fields' forecast"
        description="The forecast that drives your advisories — irrigation calls, spray windows, and harvest days."
      />

      <section
        aria-labelledby="weather-heading"
        className="mt-5 flex flex-col rounded-3xl border border-agro-sprout bg-white p-6 sm:p-8"
      >
        <h2 id="weather-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
          {bundle.title}
        </h2>
        <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-agro-slate">
          <CloudRainIcon className="mt-0.5 h-5 w-5 shrink-0 text-agro-slate" aria-hidden="true" />
          {bundle.noData}
        </p>
      </section>
    </div>
  );
}
