"use client";

type Props = {
  currentYield: number | null;
  breakEvenYield: string | null;
  cropUnit: string;
};

export default function BreakEvenBar({ currentYield, breakEvenYield, cropUnit }: Props) {
  const target = breakEvenYield ? parseFloat(breakEvenYield.split(" ")[0]) : 0;
  const current = currentYield ?? 0;
  const ratio = target > 0 ? Math.min(current / target, 1.5) : 0;
  const width = Math.max(0, Math.min(ratio * 100, 100));

  return (
    <div className="rounded-xl border border-agro-sprout bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-agro-slate">Yield vs break-even</p>
      <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-agro-mint">
        <div
          className="h-full rounded-full bg-agro-canopy transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-agro-slate">
        <span>Current: {current} {cropUnit}</span>
        <span>Break-even: {breakEvenYield ?? "—"}</span>
      </div>
    </div>
  );
}
