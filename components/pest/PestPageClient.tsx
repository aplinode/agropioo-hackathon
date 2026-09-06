"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PestBundle } from "./pest-bundle";
import GrowthStageEditor from "./GrowthStageEditor";

type Farm = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  crops: string[];
  growth_stages: Record<string, string>;
  primary_crop: string | null;
};

type DayForecast = {
  date: string;
  risk_score: number;
  predicted_pest: string | null;
  confidence: number;
  status: "active" | "monitoring";
};

type ForecastResponse = {
  farm_id: string;
  farm_name: string;
  weather_data_unavailable: boolean;
  days: DayForecast[];
};

interface PestPageClientProps {
  bundle: PestBundle;
  farms: Farm[];
}

const RISK_COLORS: Record<string, string> = {
  high: "bg-agro-error",
  medium: "bg-agro-warning",
  low: "bg-agro-leaf",
};

function riskBand(score: number): { key: string; label: string; text: string } {
  if (score >= 70) return { key: "high", label: bundleRef?.severity?.critical ?? "High", text: "text-agro-error" };
  if (score >= 40) return { key: "medium", label: bundleRef?.severity?.warning ?? "Medium", text: "text-agro-warning" };
  return { key: "low", label: bundleRef?.status?.monitoring ?? "Low", text: "text-agro-leaf" };
}

let bundleRef: PestBundle | null = null;

function DayCard({ day, index }: { day: DayForecast; index: number }) {
  const dateObj = new Date(day.date + "T00:00:00Z");
  const dayName = dateObj.toLocaleDateString(undefined, { weekday: "short" });
  const dayNum = dateObj.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const band = riskBand(day.risk_score);
  const isToday = index === 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-4 transition-all ${
        isToday
          ? "border-agro-canopy bg-agro-mint/30 shadow-sm"
          : "border-agro-sprout bg-white hover:shadow-sm"
      }`}
    >
      {isToday && (
        <span className="absolute -top-2.5 start-4 rounded-full bg-agro-canopy px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white">
          Today
        </span>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-agro-forest">{dayName}</p>
          <p className="text-xs text-agro-slate">{dayNum}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${band.text}`}>
            {Math.round(day.risk_score)}%
          </p>
          <p className={`text-[0.65rem] font-semibold uppercase tracking-wider ${band.text}`}>
            {band.label}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-agro-sprout/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${RISK_COLORS[band.key]}`}
          style={{ width: `${Math.max(day.risk_score, 3)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-medium text-agro-ink">
          {day.predicted_pest ? (
            <>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-agro-error me-1.5 align-middle" />
              {day.predicted_pest}
            </>
          ) : (
            <span className="text-agro-slate">No threat</span>
          )}
        </span>
        <span className="text-agro-slate">{day.confidence}% conf.</span>
      </div>
    </div>
  );
}

export default function PestPageClient({ bundle, farms }: PestPageClientProps) {
  bundleRef = bundle;
  const [selectedFarmId, setSelectedFarmId] = useState(farms[0]?.id ?? "");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedFarm = useMemo(() => farms.find((f) => f.id === selectedFarmId) ?? farms[0], [farms, selectedFarmId]);

  const fetchForecast = useCallback(async (farmId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pest/forecast?farm_id=${farmId}`);
      if (res.ok) {
        const data: ForecastResponse = await res.json();
        setForecast(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId) fetchForecast(selectedFarmId);
  }, [selectedFarmId, fetchForecast]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
          {bundle.eyebrow}
        </p>
        <h1 className="display-heading mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-agro-forest sm:text-4xl">
          {bundle.pageTitle}
        </h1>
        <p className="mt-2 max-w-lg leading-relaxed text-agro-slate">{bundle.description}</p>
      </div>

      {/* Farm selector */}
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-agro-slate">
          {bundle.farmSelectorLabel}
        </label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="pest-select mt-2 h-12 w-full appearance-none rounded-xl border border-agro-sprout bg-white px-4 pr-10 text-sm font-medium text-agro-ink outline-none transition-colors focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
        >
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.district}
            </option>
          ))}
        </select>

        {selectedFarm && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-agro-slate">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-agro-mint/50 px-2.5 py-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-agro-canopy" />
              {selectedFarm.district}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-agro-mint/50 px-2.5 py-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-agro-leaf" />
              {selectedFarm.crops.join(", ")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-agro-mint/50 px-2.5 py-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-agro-earth" />
              {selectedFarm.lat.toFixed(2)}, {selectedFarm.lng.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-agro-sprout bg-white py-12">
          <div className="flex items-center gap-3 text-sm text-agro-slate">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-agro-canopy border-t-transparent" />
            Loading forecast...
          </div>
        </div>
      )}

      {/* 7-Day forecast cards */}
      {!loading && forecast && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-agro-forest">7-Day Pest Risk Forecast</h2>
            <span className="text-xs text-agro-slate">
              {forecast.weather_data_unavailable ? bundle.source.demo : bundle.source.live}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {forecast.days.map((day, i) => (
              <DayCard key={day.date} day={day} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Growth stage editor */}
      {selectedFarm && (
        <GrowthStageEditor
          bundle={bundle}
          farmId={selectedFarm.id}
          crops={selectedFarm.crops}
          initialStages={selectedFarm.growth_stages ?? {}}
        />
      )}
    </div>
  );
}
