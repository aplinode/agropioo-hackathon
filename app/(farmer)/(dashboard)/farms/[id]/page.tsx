import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CloudRainIcon,
} from "@/components/icons";
import { getFarmsBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { computeFarmHealth } from "@/lib/farms/health";
import FarmRecordsSection from "./farm-records-section";

export const metadata: Metadata = {
  title: "Farm details — Agropioo",
};

const healthChip = {
  good: "bg-agro-mint text-agro-canopy",
  watch: "border border-white/30 bg-white/10 text-white",
} as const;

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionPage();
  const { id } = await params;
  let farm: Record<string, unknown> | null = null;
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [id, session.accountId]
    );
    const data = rows[0] ?? null;

    if (data) {
      const recentRecords = await query<Record<string, unknown>>(
        `SELECT * FROM records WHERE farm_id = $1 ORDER BY event_date DESC, created_at DESC LIMIT 6`,
        [id]
      );

      const health = computeFarmHealth(data.growth_stages as Record<string, string>, recentRecords);

      farm = {
        ...data,
        health,
        recent_records: recentRecords,
      };
    }
  } catch (err) {
    console.error("Error fetching farm detail:", err);
  }
  if (!farm) notFound();

  const bundle = await getFarmsBundle();
  const f = farm as Record<string, unknown>;

  let weather: { temp_c: number | null; condition: string | null } | null = null;
  if ((f.lat as number) != null && (f.lng as number) != null) {
    try {
      const weatherRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather/current?lat=${f.lat}&lng=${f.lng}`, { cache: 'no-store' });
      if (weatherRes.ok) weather = await weatherRes.json();
    } catch {}
  }

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
          {f.name as string}
        </h1>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${f.health === 'good' ? healthChip.good : healthChip.watch}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${f.health === 'good' ? 'bg-agro-success' : 'border border-agro-sprout'}`} aria-hidden="true" />
            {f.health === 'good' ? bundle.detail.goodHealth : bundle.detail.needsWatching}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-agro-sprout">
            {Array.isArray(f.crops) ? (f.crops as string[]).join(', ') : String(f.crops)}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            {f.acres} {bundle.unitsAcres}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            {f.district as string}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
            {f.location as string}
          </span>
          {weather && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
              <CloudRainIcon size={14} /> {weather.temp_c != null ? `${Math.round(weather.temp_c)}°C` : ''} {weather.condition || ''}
            </span>
          )}
        </div>
      </header>

      <FarmRecordsSection
        farmId={f.id as string}
        records={(f.recent_records as Record<string, unknown>[]) || []}
        bundle={bundle}
      />
    </div>
  );
}
