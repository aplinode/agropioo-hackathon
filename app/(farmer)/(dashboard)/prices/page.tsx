import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
} from "@/components/icons";
import PageHeader from "@/components/shell/page-header";
import { LatinInline } from "@/components/latin-inline";
import { demoMandi, demoPrices } from "./demo-data";

export const metadata: Metadata = {
  title: "Prices — Agropioo",
};

/* Map a trend series to an SVG polyline across a 100×28 box. */
function trendPoints(trend: number[]): string {
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const span = max - min || 1;
  return trend
    .map((value, index) => {
      const x = (index / (trend.length - 1)) * 96 + 2;
      const y = 26 - ((value - min) / span) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* Close the polyline down to the baseline so it can carry a soft fill. */
function trendArea(trend: number[]): string {
  return `${trendPoints(trend)} 98,28 2,28`;
}

type PriceLike = {
  changeRs: number;
  pricePer40kg: number;
  direction: "up" | "down";
};

const pctLabel = (item: PriceLike) => {
  const pct = Math.round((item.changeRs / item.pricePer40kg) * 1000) / 10;
  return `${item.direction === "up" ? "+" : "−"}${pct}%`;
};

/* Mandi price tracker: today's rate, the week's direction, and a plain
   sell-or-hold nudge for each crop. Sample rates, labelled as demo. */

const latin = (children: ReactNode, className?: string): ReactNode => (
  <LatinInline className={className}>{children}</LatinInline>
);

export default function PricesPage() {
  const bestMover = [...demoPrices].sort(
    (a, b) =>
      b.changeRs / b.pricePer40kg - a.changeRs / a.pricePer40kg
  )[0];

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Mandi prices"
        title="Know the rate before you sell"
        description={`Today's ${demoMandi} mandi rates with the week's direction — and a plain word on holding or selling.`}
      />

      {/* Week at a glance */}
      <section
        aria-labelledby="glance-heading"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        <h2 id="glance-heading" className="sr-only">
          This week at a glance
        </h2>
        <div className="rounded-2xl border border-agro-sprout bg-white p-4">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-slate">
            {latin("Crops tracked")}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-agro-forest">
            {demoPrices.length}
          </p>
        </div>
        <div className="rounded-2xl border border-agro-sprout bg-white p-4">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-slate">
            {latin("Best this week")}
          </p>
          <p className="mt-1 flex items-center gap-2 font-semibold text-agro-ink">
            {bestMover.crop}
            <span className="inline-flex items-center rounded-full bg-agro-mint px-2 py-0.5 font-mono text-[0.7rem] font-bold text-agro-canopy">
              <TrendingUpIcon size={12} className="me-1" aria-hidden="true" />
              {latin(pctLabel(bestMover))}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-agro-sprout bg-white p-4">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-slate">
            {latin("Updated")}
          </p>
          <p className="mt-1 flex items-center gap-2 font-semibold text-agro-ink">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-agro-success" aria-hidden="true" />
            {latin("Today · morning")}
          </p>
        </div>
      </section>

      <ul className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {demoPrices.map((item) => (
          <li
            key={item.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-agro-sprout bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Rate header */}
            <div className="flex items-start justify-between gap-3 p-5 pb-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-snug text-agro-ink">
                  {item.crop}{" "}
                  <span className="text-sm font-medium text-agro-slate">{item.urduName}</span>
                </h2>
                <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-agro-forest">
                  {latin(<>Rs {item.pricePer40kg.toLocaleString("en-PK")}</>)}
                  <span className="ms-1.5 align-middle font-sans text-xs font-medium text-agro-slate">
                    {latin("/ 40 kg")}
                  </span>
                </p>
              </div>
              <span
                className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[0.7rem] font-semibold ${
                  item.direction === "up"
                    ? "bg-agro-mint text-agro-canopy"
                    : "border border-agro-sprout bg-white text-agro-ink"
                }`}
              >
                {item.direction === "up" ? (
                  <TrendingUpIcon size={14} />
                ) : (
                  <TrendingDownIcon size={14} />
                )}
                {latin(
                  <>
                    {item.changeRs > 0 ? "+" : "−"}
                    {Math.abs(item.changeRs).toLocaleString("en-PK")} ·{" "}
                    {pctLabel(item)}
                  </>
                )}
              </span>
            </div>

            {/* Seven-session trend */}
            <svg
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
              className="h-16 w-full"
              role="img"
              aria-label={`Seven-session trend for ${item.crop}, currently ${item.direction === "up" ? "rising" : "falling"}`}
            >
              <polyline
                points={trendArea(item.trend)}
                fill="var(--color-agro-mint)"
                stroke="none"
              />
              <polyline
                points={trendPoints(item.trend)}
                fill="none"
                stroke="var(--color-agro-canopy)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Signal strip */}
            <div className="flex items-center gap-3 border-t border-agro-sprout bg-agro-mint px-5 py-3">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[0.7rem] font-bold uppercase tracking-wide ${
                  item.signal === "hold"
                    ? "bg-agro-canopy text-white"
                    : "bg-agro-forest text-white"
                }`}
              >
                {latin(item.signal === "hold" ? "Hold" : "Sell soon")}
              </span>
              <p className="min-w-0 text-xs leading-relaxed text-agro-slate">
                {item.signalNote}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-slate">
        {latin("Demo build · sample rates for walkthrough only")}
      </p>
    </div>
  );
}
