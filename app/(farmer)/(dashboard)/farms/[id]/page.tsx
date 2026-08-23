import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CloudRainIcon,
  LeafIcon,
  SproutIcon,
  WheatIcon,
  FlaskIcon,
  BugIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
} from "@/components/icons";
import { demoFarms } from "@/app/(farmer)/(dashboard)/dashboard/demo-data";
import { recordsForFarm } from "../demo-data";

export const metadata: Metadata = {
  title: "Farm details — Agropioo",
};

const healthChip = {
  good: "bg-agro-mint text-agro-canopy",
  watch: "border border-white/30 bg-white/10 text-white",
} as const;

/* Crop-to-stage track: plain words a farmer uses for the season's steps. */
const stageTrackByCrop: Record<string, string[]> = {
  wheat: ["Sowing", "Tillering", "Vegetative", "Grain filling", "Ready"],
  cotton: ["Sowing", "Squaring", "Flowering", "Boll filling", "Ready"],
  sugarcane: ["Sowing", "Tillering", "Grand growth", "Ripening", "Harvest"],
};

const recordKindIcon = {
  irrigation: CloudRainIcon,
  fertilizer: SproutIcon,
  pesticide: FlaskIcon,
  disease: BugIcon,
  harvest: WheatIcon,
} as const;

function stageTrackFor(crops: string): string[] {
  return (
    Object.entries(stageTrackByCrop).find(([crop]) =>
      crops.toLowerCase().includes(crop)
    )?.[1] ?? stageTrackByCrop.wheat
  );
}

/* Farm detail: the farm's story in one screen — season position, health,
   and what has happened in the field recently. */
export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = demoFarms.find((candidate) => candidate.id === id);
  if (!farm) notFound();

  const track = stageTrackFor(farm.crops);
  const currentStepIndex = Math.max(
    0,
    track.findIndex((step) => step.toLowerCase() === farm.stage.toLowerCase())
  );
  const records = recordsForFarm(farm.id);

  return (
    <div className="space-y-8 pt-1">
      {/* Farm hero */}
      <header className="relative overflow-hidden rounded-3xl bg-agro-forest p-6 text-white sm:p-8">
        <svg
          className="drift pointer-events-none absolute -end-24 -top-24 h-56 w-56 text-agro-sprout/15"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
        </svg>
        <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-sprout">
          Farm details
        </p>
        <h1 className="display-heading relative mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {farm.name}
        </h1>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${healthChip[farm.health]}`}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                farm.health === "good" ? "bg-agro-success" : "border border-agro-sprout"
              }`}
              aria-hidden="true"
            />
            {farm.health === "good" ? "Good health" : "Needs watching"}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-agro-sprout">
            {farm.crops}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            {farm.acres} acres
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            Sown {farm.sownOn}
          </span>
        </div>
      </header>

      {/* Season position */}
      <section aria-labelledby="season-heading">
        <h2
          id="season-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Where the crop stands
        </h2>
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {track.map((step, index) => {
            const done = index < currentStepIndex;
            const current = index === currentStepIndex;
            return (
              <li key={step}>
                <span
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ${
                    current
                      ? "bg-agro-canopy font-semibold text-white"
                      : done
                        ? "bg-agro-mint text-agro-canopy"
                        : "border border-agro-sprout bg-white text-agro-slate"
                  }`}
                  {...(current ? { "aria-current": "step" as const } : {})}
                >
                  {done && <LeafIcon size={14} aria-hidden="true" />}
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Recent field activity */}
      <section aria-labelledby="activity-heading">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="activity-heading"
            className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
          >
            Field activity
          </h2>
          <Link
            href={`/farms/${farm.id}/records`}
            className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
          >
            View all records
          </Link>
        </div>

        <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
          {records.map((record) => {
            const KindIcon = recordKindIcon[record.type];
            return (
              <li key={record.id} className="flex items-start gap-3 p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
                  <KindIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-agro-ink">
                    {record.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-agro-slate">
                    {record.note}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                  {record.when}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/records/new"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
        >
          Log a field event
          <ArrowRightIcon size={16} />
        </Link>
        <Link
          href="/detect"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint"
        >
          <AlertTriangleIcon size={16} className="text-agro-canopy" />
          Scan this crop
        </Link>
      </div>
    </div>
  );
}
