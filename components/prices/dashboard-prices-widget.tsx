import Link from "next/link";
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon } from "@/components/icons";
import type { DashboardBundle } from "@/app/(farmer)/(dashboard)/dashboard/dashboard-bundle";

export type WidgetCropPrice = {
  crop_id: string;
  crop_name: string;
  modal_price: number;
  change_pct: number;
  sparkline: number[]; // 7 values, oldest → newest
};

function Sparkline({ values, tone }: { values: number[]; tone: "up" | "down" | "flat" }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 56;
  const H = 24;
  const step = W / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor =
    tone === "up" ? "#16a34a" : tone === "down" ? "#b45309" : "#6b7280";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function changeTone(pct: number): "up" | "down" | "flat" {
  if (pct > 0.05) return "up";
  if (pct < -0.05) return "down";
  return "flat";
}

export default function DashboardPricesWidget({
  prices,
  bundle,
}: {
  prices: WidgetCropPrice[];
  bundle: DashboardBundle;
}) {
  return (
    <section
      className="rounded-3xl border border-agro-sprout bg-white p-5 shadow-sm"
      aria-label={bundle.pricesWidgetTitle}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-agro-forest">
          {bundle.pricesWidgetTitle}
        </h2>
        <Link
          href="/prices"
          className="inline-flex items-center gap-1 text-xs font-medium text-agro-canopy hover:underline"
        >
          {bundle.pricesWidgetView}
          <ArrowRightIcon size={12} />
        </Link>
      </div>

      {prices.length === 0 ? (
        <p className="text-sm text-agro-slate">{bundle.pricesWidgetNoTracked}</p>
      ) : (
        <ul className="space-y-3" role="list">
          {prices.map((p) => {
            const tone = changeTone(p.change_pct);
            const changeLabel = `${p.change_pct > 0 ? "+" : ""}${p.change_pct.toFixed(1)}%`;
            const toneClass =
              tone === "up"
                ? "text-agro-canopy"
                : tone === "down"
                  ? "text-agro-earth"
                  : "text-agro-slate";

            return (
              <li key={p.crop_id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium capitalize text-agro-forest">
                    {p.crop_name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-agro-slate">
                    <span className="font-semibold text-agro-forest">
                      {p.modal_price.toLocaleString("en-PK")}
                    </span>
                    {bundle.pricesWidgetPerMaund}
                    <span className={`inline-flex items-center gap-0.5 font-semibold ${toneClass}`}>
                      {tone === "up" ? (
                        <TrendingUpIcon size={11} />
                      ) : tone === "down" ? (
                        <TrendingDownIcon size={11} />
                      ) : null}
                      {changeLabel}
                    </span>
                  </p>
                </div>
                <Sparkline values={p.sparkline} tone={tone} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
