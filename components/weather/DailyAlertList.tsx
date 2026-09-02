"use client";

import { CloudRainIcon, SunIcon, BugIcon, AlertTriangleIcon } from "@/components/icons";
import type { Severity } from "@/lib/weather/advisory";

export type DailyAlertItem = {
  date: string;
  temp_max: number;
  temp_min: number;
  precip_mm: number;
  humidity: number;
  description: string;
  alerts: Array<{
    type: string;
    severity: Severity;
    recommendation: string;
  }>;
};

const typeIcon: Record<string, typeof CloudRainIcon> = {
  heavy_rain: CloudRainIcon,
  frost: SunIcon,
  extreme_heat: SunIcon,
  disease_risk: BugIcon,
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

export type DailyAlertListProps = {
  days: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    precip_mm: number;
    humidity: number;
    description: string;
  }>;
  dailyAlerts: Record<string, DailyAlertItem["alerts"]>;
  title: string;
  subtitle: string;
  genericRecommendation: string;
};

export default function DailyAlertList({
  days,
  dailyAlerts,
  title,
  subtitle,
  genericRecommendation,
}: DailyAlertListProps) {
  return (
    <section aria-labelledby="alerts-heading" className="mt-7">
      <h2 id="alerts-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
        {title}
      </h2>
      <p className="mt-1 text-sm text-agro-slate">{subtitle}</p>
      <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
        {days.map((day) => {
          const alerts = dailyAlerts[day.date] || [];
          return (
            <li key={day.date} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 shrink-0">
                    <p className="font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                      {weekday(day.date)}
                    </p>
                    <p className="font-semibold text-agro-ink">{day.temp_max}°</p>
                    <p className="font-mono text-[0.7rem] text-agro-slate">{day.temp_min}°</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-agro-slate">{day.description}</p>
                    <p className="mt-1 flex items-center gap-3 font-mono text-[0.7rem] text-agro-canopy">
                      <span>{day.precip_mm}mm</span>
                      <span>{day.humidity}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-64 sm:shrink-0 sm:items-end">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-agro-slate">{genericRecommendation}</p>
                  ) : (
                    alerts.map((alert, i) => {
                      const Icon = typeIcon[alert.type] ?? AlertTriangleIcon;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-xl border border-agro-canopy/30 bg-agro-mint p-3"
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${severityChip[alert.severity]}`}
                          >
                            <Icon size={16} />
                          </span>
                          <p className="text-xs leading-snug text-agro-ink">{alert.recommendation}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
