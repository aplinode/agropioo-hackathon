import { query } from "@/lib/db";
import { requireSessionPage } from "@/lib/auth/guards";
import { getPestBundle } from "@/lib/i18n/server";
import PestPageClient from "@/components/pest/PestPageClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

type FarmRow = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  crops: string[];
  growth_stages: Record<string, string>;
  primary_crop: string | null;
};

export default async function PestPage() {
  const session = await requireSessionPage();
  const bundle = await getPestBundle();

  const farms = await query<FarmRow>(
    `SELECT id, name, district, lat, lng, crops, growth_stages, primary_crop FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
    [session.accountId],
  );

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-agro-sprout bg-white p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
          {bundle.eyebrow}
        </p>
        <h1 className="display-heading mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-agro-forest">
          {bundle.pageTitle}
        </h1>
        <div className="mt-6 text-center">
          <p className="text-sm text-agro-slate">{bundle.noFarmsTitle}</p>
          <p className="mt-1 text-sm text-agro-slate">{bundle.noFarmsBody}</p>
          <Link
            href="/farms/new"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
          >
            {bundle.addFarm}
          </Link>
        </div>
      </div>
    );
  }

  return <PestPageClient bundle={bundle} farms={farms} />;
}
