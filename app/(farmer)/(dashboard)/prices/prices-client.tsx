"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import MandiPriceCard, { type MandiPrice } from "@/components/prices/mandi-price-card";
import MarketComparisonTable from "@/components/prices/market-comparison-table";
import { SearchIcon } from "@/components/icons";
import type { PricesBundle } from "./prices-bundle";

type CropOption = { id: string; name_en: string };

type PricesResponse = {
  district: string | null;
  is_fallback_hub: boolean;
  prices: MandiPrice[];
};

interface PricesClientProps {
  bundle: PricesBundle;
  crops: CropOption[];
  initial: PricesResponse;
}

export default function PricesClient({ bundle, crops, initial }: PricesClientProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [prices, setPrices] = useState<PricesResponse>(initial);
  const [isPending, startTransition] = useTransition();

  async function loadPrices(params: { crop_id?: string; query?: string }) {
    startTransition(async () => {
      const url = new URL("/api/prices", window.location.origin);
      if (params.crop_id) url.searchParams.set("crop_id", params.crop_id);
      if (params.query) url.searchParams.set("query", params.query);
      const res = await fetch(url.toString(), { credentials: "same-origin" });
      if (!res.ok) {
        setPrices({ district: null, is_fallback_hub: false, prices: [] });
        return;
      }
      const data = (await res.json()) as PricesResponse;
      setPrices(data);
    });
  }

  function handleCropChange(cropId: string) {
    setSelectedCrop(cropId);
    setSearchQuery("");
    loadPrices({ crop_id: cropId || undefined });
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSelectedCrop("");
    loadPrices({ query: searchQuery });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow text-agro-canopy">{bundle.eyebrow}</p>
        <h1 className="display-heading mt-1 font-display text-3xl font-bold text-agro-forest">
          {bundle.title}
        </h1>
        <p className="mt-2 text-agro-slate">{bundle.description}</p>
      </header>

      {prices.is_fallback_hub ? (
        <div className="rounded-2xl bg-agro-wheat/20 p-4 text-sm font-semibold text-agro-forest">
          {bundle.fallbackBanner}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-56">
          <label htmlFor="crop-select" className="sr-only">
            {bundle.selectCrop}
          </label>
          <select
            id="crop-select"
            value={selectedCrop}
            onChange={(e) => handleCropChange(e.target.value)}
            className="w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
          >
            <option value="">{bundle.selectCrop}</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name_en}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1">
          <label htmlFor="price-search" className="sr-only">
            {bundle.searchPlaceholder}
          </label>
          <div className="relative">
            <SearchIcon
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-agro-cloud"
            />
            <input
              id="price-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={bundle.searchPlaceholder}
              className="w-full rounded-xl border border-agro-sprout bg-white py-2.5 pl-10 pr-4 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
            />
          </div>
        </form>
      </div>

      {prices.district && !prices.is_fallback_hub ? (
        <p className="text-sm text-agro-slate">
          Showing prices near <span className="font-semibold capitalize text-agro-forest">{prices.district}</span>
        </p>
      ) : null}

      {isPending ? (
        <div className="flex items-center gap-3 rounded-2xl border border-agro-sprout bg-white p-6 text-agro-slate">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-agro-sprout border-t-agro-canopy" />
          {bundle.loading}
        </div>
      ) : prices.prices.length > 0 ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prices.prices.map((price) => (
              <MandiPriceCard key={`${price.mandi_id}:${price.crop_id}`} price={price} bundle={bundle} />
            ))}
          </div>
          {selectedCrop ? (
            <MarketComparisonTable prices={prices.prices} bundle={bundle} />
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-agro-sprout bg-white p-8 text-center">
          <p className="text-agro-slate">{bundle.noPricesForCrop}</p>
        </div>
      )}

      <div className="pt-4">
        <Link
          href="/prices/admin"
          className="inline-flex items-center rounded-xl bg-agro-canopy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
        >
          {bundle.adminTitle}
        </Link>
      </div>
    </div>
  );
}
