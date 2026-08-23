import type { Metadata } from "next";
import Link from "next/link";
import { SunIcon, CloudRainIcon, DropletIcon } from "@/components/icons";
import PageHeader from "@/components/shell/page-header";
import {
  demoWeatherByLocation,
  weatherLocations,
  type WeatherLocationId,
} from "./demo-data";

export const metadata: Metadata = {
  title: "Weather — Agropioo",
};

/* Hyperlocal forecast: switch locations via query param (deep-linkable,
   same pattern as the dashboard's ?view=empty). */
export default async function WeatherPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requested = typeof params.loc === "string" ? params.loc : "multan";
  const locationId: WeatherLocationId = weatherLocations.includes(
    requested as WeatherLocationId
  )
    ? (requested as WeatherLocationId)
    : "multan";
  const weather = demoWeatherByLocation[locationId];

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Weather"
        title="Your fields' forecast"
        description="The forecast that drives your advisories — irrigation calls, spray windows, and harvest days."
      />

      {/* Location switch */}
      <nav aria-label="Choose farm location" className="mt-5 flex flex-wrap gap-2">
        {weatherLocations.map((id) => {
          const active = id === locationId;
          return (
            <Link
              key={id}
              href={`/weather?loc=${id}`}
              aria-current={active ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                active
                  ? "bg-agro-canopy text-white"
                  : "border border-agro-sprout bg-white text-agro-slate hover:border-agro-canopy hover:text-agro-canopy"
              }`}
            >
              {demoWeatherByLocation[id].label}
            </Link>
          );
        })}
      </nav>

      {/* Current conditions */}
      <section
        aria-labelledby="current-heading"
        className="relative mt-5 overflow-hidden rounded-3xl bg-agro-forest p-6 text-white sm:p-8"
      >
        <svg
          className="drift pointer-events-none absolute -end-20 -top-20 h-56 w-56 text-agro-sprout/15"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
        </svg>
        <h2 id="current-heading" className="sr-only">
          Current conditions in {weather.label}
        </h2>
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-sprout">
              Now · {weather.label}
            </p>
            <p className="mt-3 flex items-center gap-2 text-lg font-semibold">
              <CloudRainIcon size={22} className="text-agro-sprout" />
              {weather.condition}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs text-agro-sprout">
                H {weather.highC}°
              </span>
              <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs text-agro-sprout">
                L {weather.lowC}°
              </span>
            </div>
          </div>
          <p
            className="font-mono text-[3.75rem] font-bold leading-none tracking-tight"
            aria-label={`${weather.temperatureC} degrees Celsius`}
          >
            {weather.temperatureC}°
          </p>
        </div>
        <p className="relative mt-4 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed text-agro-sprout">
          <DropletIcon size={15} className="me-2 inline align-text-bottom" aria-hidden="true" />
          {weather.rainNote}
        </p>
      </section>

      {/* Spray window tip */}
      <section
        aria-labelledby="spray-heading"
        className="mt-4 rounded-2xl border border-agro-sprout bg-agro-mint p-5"
      >
        <h2
          id="spray-heading"
          className="flex items-center gap-2 font-semibold leading-snug text-agro-forest"
        >
          <SunIcon size={18} className="shrink-0 text-agro-canopy" aria-hidden="true" />
          Best spray window
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-agro-slate">{weather.sprayWindow}</p>
      </section>

      {/* Next hours */}
      <section aria-labelledby="hours-heading" className="mt-7">
        <h2
          id="hours-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Next hours
        </h2>
        <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {weather.hourly.map((point) => (
            <li
              key={point.time}
              className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-agro-clay bg-white p-3 text-center"
            >
              <span className="font-mono text-xs uppercase tracking-wide text-agro-slate">
                {point.time}
              </span>
              <span className="font-mono text-xl font-bold text-agro-forest">
                {point.tempC}°
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-agro-canopy">
                <DropletIcon size={12} aria-hidden="true" />
                {point.rainPct}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Five-day outlook */}
      <section aria-labelledby="week-heading" className="mt-7">
        <h2
          id="week-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Five days ahead
        </h2>
        <ul className="mt-3 divide-y divide-agro-clay overflow-hidden rounded-2xl border border-agro-clay bg-white">
          {weather.daily.map((day) => (
            <li key={day.day} className="flex items-center gap-3 p-4">
              <span className="w-14 shrink-0 font-semibold text-agro-ink">{day.day}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-agro-slate">
                {day.condition}
              </span>
              <span className="hidden w-16 shrink-0 text-right font-mono text-[0.7rem] text-agro-canopy sm:block">
                <DropletIcon size={11} className="me-1 inline align-text-bottom" aria-hidden="true" />
                {day.rainPct}%
              </span>
              <span className="w-16 shrink-0 text-right font-mono text-sm text-agro-ink">
                {day.loC}°–{day.hiC}°
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-cloud">
        Demo build · sample forecast only
      </p>
    </div>
  );
}
