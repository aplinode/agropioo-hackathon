"use client";

import { useState } from "react";
import type { ForecastHour, ForecastDay } from "@/lib/weather/openweather";
import type { WeatherSnapshot } from "@/lib/farms/weather";
import WeatherOverview from "./WeatherOverview";
import WeatherMetricTabs from "./WeatherMetricTabs";
import HourlyWeatherChart from "./HourlyWeatherChart";
import WeeklyForecast from "./WeeklyForecast";

type Metric = "temperature" | "precipitation" | "wind";

type WeatherDashboardProps = {
  currentWeather: WeatherSnapshot | null;
  farmName: string;
  farmLocation: string;
  farmDistrict: string;
  dateTime: string;
  hourlyByDay: Record<string, ForecastHour[]>;
  days: ForecastDay[];
  selectedDay: string;
  metricLabels: {
    temperature: string;
    precipitation: string;
    wind: string;
  };
  overviewLabels: {
    precipitation: string;
    humidity: string;
    wind: string;
  };
};

export default function WeatherDashboard({
  currentWeather,
  farmName,
  farmLocation,
  farmDistrict,
  dateTime,
  hourlyByDay,
  days,
  selectedDay,
  metricLabels,
  overviewLabels,
}: WeatherDashboardProps) {
  const [metric, setMetric] = useState<Metric>("temperature");
  const [activeDay, setActiveDay] = useState(selectedDay);

  const hours = hourlyByDay[activeDay] ?? [];

  return (
    <div className="mt-6 space-y-6">
      <WeatherOverview
        temp={currentWeather?.temp_c ?? null}
        condition={currentWeather?.condition ?? null}
        humidity={currentWeather?.humidity ?? null}
        precipitation={hours[0]?.rain_pct ?? null}
        wind={currentWeather?.wind_kph ?? null}
        farmName={farmName}
        farmLocation={farmLocation}
        farmDistrict={farmDistrict}
        dateTime={dateTime}
        labels={overviewLabels}
      />

      <WeatherMetricTabs active={metric} onChange={setMetric} labels={metricLabels} />

      <HourlyWeatherChart hours={hours} metric={metric} />

      {days.length > 0 && (
        <WeeklyForecast days={days} selectedDate={activeDay} onSelect={setActiveDay} />
      )}
    </div>
  );
}
