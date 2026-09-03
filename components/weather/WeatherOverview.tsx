"use client";

import { SunIcon, CloudIcon, CloudRainIcon, MapPinIcon, DropletIcon, WindIcon } from "@/components/icons";

type WeatherOverviewProps = {
  temp: number | null;
  condition: string | null;
  humidity: number | null;
  precipitation: number | null;
  wind: number | null;
  farmName: string;
  farmLocation: string;
  farmDistrict: string;
  dateTime: string;
  labels: {
    precipitation: string;
    humidity: string;
    wind: string;
  };
};

const CONDITION_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  Clear: SunIcon,
  Clouds: CloudIcon,
  Rain: CloudRainIcon,
  Drizzle: CloudRainIcon,
  Thunderstorm: CloudRainIcon,
};

function WeatherIcon({ condition }: { condition: string | null }) {
  const Icon = condition ? (CONDITION_ICON[condition] ?? CloudIcon) : CloudIcon;
  return <Icon size={32} />;
}

export default function WeatherOverview({
  temp,
  condition,
  humidity,
  precipitation,
  wind,
  farmName,
  farmLocation,
  farmDistrict,
  dateTime,
}: WeatherOverviewProps) {
  return (
    <div className="rounded-3xl border border-agro-sprout bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-agro-mint text-agro-canopy">
            <WeatherIcon condition={condition} />
          </div>
          <div>
            <p className="text-5xl font-semibold text-agro-forest tabular-nums">
              {temp != null ? `${Math.round(temp)}°` : "--°"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-agro-slate">
              <span className="inline-flex items-center gap-1.5">
                <CloudRainIcon size={15} />
                Precipitation {precipitation != null ? `${precipitation}%` : "--%"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <DropletIcon size={15} />
                Humidity {humidity != null ? `${humidity}%` : "--%"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <WindIcon size={15} />
                Wind {wind != null ? `${wind} km/h` : "-- km/h"}
              </span>
            </div>
          </div>
        </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-semibold text-agro-forest">Weather</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-agro-slate sm:justify-end">
              <MapPinIcon size={15} />
              {farmLocation}
            </p>
            <p className="mt-0.5 text-xs text-agro-slate sm:justify-end">
              {farmDistrict}{farmLocation ? `, ${farmLocation}` : ""}
            </p>
            <p className="mt-1 text-sm text-agro-slate">{dateTime}</p>
            <p className="mt-1 text-sm font-medium text-agro-ink">{condition || "N/A"}</p>
          </div>
      </div>
    </div>
  );
}
