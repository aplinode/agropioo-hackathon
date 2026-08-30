"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

type CropOption = { id: string; name_en: string };
type MandiOption = { id: string; name_en: string; district?: string };

type GlobalMandiSearchProps = {
  crops: CropOption[];
  mandis: MandiOption[];
  bundle: Pick<
    PricesBundle,
    | "globalSearchPlaceholder"
    | "globalSearchCrops"
    | "globalSearchMandis"
    | "globalSearchNoResults"
    | "globalSearchViewPrices"
  >;
};

export default function GlobalMandiSearch({ crops, mandis, bundle }: GlobalMandiSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalized = query.trim().toLowerCase();
  const filteredCrops = normalized
    ? crops.filter((c) => c.name_en.toLowerCase().includes(normalized)).slice(0, 5)
    : [];
  const filteredMandis = normalized
    ? mandis.filter((m) => m.name_en.toLowerCase().includes(normalized)).slice(0, 5)
    : [];
  const hasResults = filteredCrops.length > 0 || filteredMandis.length > 0;

  function selectCrop(id: string) {
    router.push(`/prices?crop=${encodeURIComponent(id)}`);
    setQuery("");
    setOpen(false);
  }

  function selectMandi(id: string) {
    router.push(`/prices?mandi=${encodeURIComponent(id)}`);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="global-mandi-search" className="sr-only">
        {bundle.globalSearchPlaceholder}
      </label>
      <div className="relative">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-agro-cloud"
        />
        <input
          id="global-mandi-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={bundle.globalSearchPlaceholder}
          className="w-full rounded-xl border border-agro-sprout bg-white py-2.5 pl-10 pr-4 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
        />
      </div>

      {open && normalized && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-agro-sprout bg-white shadow-sm">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-agro-slate">{bundle.globalSearchNoResults}</p>
          ) : (
            <div className="max-h-72 overflow-auto py-1">
              {filteredCrops.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-agro-slate">
                    {bundle.globalSearchCrops}
                  </p>
                  <ul>
                    {filteredCrops.map((crop) => (
                      <li key={crop.id}>
                        <button
                          type="button"
                          onClick={() => selectCrop(crop.id)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-agro-ink hover:bg-agro-mint"
                        >
                          <span>{crop.name_en}</span>
                          <span className="text-xs text-agro-canopy">{bundle.globalSearchViewPrices}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {filteredMandis.length > 0 && (
                <div className={filteredCrops.length > 0 ? "mt-1 border-t border-agro-sprout pt-1" : ""}>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-agro-slate">
                    {bundle.globalSearchMandis}
                  </p>
                  <ul>
                    {filteredMandis.map((mandi) => (
                      <li key={mandi.id}>
                        <button
                          type="button"
                          onClick={() => selectMandi(mandi.id)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-agro-ink hover:bg-agro-mint"
                        >
                          <span>{mandi.name_en}</span>
                          <span className="text-xs text-agro-canopy">{bundle.globalSearchViewPrices}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
