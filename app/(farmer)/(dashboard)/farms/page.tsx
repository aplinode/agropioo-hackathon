import type { Metadata } from "next";
import Link from "next/link";
import { demoFarms } from "@/app/(farmer)/(dashboard)/dashboard/demo-data";
import PageHeader from "@/components/shell/page-header";
import {
  ChevronRightIcon,
  LeafIcon,
  MapPinIcon,
  PlusIcon,
} from "@/components/icons";
import { getFarmsBundle } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Farms — Agropioo",
};

const healthChip = {
  good: "bg-agro-mint text-agro-canopy",
  watch: "border border-agro-canopy/30 bg-white text-agro-ink",
} as const;

/* Farm list: every farm with crop, stage, and health at a glance. */
export default async function FarmsPage() {
  const bundle = await getFarmsBundle();

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={bundle.eyebrow}
        title={bundle.list.heading}
        description={bundle.list.description}
        action={
          <Link
            href="/farms/new"
            className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline lg:hidden"
          >
            <PlusIcon className="h-4 w-4" />
            {bundle.list.addLink}
          </Link>
        }
      />

      <ul className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {demoFarms.map((farm) => (
          <li key={farm.id}>
            <Link
              href={`/farms/${farm.id}`}
              className="group flex h-full flex-col rounded-2xl border border-agro-sprout bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                  <LeafIcon className="h-4 w-4" />
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${healthChip[farm.health]}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      farm.health === "good" ? "bg-agro-success" : "border border-agro-forest"
                    }`}
                    aria-hidden="true"
                  />
                  {farm.health === "good" ? bundle.healthGood : bundle.healthWatch}
                </span>
              </div>

              <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-agro-ink">
                {farm.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-agro-slate">
                <MapPinIcon size={15} className="shrink-0 text-agro-canopy" />
                {farm.location}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-canopy">
                  {farm.crops}
                </span>
                <span className="rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                  {farm.stage}
                </span>
                <span className="rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                  {farm.acres} {bundle.unitsAcres}
                </span>
              </div>

              <span className="mt-4 inline-flex min-h-11 items-center gap-1 pt-1 text-sm font-semibold text-agro-canopy underline-offset-4 group-hover:underline">
                {bundle.list.openFarm}
                <ChevronRightIcon
                  className="h-4 w-4 transition-colors duration-200 group-hover:text-agro-canopy"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}

        <li>
          <Link
            href="/farms/new"
            className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-agro-sprout p-4 text-agro-canopy transition-colors hover:border-agro-canopy hover:bg-agro-mint"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">{bundle.list.addNewFarm}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
