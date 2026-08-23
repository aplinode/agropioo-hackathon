import type { Metadata } from "next";
import {
  TrendingUpIcon,
  TrendingDownIcon,
} from "@/components/icons";
import PageHeader from "@/components/shell/page-header";
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

/* Mandi price tracker: today's rate, the week's direction, and a plain
   sell-or-hold nudge for each crop. Sample rates, labelled as demo. */
export default function PricesPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Mandi prices"
        title="Know the rate before you sell"
        description={`Today's ${demoMandi} mandi rates with the week's direction — and a plain word on holding or selling.`}
      />

      <ul className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {demoPrices.map((item) => (
          <li
            key={item.id}
            className="flex h-full flex-col rounded-2xl border border-agro-clay bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-snug text-agro-ink">
                  {item.crop}{" "}
                  <span className="text-sm font-medium text-agro-slate">{item.urduName}</span>
                </h2>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-agro-cloud">
                  {demoMandi} mandi · today
                </p>
              </div>
              <span
                className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[0.7rem] font-semibold ${
                  item.direction === "up"
                    ? "bg-agro-mint text-agro-canopy"
                    : "bg-agro-stone text-agro-ink"
                }`}
              >
                {item.direction === "up" ? (
                  <TrendingUpIcon size={14} />
                ) : (
                  <TrendingDownIcon size={14} />
                )}
                {item.changeRs > 0 ? "+" : "−"}
                {Math.abs(item.changeRs).toLocaleString("en-PK")}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="font-mono text-3xl font-bold tracking-tight text-agro-forest">
                Rs {item.pricePer40kg.toLocaleString("en-PK")}
                <span className="ms-1.5 align-middle font-sans text-xs font-medium text-agro-slate">
                  / 40 kg
                </span>
              </p>

              {/* Seven-session trend */}
              <svg
                viewBox="0 0 100 28"
                className="h-9 w-24 shrink-0 text-agro-canopy"
                fill="none"
                aria-hidden="true"
              >
                <polyline
                  points={trendPoints(item.trend)}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mt-4 rounded-xl bg-agro-mint px-3.5 py-2.5">
              <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wide text-agro-canopy">
                {item.signal === "hold" ? "Hold" : "Sell soon"}
              </span>
              <span className="ms-2 text-xs leading-relaxed text-agro-slate">
                {item.signalNote}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-cloud">
        Demo build · sample rates for walkthrough only
      </p>
    </div>
  );
}
