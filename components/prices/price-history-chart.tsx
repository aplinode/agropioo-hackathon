"use client";

import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

export type HistoryPoint = {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
};

const RANGES: Array<{ key: "1M" | "3M" | "6M" | "12M"; labelKey: keyof PricesBundle }> = [
  { key: "1M", labelKey: "range1M" },
  { key: "3M", labelKey: "range3M" },
  { key: "6M", labelKey: "range6M" },
  { key: "12M", labelKey: "range12M" },
];

function formatNumber(n: number): string {
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function PriceHistoryChart({
  history,
  range,
  onRangeChange,
  bundle,
}: {
  history: HistoryPoint[];
  range: "1M" | "3M" | "6M" | "12M";
  onRangeChange: (range: "1M" | "3M" | "6M" | "12M") => void;
  bundle: PricesBundle;
}) {
  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 24, bottom: 48, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minPrice = Math.min(...history.map((p) => p.min_price));
  const maxPrice = Math.max(...history.map((p) => p.max_price));
  const priceRange = maxPrice - minPrice || 1;

  const xFor = (index: number) =>
    padding.left + (history.length > 1 ? (index / (history.length - 1)) * chartWidth : chartWidth / 2);
  const yFor = (price: number) =>
    padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const linePath = history
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.modal_price)}`)
    .join(" ");

  const yTicks = 5;

  return (
    <figure className="w-full overflow-x-auto rounded-3xl border border-agro-sprout bg-white p-4 shadow-sm">
      <figcaption className="mb-3 text-base font-bold text-agro-forest">
        {bundle.historyTitle}
      </figcaption>

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => onRangeChange(r.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              range === r.key
                ? "bg-agro-canopy text-white"
                : "bg-agro-paper text-agro-slate hover:bg-agro-sprout"
            }`}
          >
            {bundle[r.labelKey]}
          </button>
        ))}
      </div>

      {history.length > 0 ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full min-w-[320px]"
          aria-label="Price history chart"
        >
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

          <path d={linePath} fill="none" stroke="#15803D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {history.map((p, i) => (
            <circle
              key={p.date}
              cx={xFor(i)}
              cy={yFor(p.modal_price)}
              r={3}
              fill="#15803D"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          ))}

          {history.map((p, i) =>
            i % Math.max(1, Math.floor(history.length / 6)) === 0 ? (
              <text
                key={`label-${p.date}`}
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
      ) : (
        <p className="py-8 text-center text-sm text-agro-slate">{bundle.noPricesForCrop}</p>
      )}
    </figure>
  );
}
