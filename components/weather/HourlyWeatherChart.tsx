"use client";

import type { ForecastHour } from "@/lib/weather/openweather";

type Metric = "temperature" | "precipitation" | "wind";

type HourlyWeatherChartProps = {
  hours: ForecastHour[];
  metric: Metric;
};

const METRIC_LABEL: Record<Metric, string> = {
  temperature: "Temp (°C)",
  precipitation: "Rain (%)",
  wind: "Wind (km/h)",
};

const METRIC_COLOR: Record<Metric, string> = {
  temperature: "bg-agro-canopy",
  precipitation: "bg-agro-sprout",
  wind: "bg-agro-wheat",
};

export default function HourlyWeatherChart({ hours, metric }: HourlyWeatherChartProps) {
  if (!hours.length) return null;

  const values = hours.map((h) => {
    if (metric === "temperature") return h.temp_c;
    if (metric === "precipitation") return h.rain_pct;
    return h.wind_kph;
  });

  const max = Math.max(...values, 1);

  return (
    <div className="mt-6 rounded-2xl border border-agro-sprout bg-white p-5">
      <h3 className="font-display text-lg font-semibold text-agro-forest">{METRIC_LABEL[metric]}</h3>
      <div className="mt-4 space-y-2">
        {hours.map((h, i) => {
          const value = values[i];
          const pct = (value / max) * 100;
          const time = new Date(h.time).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
          });
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-12 shrink-0 font-mono text-xs text-agro-slate">{time}</span>
              <div className="flex-1 rounded-full bg-agro-mint/60 h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${METRIC_COLOR[metric]}`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-xs text-agro-ink">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
