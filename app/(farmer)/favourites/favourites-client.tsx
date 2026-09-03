"use client";

import { useState, useEffect, useTransition } from "react";
import FavoriteCropStar from "@/components/prices/favorite-crop-star";
import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

type CropOption = { id: string; name_en: string };
type Favourite = { crop_id: string; display_order: number };

export default function FavouritesClient({ bundle, crops }: { bundle: PricesBundle; crops: CropOption[] }) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/favourites", { credentials: "same-origin" });
      if (!cancelled && res.ok) {
        const data = await res.json();
        setFavourites(data.favourites ?? []);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function toggleFavourite(cropId: string) {
    startTransition(async () => {
      const isFav = favourites.some((f) => f.crop_id === cropId);
      const url = "/api/favourites";
      const method = isFav ? "DELETE" : "POST";
      const body = isFav ? undefined : JSON.stringify({ crop_id: cropId, display_order: 0 });

      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body,
      });

      if (res.ok) {
        const data = await res.json();
        setFavourites(data.favourites ?? []);
      }
    });
  }

  async function removeFavourite(cropId: string) {
    setRemoving(cropId);
    const res = await fetch("/api/favourites?crop_id=" + encodeURIComponent(cropId), {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = await res.json();
      setFavourites(data.favourites ?? []);
    }
    setRemoving(null);
  }

  const favCrops = favourites
    .map((f) => crops.find((c) => c.id === f.crop_id))
    .filter((c): c is CropOption => Boolean(c));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-agro-forest">{bundle.title}</h1>
        <p className="mt-2 text-agro-slate">{bundle.description}</p>
      </header>

      {pending ? (
        <div className="flex items-center gap-3 rounded-2xl border border-agro-sprout bg-white p-6 text-agro-slate">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-agro-sprout border-t-agro-canopy" />
          {bundle.loading}
        </div>
      ) : favCrops.length === 0 ? (
        <div className="rounded-2xl border border-agro-sprout bg-white p-8 text-center">
          <p className="text-agro-slate">{bundle.noPricesForCrop}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {favCrops.map((crop) => (
            <li
              key={crop.id}
              className="flex items-center justify-between rounded-3xl border border-agro-sprout bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <FavoriteCropStar
                  cropId={crop.id}
                  isFavorite={true}
                  onToggle={toggleFavourite}
                  ariaLabel={"Remove " + crop.name_en + " from favourites"}
                />
                <span className="text-sm font-semibold capitalize text-agro-forest">{crop.name_en}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFavourite(crop.id)}
                disabled={removing === crop.id}
                className="text-xs font-semibold text-agro-earth hover:text-agro-forest disabled:opacity-50"
              >
                {removing === crop.id ? bundle.loading : bundle.deleteAlert}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
