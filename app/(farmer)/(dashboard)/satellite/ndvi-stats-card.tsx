import { CloudIcon } from "@/components/icons";
import type { SatelliteBundle } from "./satellite-bundle";

interface NdviStatsCardProps {
  bundle: SatelliteBundle;
  meanNdvi: number | null;
  snapshotDate: string | null;
  cloudCover: boolean;
  areaHa: number;
}

export default function NdviStatsCard({
  bundle,
  meanNdvi,
  snapshotDate,
  cloudCover,
  areaHa,
}: NdviStatsCardProps) {
  const health: "stressed" | "moderate" | "good" | null = meanNdvi === null ? null : meanNdvi < 0.3 ? "stressed" : meanNdvi < 0.6 ? "moderate" : "good";
  const healthLabel = health === null ? bundle.legendNodata : health === "good" ? bundle.healthGood : health === "moderate" ? bundle.healthWatch : bundle.healthStressed;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            {bundle.meanNdvi}
          </div>
          <div className="mt-1 text-2xl font-semibold text-agro-forest">
            {meanNdvi === null ? "—" : `${meanNdvi.toFixed(2)}`}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                health === "good"
                  ? "bg-agro-mint/20 text-agro-forest"
                  : health === "moderate"
                  ? "bg-agro-wheat/20 text-agro-forest"
                  : "bg-agro-error/10 text-agro-error"
              }`}
            >
              {healthLabel}
            </span>
          </div>
        </div>
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            {bundle.cloudCover}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <CloudIcon size={16} />
            <span className="text-sm text-agro-ink">
              {cloudCover ? bundle.cloudCoverYes : bundle.cloudCoverNo}
            </span>
          </div>
          <div className="mt-1 text-sm text-agro-slate">
            {snapshotDate ? new Date(snapshotDate).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            {bundle.areaTooLarge}
          </span>
          <div className="mt-0.5 text-sm text-agro-ink">{areaHa.toFixed(1)} ha</div>
        </div>
      </div>
    </div>
  );
}
