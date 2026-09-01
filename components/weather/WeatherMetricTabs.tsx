"use client";

type Metric = "temperature" | "precipitation" | "wind";

type WeatherMetricTabsProps = {
  active: Metric;
  onChange: (metric: Metric) => void;
  labels: {
    temperature: string;
    precipitation: string;
    wind: string;
  };
};

const tabs: { key: Metric; labelKey: keyof WeatherMetricTabsProps["labels"] }[] = [
  { key: "temperature", labelKey: "temperature" },
  { key: "precipitation", labelKey: "precipitation" },
  { key: "wind", labelKey: "wind" },
];

export default function WeatherMetricTabs({ active, onChange, labels }: WeatherMetricTabsProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-6 border-b border-agro-sprout">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                isActive ? "text-agro-canopy" : "text-agro-slate hover:text-agro-ink"
              }`}
            >
              {labels[tab.labelKey]}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-agro-canopy" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
