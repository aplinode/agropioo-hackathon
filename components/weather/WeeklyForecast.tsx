"use client";

import type { ForecastDay } from "@/lib/weather/openweather";

type WeeklyForecastProps = {
  days: ForecastDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

const CONDITION_EMOJI: Record<string, string> = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Mist: "🌫️",
  Smoke: "💨",
  Haze: "🌫️",
  Dust: "💨",
  Fog: "🌫️",
  Sand: "💨",
  Ash: "💨",
  Squall: "💨",
  Tornado: "🌪️",
};

export default function WeeklyForecast({ days, selectedDate, onSelect }: WeeklyForecastProps) {
  if (!days.length) return null;

  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-semibold text-agro-forest">7-day outlook</h3>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => {
          const isActive = day.date === selectedDate;
          const dateObj = new Date(`${day.date}T00:00:00Z`);
          const label = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const icon = CONDITION_EMOJI[day.condition] ?? "🌡️";
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect(day.date)}
              className={`flex min-w-[5.5rem] flex-col items-center gap-1 rounded-xl border px-3 py-2 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-agro-canopy/20 focus:border-agro-canopy ${
                isActive
                  ? "border-agro-canopy bg-agro-mint"
                  : "border-agro-sprout bg-white hover:border-agro-canopy"
              }`}
            >
              <span className="text-xs font-medium text-agro-slate">{label}</span>
              <span className="text-xl">{icon}</span>
              <span className="font-mono text-sm font-semibold text-agro-forest">{day.temp_max}°</span>
              <span className="font-mono text-xs text-agro-slate">{day.precip_mm}mm</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
