"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import MandiPriceCard, { type MandiPrice } from "@/components/prices/mandi-price-card";
import MarketComparisonTable from "@/components/prices/market-comparison-table";
import PredictionChart from "@/components/prices/prediction-chart";
import { SearchIcon } from "@/components/icons";
import type { PricesBundle } from "./prices-bundle";
import type { ForecastPoint } from "@/lib/prices/forecast";

type CropOption = { id: string; name_en: string };

type PricesResponse = {
  district: string | null;
  is_fallback_hub: boolean;
  prices: MandiPrice[];
};

type PredictionResponse = {
  predictions: ForecastPoint[];
  volatility_warning: boolean;
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
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [predictionPending, setPredictionPending] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!selectedCrop || prices.prices.length === 0) {
        if (!cancelled) setPrediction(null);
        return;
      }

      const best = prices.prices.reduce((max, p) =>
        p.modal_price > max.modal_price ? p : max, prices.prices[0]);
      if (!best) {
        if (!cancelled) setPrediction(null);
        return;
      }

      if (!cancelled) setPredictionPending(true);
      const url = new URL("/api/prices/predictions", window.location.origin);
      url.searchParams.set("crop_id", best.crop_id);
      url.searchParams.set("mandi_id", best.mandi_id);
      const res = await fetch(url.toString(), { credentials: "same-origin" });
      if (!cancelled) {
        setPredictionPending(false);
        if (res.ok) {
          const data = (await res.json()) as PredictionResponse;
          setPrediction(data);
        } else {
          setPrediction(null);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedCrop, prices.prices]);

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
          {selectedCrop && prediction ? (
            <div className="space-y-3">
              {prediction.volatility_warning ? (
                <div className="rounded-xl bg-agro-wheat/20 p-3 text-sm font-semibold text-agro-earth">
                  {bundle.volatilityWarning}
                </div>
              ) : null}
              <PredictionChart predictions={prediction.predictions} bundle={bundle} />
            </div>
          ) : null}
          {selectedCrop && predictionPending ? (
            <div className="flex items-center gap-3 rounded-2xl border border-agro-sprout bg-white p-6 text-agro-slate">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-agro-sprout border-t-agro-canopy" />
              {bundle.loading}
            </div>
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
