"use client";

import { MapPinIcon, TrendingUpIcon, TrendingDownIcon, InfoIcon } from "@/components/icons";
import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";
import type { EnrichedPrice } from "@/lib/prices/api-types";

export type MandiPrice = EnrichedPrice;

function formatNumber(n: number): string {
  return n.toLocaleString("en-PK");
}

function changeTone(change_pct: number): "up" | "down" | "flat" {
  if (change_pct > 0.05) return "up";
  if (change_pct < -0.05) return "down";
  return "flat";
}

export default function MandiPriceCard({
  price,
  bundle,
}: {
  price: MandiPrice;
  bundle: PricesBundle;
}) {
  const tone = changeTone(price.change_pct);
  const toneClass =
    tone === "up"
      ? "bg-agro-mint text-agro-canopy"
      : tone === "down"
        ? "bg-agro-wheat/20 text-agro-earth"
        : "bg-agro-stone text-agro-slate";

  const updatedText =
    price.updated_days_ago <= 0
      ? bundle.updatedToday
      : bundle.updatedDaysAgo.replace("{days}", String(price.updated_days_ago));

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-3xl border border-agro-sprout bg-white p-5 shadow-sm"
      aria-label={`${price.mandi_name} — ${price.crop_name}`}
    >
      {price.is_best_price ? (
        <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-agro-wheat px-2.5 py-1 text-xs font-semibold text-agro-forest">
          {bundle.bestPrice}
        </span>
      ) : null}

      <div className="flex items-start gap-3 pr-20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agro-mint">
          <MapPinIcon size={20} className="text-agro-canopy" />
        </div>
        <div>
          <h3 className="display-heading font-display text-lg font-bold text-agro-forest">
            {price.mandi_name}
          </h3>
          <p className="text-sm capitalize text-agro-slate">{price.district}</p>
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold text-agro-forest">
          {formatNumber(price.modal_price)}
        </span>
        <span className="text-sm font-medium text-agro-slate">{bundle.perMaund}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}
        >
          {tone === "up" ? (
            <TrendingUpIcon size={14} />
          ) : tone === "down" ? (
            <TrendingDownIcon size={14} />
          ) : (
            <InfoIcon size={14} />
          )}
          {price.change_pct > 0 ? "+" : ""}
          {price.change_pct}% ({price.change_pkr > 0 ? "+" : ""}
          {formatNumber(price.change_pkr)} PKR)
        </span>

        {price.distance_km !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-agro-stone px-2.5 py-1 text-xs font-medium text-agro-slate">
            <MapPinIcon size={14} />
            {bundle.distanceKm.replace("{km}", String(Math.round(price.distance_km)))}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-agro-sprout pt-4 text-xs text-agro-slate">
        <span>
          {formatNumber(price.min_price)}–{formatNumber(price.max_price)} PKR
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
            price.updated_days_ago > 0 || price.is_holiday
              ? "bg-agro-wheat/20 text-agro-earth"
              : "bg-agro-mint text-agro-canopy"
          }`}
        >
          {price.is_holiday ? bundle.marketHoliday : updatedText}
        </span>
      </div>
    </article>
  );
}
