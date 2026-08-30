"use client";

import { useRouter } from "next/navigation";
import { ChevronRightIcon } from "@/components/icons";

export type FarmOption = {
  id: string;
  name: string;
  cropLabel: string;
};

export type FarmSelectorProps = {
  farms: FarmOption[];
  selectedId: string | null;
  label: string;
  /** When true the selector collapses to a "register first" prompt. */
  onNoFarms?: () => void;
};

/* Farm switcher (US1/US3): changing the selection re-renders the server page
   via the ?farm= query param so advisories and forecast reload for that farm. */
export default function FarmSelector({ farms, selectedId, label }: FarmSelectorProps) {
  const router = useRouter();

  if (farms.length === 0) return null;

  return (
    <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-agro-slate">
      <span>{label}</span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value ? `/weather?farm=${value}` : "/weather");
        }}
        className="w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
      >
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name} — {farm.cropLabel || "—"}
          </option>
        ))}
      </select>
      <ChevronRightIcon size={14} className="text-agro-slate" />
    </label>
  );
}
