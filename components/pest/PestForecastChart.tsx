"use client";

import { useMemo, useState } from "react";
import type { PestBundle } from "./pest-bundle";

export type ForecastDay = {
  date: string;
  risk_score: number;
  predicted_pest: string | null;
  confidence: number;
  status: "active" | "monitoring";
};

interface PestForecastChartProps {
  bundle: PestBundle;
  farmId: string;
  farmName: string;
  initialDays: ForecastDay[];
}

export default function PestForecastChart({ bundle, farmId, farmName, initialDays }: PestForecastChartProps) {
  const [days, setDays] = useState<ForecastDay[]>(initialDays);
  const [loading, setLoading] = useState(false);

  const maxRisk = useMemo(() => Math.max(...days.map((d) => d.risk_score), 1), [days]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pest/forecast?farm_id=${farmId}`);
      if (res.ok) {
        const data = await res.json();
        setDays(data.days ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-agro-sprout bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-agro-canopy">{bundle.eyebrow}</p>
          <h3 className="mt-1 text-lg font-semibold text-agro-forest">{farmName}</h3>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-agro-sprout px-3 py-2 text-xs font-semibold text-agro-forest transition-colors hover:bg-agro-mint disabled:opacity-50"
          disabled={loading}
        >
          {bundle.buttons.refresh}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {days.length === 0 && (
          <p className="text-sm text-agro-slate">{bundle.noPrediction}</p>
        )}
        {days.map((day) => {
          const dateObj = new Date(day.date + "T00:00:00Z");
          const label = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          const heightPct = Math.max((day.risk_score / maxRisk) * 100, 4);
          const severityColor =
            day.risk_score >= 85
              ? "bg-agro-error"
              : day.risk_score >= 70
                ? "bg-agro-warning"
                : "bg-agro-leaf";

          return (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-16 text-xs text-agro-slate">{label}</div>
              <div className="flex-1">
                <div className="flex h-8 items-center gap-2">
                  <div className="flex-1 rounded-lg bg-agro-mint/40">
                    <div
                      className={`h-2 rounded-lg ${severityColor}`}
                      style={{ width: `${heightPct}%`, minWidth: 8 }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold text-agro-forest">{Math.round(day.risk_score)}%</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-agro-slate">
                    {day.predicted_pest ? day.predicted_pest : bundle.monitoring}
                  </p>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-agro-slate">
                    {day.status === "monitoring" ? bundle.status.monitoring : bundle.status.active}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
