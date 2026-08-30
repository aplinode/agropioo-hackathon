"use client";

import { useState } from "react";
import { AlertTriangleIcon, CloudRainIcon, BugIcon, SunIcon, XIcon } from "@/components/icons";
import type { Severity } from "@/lib/weather/advisory";

export type AlertItem = {
  id: string;
  farmName: string;
  severity: Severity;
  recommendation: string;
  alertType: string;
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

export type AlertBannerProps = {
  alerts: AlertItem[];
  title: string;
  dismissLabel: string;
  noAlertsLabel: string;
  viewAllLabel: string;
  viewAllHref: string;
};

/* Critical / warning alerts for the farmer's crops (US2). In-app notification;
   email delivery is handled server-side by the alert engine. */
export default function AlertBanner({
  alerts,
  title,
  dismissLabel,
  noAlertsLabel,
  viewAllLabel,
  viewAllHref,
}: AlertBannerProps) {
  const [items, setItems] = useState<AlertItem[]>(alerts);

  async function dismiss(id: string) {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/weather/alerts/${id}/read`, { method: "POST" });
    } catch {
      // Local dismissal still improves UX even if the server call fails.
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-agro-sprout bg-agro-mint px-4 py-3 text-sm text-agro-slate">
        {noAlertsLabel}
      </p>
    );
  }

  return (
    <section aria-labelledby="alerts-heading" className="mt-5">
      <h2
        id="alerts-heading"
        className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
      >
        {title}
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((alert) => {
          const Icon = typeIcon[alert.alertType] ?? AlertTriangleIcon;
          return (
            <li
              key={alert.id}
              className="flex items-start gap-3 rounded-2xl border border-agro-canopy/30 bg-agro-mint p-4"
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityChip[alert.severity]}`}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-agro-canopy">
                  {alert.farmName}
                </p>
                <p className="mt-1 text-sm leading-snug text-agro-ink">{alert.recommendation}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.id)}
                aria-label={dismissLabel}
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full p-1 text-agro-slate transition-colors hover:bg-white hover:text-agro-forest"
              >
                <XIcon size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      <a
        href={viewAllHref}
        className="mt-2 inline-block font-mono text-xs font-semibold text-agro-canopy underline-offset-4 hover:underline"
      >
        {viewAllLabel}
      </a>
    </section>
  );
}
