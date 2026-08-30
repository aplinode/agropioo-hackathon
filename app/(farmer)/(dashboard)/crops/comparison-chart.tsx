"use client";

import type { CropsBundle } from "@/app/(farmer)/(dashboard)/crops/crops-bundle";

type Recommendation = {
  crop: { nameEn: string };
  expectedRevenuePerAcrePkr: number;
  growingDurationDays: number;
  waterRequirementLevel: string;
  marketRiskBaseline: string;
  labourCostLevel: string;
};

function formatNumber(n: number): string {
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

export default function ComparisonChart({
  recommendations,
  bundle,
}: {
  recommendations: Recommendation[];
  bundle: CropsBundle;
}) {
  if (recommendations.length === 0) return null;

  const width = 720;
  const height = 260;
  const padding = { top: 24, right: 24, bottom: 40, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(...recommendations.map((r) => r.expectedRevenuePerAcrePkr));
  const revenueRange = maxRevenue || 1;
  const barWidth = Math.max(16, Math.min(64, chartWidth / recommendations.length - 24));

  const xFor = (index: number) => {
    const totalBars = recommendations.length;
    const spacing = chartWidth / totalBars;
    return padding.left + spacing * index + spacing / 2;
  };

  const yFor = (value: number) => padding.top + chartHeight - (value / revenueRange) * chartHeight;

  const baselineY = yFor(0);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-w-3xl"
        aria-hidden="true"
        role="img"
      >
        {recommendations.map((rec, i) => {
          const barHeight = (rec.expectedRevenuePerAcrePkr / revenueRange) * chartHeight;
          const x = xFor(i);
          const y = baselineY - barHeight;
          return (
            <g key={rec.crop.nameEn}>
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className="fill-agro-canopy"
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                className="fill-agro-forest font-mono text-xs"
              >
                PKR {formatNumber(rec.expectedRevenuePerAcrePkr)}
              </text>
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-agro-slate font-mono text-xs"
              >
                {rec.crop.nameEn}
              </text>
            </g>
          );
        })}
        <line
          x1={padding.left}
          y1={baselineY}
          x2={width - padding.right}
          y2={baselineY}
          className="stroke-agro-sprout"
          strokeDasharray="4 4"
        />
      </svg>
      <p className="sr-only">{bundle.compare.chartAria}</p>
    </div>
  );
}
