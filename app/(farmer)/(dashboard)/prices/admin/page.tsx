import type { Metadata } from "next";
import { requireSessionPage } from "@/lib/auth/guards";
import { getPricesBundle } from "@/lib/i18n/server";
import { query } from "@/lib/db";
import AdminForm from "./admin-form";

export const metadata: Metadata = {
  title: "Manual Price Entry — Agropioo",
};

export default async function AdminPricePage() {
  await requireSessionPage();

  const [bundle, crops, mandis] = await Promise.all([
    getPricesBundle(),
    query<{ id: string; name_en: string }>(`select id, name_en from crops order by name_en`),
    query<{ id: string; name_en: string; district: string }>(
      `select id, name_en, district from mandis order by district, name_en`
    ),
  ]);

  return (
    <div className="pt-1">
      <div className="mt-6 max-w-2xl">
        <p className="eyebrow text-agro-canopy">{bundle.eyebrow}</p>
        <h1 className="display-heading mt-1 font-display text-3xl font-bold text-agro-forest">
          {bundle.adminTitle}
        </h1>
        <p className="mt-2 text-agro-slate">Enter or correct today&apos;s mandi price for a crop and market.</p>

        <div className="mt-6 rounded-3xl border border-agro-sprout bg-white p-5 sm:p-6">
          <AdminForm bundle={bundle} crops={crops ?? []} mandis={mandis ?? []} />
        </div>
      </div>
    </div>
  );
}
