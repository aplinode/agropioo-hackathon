import { query } from "@/lib/db";
import { requireSessionPage } from "@/lib/auth/guards";
import { getPestBundle } from "@/lib/i18n/server";
import PestForecastChart from "@/components/pest/PestForecastChart";
import GrowthStageEditor from "@/components/pest/GrowthStageEditor";
import Link from "next/link";
import PageHeader from "@/components/shell/page-header";

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
        <PageHeader eyebrow={bundle.eyebrow} title={bundle.pageTitle} description={bundle.description} />
        <div className="mt-6 text-center">
          <p className="text-sm text-agro-slate">{bundle.noFarmsTitle}</p>
          <p className="mt-1 text-sm text-agro-slate">{bundle.noFarmsBody}</p>
            <Link href="/farms/new" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest">
              {bundle.addFarm}
            </Link>
        </div>
      </div>
    );
  }

  const primary = farms[0];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <PageHeader eyebrow={bundle.eyebrow} title={bundle.pageTitle} description={bundle.description} />
      </div>
      <PestForecastChart
        bundle={bundle}
        farmId={primary.id}
        farmName={primary.name}
        initialDays={[]}
      />
      <GrowthStageEditor
        bundle={bundle}
        farmId={primary.id}
        crops={primary.crops}
        initialStages={primary.growth_stages ?? {}}
      />
    </div>
  );
}
