"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@/components/icons";

export type FarmOption = {
  id: string;
  name: string;
  cropLabel: string;
  location: string;
  district: string;
};

export type FarmSelectorProps = {
  farms: FarmOption[];
  selectedId: string | null;
  label: string;
  onNoFarms?: () => void;
};

export default function FarmSelector({ farms, selectedId, label }: FarmSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (farms.length === 0) return null;

  const selectedFarm = farms.find((f) => f.id === selectedId);

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-agro-slate">{label}</span>
      <div ref={containerRef} className="relative mt-2 w-full max-w-sm">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="focus-ring-none flex h-12 w-full items-center justify-between rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-xs text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-agro-canopy/20 focus:border-agro-canopy"
        >
          <span className="truncate">
            {selectedFarm
              ? `${selectedFarm.name} — ${selectedFarm.district}${selectedFarm.location ? `, ${selectedFarm.location}` : ""}`
              : label}
          </span>
          <ChevronDownIcon className={`h-4 w-4 shrink-0 text-agro-slate transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-agro-sprout bg-white shadow-xl">
            {farms.map((farm) => (
              <li key={farm.id}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/weather?farm=${farm.id}`);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2.5 text-start text-xs transition-colors ${
                    farm.id === selectedId ? "bg-agro-canopy/10 font-semibold text-agro-canopy" : "text-agro-ink hover:bg-agro-mint"
                  }`}
                >
                  {farm.id === selectedId && <CheckIcon size={14} className="me-2 shrink-0 text-agro-canopy" />}
                  <div className="flex flex-col">
                    <span>{farm.name}</span>
                    <span className="text-[0.7rem] text-agro-slate">
                      {farm.district}{farm.location ? `, ${farm.location}` : ""}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
