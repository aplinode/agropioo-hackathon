import type { SnapshotData } from "./satellite-types";
import type { SatelliteBundle } from "./satellite-bundle";

interface HistoryStripProps {
  bundle: SatelliteBundle;
  snapshots: SnapshotData[];
  onSelect: (snap: SnapshotData) => void;
  selectedId: string | null;
}

export default function HistoryStrip({
  bundle,
  snapshots,
  onSelect,
  selectedId,
}: HistoryStripProps) {
  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-agro-slate">
        <p className="text-sm">{bundle.noSnapshots}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate mb-3">
        {bundle.historyHeading}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {snapshots.map((snap) => {
          const isSelected = snap.id === selectedId;
          const dateLabel = new Date(snap.snapshotDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <button
              key={snap.id}
              type="button"
              onClick={() => onSelect(snap)}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 text-center transition-all ${
                isSelected
                  ? "border-agro-canopy bg-agro-mint/20"
                  : "border-agro-clay bg-white hover:border-agro-sprout"
              }`}
            >
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-agro-slate">
                {dateLabel}
              </span>
              <span className="mt-1 text-lg font-semibold text-agro-forest">
                {snap.meanNdvi.toFixed(2)}
              </span>
              {snap.cloudCover && (
                <span className="mt-0.5 text-xs text-agro-slate">{bundle.cloudCoverYes}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
