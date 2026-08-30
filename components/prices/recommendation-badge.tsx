"use client";

import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

export default function RecommendationBadge({
  recommendation,
  reason,
  volatilityWarning,
  modelConfidence,
  bundle,
}: {
  recommendation: "SELL" | "HOLD";
  reason: string;
  volatilityWarning: boolean;
  modelConfidence: number;
  bundle: PricesBundle;
}) {
  const isSell = recommendation === "SELL";
  const badgeText = isSell ? bundle.sell : bundle.hold;
  const badgeClass = isSell
    ? "bg-agro-wheat text-agro-forest"
    : "bg-agro-mint text-agro-canopy";

  return (
    <div
      className={`rounded-3xl border border-agro-sprout bg-white p-5 shadow-sm ${
        volatilityWarning ? "border-agro-wheat" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-bold ${badgeClass}`}
        >
          {badgeText}
        </span>
        {volatilityWarning ? (
          <span className="inline-flex items-center rounded-full bg-agro-wheat/20 px-3 py-1.5 text-xs font-semibold text-agro-earth">
            {bundle.volatilityWarning}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-agro-ink">{reason}</p>
      <p className="mt-2 text-xs text-agro-slate">
        Model confidence: {Math.round(modelConfidence * 100)}%
      </p>
    </div>
  );
}
