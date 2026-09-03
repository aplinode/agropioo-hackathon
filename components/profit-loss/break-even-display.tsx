import type { BreakEvenResult } from "@/lib/calculations/profit-loss";

const gridItem = "rounded-xl border border-agro-sprout bg-white p-4";

export default function BreakEvenDisplay({ data }: { data: BreakEvenResult | null }) {
  if (!data) {
    return (
      <div className={gridItem}>
        <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Break-even</p>
        <p className="mt-1 text-sm text-agro-slate">Enter valid price and yield to calculate break-even.</p>
      </div>
    );
  }

  return (
    <div className={gridItem}>
      <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Break-even</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <div>
          <p className="text-xs text-agro-slate">Yield needed</p>
          <p className="font-mono text-sm font-semibold text-agro-ink">{data.yield}</p>
        </div>
        <div>
          <p className="text-xs text-agro-slate">Price needed</p>
          <p className="font-mono text-sm font-semibold text-agro-ink">{data.price}</p>
        </div>
      </div>
    </div>
  );
}
