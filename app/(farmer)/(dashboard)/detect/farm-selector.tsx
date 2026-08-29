"use client";

import { ChevronRightIcon } from "@/components/icons";
import type { FarmOption } from "./detect-types";
import type { DetectBundle } from "./detect-bundle";

interface FarmSelectorProps {
  farms: FarmOption[];
  bundle: DetectBundle;
  selected: FarmOption | null;
  onSelect: (farm: FarmOption | null) => void;
  /** Called when a no-farms farmer tries to register/save (FR-2.3, E8). */
  onNoFarms?: () => void;
}

/**
 * Farm selector dropdown (FR-2.1 FR-2.2). Always visible when farms exist —
 * even a single farm shows the selector so the farmer can see the link.
 * With zero farms it collapses to a "register first" trigger that opens the
 * no-farms modal managed by the parent.
 */
export default function FarmSelector({
  farms,
  bundle,
  selected,
  onSelect,
  onNoFarms,
}: FarmSelectorProps) {
  if (farms.length === 0) {
    return (
      <>
        <button
          type="button"
          onClick={onNoFarms}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-agro-canopy/30 bg-agro-mint px-4 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-white"
        >
          {bundle.noFarmsTitle}
        </button>
      </>
    );
  }

  return (
    <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-agro-slate">
      <span>Link to a farm</span>
      <select
        value={selected?.id ?? ""}
        onChange={(e) => {
          const farm = farms.find((f) => f.id === e.target.value) ?? null;
          onSelect(farm);
        }}
        className="w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
      >
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name} — {farm.crops || "—"}
          </option>
        ))}
      </select>
      <ChevronRightIcon size={14} className="text-agro-slate" />
    </label>
  );
}
