"use client";

import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";
import type { EnrichedPrice } from "@/lib/prices/api-types";

type MandiPrice = EnrichedPrice;

function formatNumber(n: number): string {
  return n.toLocaleString("en-PK");
}

function sortByBestPrice(a: MandiPrice, b: MandiPrice): number {
  return b.modal_price - a.modal_price;
}

export default function MarketComparisonTable({
  prices,
  bundle,
}: {
  prices: MandiPrice[];
  bundle: PricesBundle;
}) {
  const rows = [...prices].sort(sortByBestPrice);
  const bestModal = rows.length > 0 ? rows[0].modal_price : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-agro-sprout bg-white shadow-sm">
      <h2 className="px-5 py-4 text-base font-bold text-agro-forest">{bundle.comparisonTitle}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-agro-paper text-xs font-semibold uppercase tracking-wide text-agro-slate">
            <tr>
              <th className="px-5 py-3">{bundle.market}</th>
              <th className="px-5 py-3">{bundle.modalPrice}</th>
              <th className="px-5 py-3">{bundle.minPrice}</th>
              <th className="px-5 py-3">{bundle.maxPrice}</th>
              <th className="px-5 py-3">{bundle.change}</th>
              <th className="px-5 py-3">{bundle.distance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-agro-sprout">
            {rows.map((price) => {
              const isBest = bestModal !== null && price.modal_price === bestModal;
              const changePrefix = price.change_pct > 0 ? "+" : "";
              return (
                <tr
                  key={`${price.mandi_id}:${price.crop_id}`}
                  className={isBest ? "bg-agro-mint/40" : "hover:bg-agro-paper/50"}
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-agro-forest">{price.mandi_name}</div>
                    <div className="text-xs capitalize text-agro-slate">{price.district}</div>
                    {isBest ? (
                      <span className="mt-1 inline-flex items-center rounded-full bg-agro-wheat px-2 py-0.5 text-xs font-semibold text-agro-forest">
                        {bundle.bestPrice}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 font-mono text-base font-bold text-agro-forest">
                    {formatNumber(price.modal_price)}
                  </td>
                  <td className="px-5 py-3 text-agro-slate">{formatNumber(price.min_price)}</td>
                  <td className="px-5 py-3 text-agro-slate">{formatNumber(price.max_price)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        price.change_pct > 0.05
                          ? "bg-agro-mint text-agro-canopy"
                          : price.change_pct < -0.05
                            ? "bg-agro-mint/60 text-agro-canopy"
                            : "bg-agro-stone text-agro-slate"
                      }`}
                    >
                      {changePrefix}
                      {price.change_pct}% ({changePrefix}
                      {formatNumber(price.change_pkr)})
                    </span>
                  </td>
                  <td className="px-5 py-3 text-agro-slate">
                    {price.distance_km !== null
                      ? bundle.distanceKm.replace("{km}", String(Math.round(price.distance_km)))
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
