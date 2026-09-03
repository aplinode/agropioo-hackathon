"use client";

import type { ForecastPoint } from "@/lib/prices/forecast";
import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

function formatNumber(n: number): string {
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function PredictionChart({
  predictions,
  canForecast,
  bundle,
}: {
  predictions: ForecastPoint[];
  canForecast?: boolean;
  bundle: PricesBundle;
}) {
  if (canForecast === false) {
    return (
      <div className="rounded-3xl border border-agro-sprout bg-white p-6 text-center">
        <p className="text-sm font-semibold text-agro-forest">{bundle.volatilityWarning}</p>
        <p className="mt-1 text-xs text-agro-slate">Not enough recent data to generate a forecast. Check back after more prices are collected.</p>
      </div>
    );
  }

  if (predictions.length === 0) return null;

  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 24, bottom: 40, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minPrice = Math.min(...predictions.map((p) => p.lower_bound));
  const maxPrice = Math.max(...predictions.map((p) => p.upper_bound));
  const priceRange = maxPrice - minPrice || 1;

  const xFor = (index: number) =>
    padding.left + (index / (predictions.length - 1)) * chartWidth;
  const yFor = (price: number) =>
    padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const bandPath = [
    `M ${xFor(0)} ${yFor(predictions[0].upper_bound)}`,
    ...predictions.slice(1).map((p, i) => `L ${xFor(i + 1)} ${yFor(p.upper_bound)}`),
    ...predictions
      .slice()
      .reverse()
      .map((p, i) => `L ${xFor(predictions.length - 1 - i)} ${yFor(p.lower_bound)}`),
    "Z",
  ].join(" ");

  const linePath = predictions
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.predicted_price)}`)
    .join(" ");

  const yTicks = 5;

  return (
    <figure className="w-full overflow-x-auto rounded-3xl border border-agro-sprout bg-white p-4 shadow-sm">
      <figcaption className="mb-3 text-base font-bold text-agro-forest">
        {bundle.predictionTitle}
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full min-w-[320px]"
        aria-label="14-day price prediction chart"
      >
        {/* Confidence band */}
        <path d={bandPath} fill="#E8F5E9" stroke="none" />

        {/* Y grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const price = minPrice + (priceRange * i) / yTicks;
          const y = yFor(price);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748B">
                {formatNumber(price)}
              </text>
            </g>
          );
        })}

        {/* Predicted line */}
        <path d={linePath} fill="none" stroke="#15803D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {predictions.map((p, i) => (
          <circle
            key={p.date}
            cx={xFor(i)}
            cy={yFor(p.predicted_price)}
            r={3.5}
            fill="#15803D"
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {predictions.map((p, i) =>
          i % 2 === 0 ? (
            <text
              key={p.date}
              x={xFor(i)}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#64748B"
            >
              {formatDate(p.date)}
            </text>
          ) : null
        )}
      </svg>
    </figure>
  );
}
