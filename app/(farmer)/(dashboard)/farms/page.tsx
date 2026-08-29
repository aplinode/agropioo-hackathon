import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shell/page-header";
import {
  ChevronRightIcon,
  LeafIcon,
  MapPinIcon,
  PlusIcon,
} from "@/components/icons";
import { getFarmsBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { computeFarmHealth } from "@/lib/farms/health";

export const metadata: Metadata = {
  title: "Farms — Agropioo",
};

const healthChip = {
  good: "bg-agro-mint text-agro-canopy",
  watch: "border border-agro-canopy/30 bg-white text-agro-ink",
} as const;

export default async function FarmsPage() {
  const session = await requireSessionPage();
  const bundle = await getFarmsBundle();
  let farms: Array<Record<string, unknown>> = [];

  try {
    const rawFarms = await query<Record<string, unknown>>(
      `SELECT * FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
      [session.accountId]
    );

    farms = await Promise.all(
      rawFarms.map(async (farm) => {
        const recent = await query<{ type: string; event_date: string }>(
          `SELECT type, event_date FROM records WHERE farm_id = $1 ORDER BY event_date DESC LIMIT 5`,
          [farm.id]
        );

        return {
          ...farm,
          health: computeFarmHealth(farm.growth_stages as Record<string, string>, recent),
        };
      })
    );
  } catch (err) {
    console.error("Error fetching farms:", err);
  }

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={bundle.eyebrow}
        title={bundle.list.heading}
        description={bundle.list.description}
        action={
          <>
            <Link
              href="/farms/new"
              className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline lg:hidden"
            >
              <PlusIcon className="h-4 w-4" />
              {bundle.list.addLink}
            </Link>
            <Link
              href="/farms/new"
              className="hidden lg:inline-flex h-11 items-center gap-2 rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md"
            >
              <PlusIcon className="h-4 w-4" />
              {bundle.list.addNewFarm}
            </Link>
          </>
        }
      />

      {farms.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-agro-sprout bg-white p-8 text-center">
          <p className="text-sm text-agro-slate">{bundle.list.emptyHeading}</p>
          <Link href="/farms/new" className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white">
            {bundle.list.addNewFarm}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2">
          {farms.map((farm) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const f = farm as any;
            return (
            <li key={f.id}>
              <Link
                href={`/farms/${f.id}`}
                className="group flex h-full flex-col rounded-2xl border border-agro-sprout bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                    <LeafIcon className="h-4 w-4" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${f.health === 'good' ? healthChip.good : healthChip.watch}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        f.health === 'good' ? 'bg-agro-success' : 'border border-agro-forest'
                      }`}
                      aria-hidden="true"
                    />
                    {f.health === 'good' ? bundle.healthGood : bundle.healthWatch}
                  </span>
                </div>

                <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-agro-ink">
                  {f.name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-agro-slate">
                  <MapPinIcon size={15} className="shrink-0 text-agro-canopy" />
                  {f.location}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-canopy">
                    {Array.isArray(f.crops) ? f.crops.join(', ') : String(f.crops)}
                  </span>
                  {f.growth_stages && typeof f.growth_stages === 'object' && Object.entries(f.growth_stages).map(([crop, stage]: [string, unknown]) => (
                    <span key={crop} className="rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                      {crop}: {String(stage)}
                    </span>
                  ))}
                  <span className="rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                    {f.acres} {bundle.unitsAcres}
                  </span>
                </div>

                <span className="mt-4 inline-flex min-h-11 items-center gap-1 pt-1 text-sm font-semibold text-agro-canopy underline-offset-4 group-hover:underline">
                  {bundle.list.openFarm}
                  <ChevronRightIcon
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
