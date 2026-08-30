"use client";

import { DropletIcon, LeafIcon } from "@/components/icons";
import type { GrowthStage, Severity } from "@/lib/weather/advisory";

export type ForecastDayView = {
  date: string;
  weather: {
    temp_max: number;
    temp_min: number;
    precip_mm: number;
    humidity: number;
    description: string;
  };
  growth_stage: GrowthStage;
  advice_text: string;
  severity: Severity;
};

const severityChip: Record<Severity, string> = {
  info: "bg-agro-mint text-agro-slate",
  warning: "bg-agro-canopy/10 text-agro-canopy",
  critical: "bg-agro-forest text-white",
};

function weekday(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export type ForecastListProps = {
  days: ForecastDayView[];
  title: string;
  subtitle: string;
  stageLabels: Record<GrowthStage, string>;
};

/* 7-day forecast where each day pairs weather with a farming recommendation
   for the selected farm's crop + growth stage (US3). */
export default function ForecastList({
  days,
  title,
  subtitle,
  stageLabels,
}: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-heading" className="mt-7">
      <h2
        id="forecast-heading"
        className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-agro-slate">{subtitle}</p>

      <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
        {days.map((day) => (
          <li key={day.date} className="flex items-center gap-3 p-4">
            <div className="w-16 shrink-0">
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                {weekday(day.date)}
              </p>
              <p className="font-semibold text-agro-ink">{day.weather.temp_max}°</p>
              <p className="font-mono text-[0.7rem] text-agro-slate">{day.weather.temp_min}°</p>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-agro-slate">{day.weather.description}</p>
              <p className="mt-1 flex items-center gap-3 font-mono text-[0.7rem] text-agro-canopy">
                <span className="inline-flex items-center gap-1">
                  <DropletIcon size={11} aria-hidden="true" />
                  {day.weather.precip_mm}mm
                </span>
                <span>{day.weather.humidity}%</span>
              </p>
            </div>

            <div className="flex w-40 shrink-0 flex-col items-end gap-1 text-end">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${severityChip[day.severity]}`}
              >
                <LeafIcon size={11} aria-hidden="true" />
                {stageLabels[day.growth_stage]}
              </span>
              <p className="text-xs leading-snug text-agro-ink">{day.advice_text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
