import type { PLSummary } from "@/lib/calculations/profit-loss";

const gridItem = "rounded-xl border border-agro-sprout bg-white p-4";

export default function PLSummary({ data }: { data: {
  totalProjectedCost: number;
  totalActualCost: number;
  projectedRevenue: number;
  actualRevenue: number;
  netProfitLoss: number;
  roi: number | null;
  variance: { absolute: number; percentage: number | null };
} }) {
  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;
  const varianceColor = data.variance.absolute > 0 ? "text-agro-error" : data.variance.absolute < 0 ? "text-agro-canopy" : "text-agro-slate";
  const plColor = data.netProfitLoss >= 0 ? "text-agro-canopy" : "text-agro-error";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Projected cost</p>
        <p className="mt-1 font-mono text-sm font-semibold text-agro-ink">{fmt(data.totalProjectedCost)}</p>
      </div>
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Actual cost</p>
        <p className="mt-1 font-mono text-sm font-semibold text-agro-ink">{fmt(data.totalActualCost)}</p>
      </div>
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Variance</p>
        <p className={`mt-1 font-mono text-sm font-semibold ${varianceColor}`}>
          {data.variance.percentage !== null ? `${data.variance.percentage > 0 ? "+" : ""}${data.variance.percentage}%` : "N/A"}
        </p>
        <p className={`font-mono text-xs ${varianceColor}`}>{fmt(Math.abs(data.variance.absolute))}</p>
      </div>
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Projected revenue</p>
        <p className="mt-1 font-mono text-sm font-semibold text-agro-ink">{data.projectedRevenue > 0 ? fmt(data.projectedRevenue) : "—"}</p>
      </div>
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Actual revenue</p>
        <p className="mt-1 font-mono text-sm font-semibold text-agro-ink">{data.actualRevenue > 0 ? fmt(data.actualRevenue) : "—"}</p>
      </div>
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Net P&L</p>
        <p className={`mt-1 font-mono text-sm font-semibold ${plColor}`}>{fmt(data.netProfitLoss)}</p>
      </div>
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">ROI</p>
        <p className={`mt-1 font-mono text-sm font-semibold ${data.roi === null ? "text-agro-slate" : data.roi >= 0 ? "text-agro-canopy" : "text-agro-error"}`}>
          {data.roi !== null ? `${data.roi}%` : "N/A"}
        </p>
      </div>
    </div>
  );
}
