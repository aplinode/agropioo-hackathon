import type { Metadata } from "next";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { getPricesBundle } from "@/lib/i18n/server";
import FavouritesClient from "./favourites-client";

export const metadata: Metadata = {
  title: "Favourite Crops — Agropioo",
};

export default async function FavouritesPage() {
  await requireSessionPage();

  const [bundle, crops] = await Promise.all([
    getPricesBundle(),
    query<{ id: string; name_en: string }>(`select id, name_en from crops order by name_en`),
  ]);

  return (
    <div className="pt-1">
      <div className="mt-6">
        <FavouritesClient bundle={bundle} crops={crops ?? []} />
      </div>
    </div>
  );
}
