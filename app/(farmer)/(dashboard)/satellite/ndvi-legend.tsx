import { NDVI_LEGEND_BANDS } from "@/lib/satellite/types";
import type { SatelliteBundle } from "./satellite-bundle";

interface NdviLegendProps {
  bands: readonly { min: number; max: number; color: string }[];
}

export default function NdviLegend({ bands = NDVI_LEGEND_BANDS }: NdviLegendProps) {
  return (
    <div className="w-full">
      <div className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
        NDVI scale
      </div>
      <div className="relative h-6 w-full overflow-hidden rounded-full bg-gradient-to-r from-[#2c001e] via-[#7c008f] to-[#c000eb]" />
      <div className="mt-2 flex items-center justify-between gap-2">
        {bands.map((band) => (
          <div key={`${band.min}-${band.max}`} className="flex items-center gap-1">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: band.color }}
            />
            <span className="font-mono text-xs text-agro-slate">
              {band.min.toFixed(1)}–{band.max.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
