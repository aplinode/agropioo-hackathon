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
  ArrowRightIcon,
  MapPinIcon,
  RecordIcon,
} from "@/components/icons";
import { getFarmsBundle } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Farm details — Agropioo",
};

const healthChip = {
  good: "bg-agro-mint text-agro-canopy",
  watch: "border border-white/30 bg-white/10 text-white",
} as const;

const recordKindIcon: Record<string, React.ComponentType<{size?: number}>> = {
  irrigation: CloudRainIcon,
  fertilizer: SproutIcon,
  pesticide: FlaskIcon,
  disease: BugIcon,
  harvest: WheatIcon,
  sowing: SproutIcon,
  planting: LeafIcon,
};

const stageTrackByCrop: Record<string, string[]> = {
  wheat: ['sowing', 'tillering', 'vegetative', 'grainFilling', 'ready'],
  cotton: ['sowing', 'squaring', 'flowering', 'bollFilling', 'ready'],
  sugarcane: ['sowing', 'tillering', 'grandGrowth', 'ripening', 'harvest'],
  maize: ['sowing', 'vegetative', 'tasselling', 'grainFilling', 'ready'],
  rice: ['sowing', 'tillering', 'panicleinitiation', 'grainFilling', 'ready'],
};

type StageKey = 'sowing' | 'tillering' | 'vegetative' | 'grainFilling' | 'ready' | 'squaring' | 'flowering' | 'bollFilling' | 'grandGrowth' | 'ripening' | 'harvest' | 'panicleinitiation';

function stageTrackFor(crops: string[]): StageKey[] {
  for (const c of crops) {
    const found = stageTrackByCrop[c.toLowerCase()];
    if (found) return found as unknown as StageKey[];
  }
  return stageTrackByCrop.wheat as unknown as StageKey[];
}

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let farm: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/farms/${id}`, { cache: 'no-store' });
    if (res.ok) farm = await res.json();
  } catch {}
  if (!farm) notFound();

  const bundle = await getFarmsBundle();
  const crops = Array.isArray(farm.crops) ? (farm.crops as unknown as string[]) : [];
  const track = stageTrackFor(crops);
  const currentCrop = crops[0]?.toLowerCase() || 'wheat';
  const currentStage = ((farm.growth_stages as Record<string, string>)?.[currentCrop] as string) || 'Sowing';
  const stageKey = currentStage.toLowerCase().replace(/\s+/g, '');
  const currentStepIndex = Math.max(0, track.findIndex((s) => s === stageKey || s.includes(stageKey)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = farm as any;

  const stageLabel: Record<string, string> = {
    sowing: bundle.stages.sowing,
    tillering: bundle.stages.tillering,
    vegetative: bundle.stages.vegetative,
    grainfilling: bundle.stages.grainFilling,
    ready: bundle.stages.ready,
    squaring: bundle.stages.squaring,
    flowering: bundle.stages.flowering,
    bollfilling: bundle.stages.bollFilling,
    grandgrowth: bundle.stages.grandGrowth,
    ripening: bundle.stages.ripening,
    harvest: bundle.stages.harvest,
    panicleinitiation: bundle.stages.panicleInitiation || 'Panicle initiation',
  };

  let weather: { temp_c: number | null; condition: string | null } | null = null;
  if ((farm.lat as number) != null && (farm.lng as number) != null) {
    try {
      const weatherRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather/current?lat=${farm.lat}&lng=${farm.lng}`, { cache: 'no-store' });
      if (weatherRes.ok) weather = await weatherRes.json();
    } catch {}
  }

  const recentRecords = farm.recent_records || [];

  return (
    <div className="space-y-8 pt-1">
      <header className="relative overflow-hidden rounded-3xl bg-agro-forest p-6 text-white sm:p-8">
        <svg className="drift pointer-events-none absolute -end-24 -top-24 h-56 w-56 text-agro-sprout/15" viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
        </svg>
        <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-sprout">
          {bundle.detail.heroEyebrow}
        </p>
        <h1 className="display-heading relative mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {f.name}
        </h1>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${f.health === 'good' ? healthChip.good : healthChip.watch}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${f.health === 'good' ? 'bg-agro-success' : 'border border-agro-sprout'}`} aria-hidden="true" />
            {f.health === 'good' ? bundle.detail.goodHealth : bundle.detail.needsWatching}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-agro-sprout">
            {Array.isArray(f.crops) ? f.crops.join(', ') : String(f.crops)}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            {f.acres} {bundle.unitsAcres}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            {f.district}
          </span>
        </div>
      </header>

      <section aria-labelledby="season-heading" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="season-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            {bundle.detail.seasonHeading}
          </h2>
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {track.map((step, index) => {
              const done = index < currentStepIndex;
              const current = index === currentStepIndex;
              const label = stageLabel[step] || step;
              return (
                <li key={step}>
                  <span className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ${current ? 'bg-agro-canopy font-semibold text-white' : done ? 'bg-agro-mint text-agro-canopy' : 'border border-agro-sprout bg-white text-agro-slate'}`} {...(current ? { 'aria-current': 'step' as const } : {})}>
                    {done && <LeafIcon size={14} aria-hidden="true" />}
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        {weather && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
            <CloudRainIcon size={14} /> {weather.temp_c != null ? `${Math.round(weather.temp_c)}°C` : ''} {weather.condition || ''}
          </span>
        )}
      </section>

      <section aria-labelledby="activity-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="activity-heading" className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            {bundle.detail.activityHeading}
          </h2>
          <Link href={`/farms/${f.id}/records`} className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline">
            {bundle.detail.viewAllRecords}
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
          {(recentRecords as Record<string, unknown>[]).map((record) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = record as any;
            const KindIcon = recordKindIcon[r.type] || RecordIcon;
            return (
              <li key={r.id} className="flex items-start gap-3 p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
                  <KindIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-agro-ink">{r.title || r.type}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-agro-slate">{r.note}</p>
                </div>
                <span className="shrink-0 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">{r.event_date}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/records/new?farm=${f.id}`} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0">
          {bundle.detail.logFieldEvent}
          <ArrowRightIcon size={16} />
        </Link>
        <form action={`/api/farms/${f.id}/archive`} method="POST">
          <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint">
            <MapPinIcon size={16} className="text-agro-canopy" />
            Archive farm
          </button>
        </form>
      </div>
    </div>
  );
}
