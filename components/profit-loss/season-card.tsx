"use client";

import Link from "next/link";
import type { Season } from "@/lib/validation/profit-loss";

const statusChip = {
  active: "bg-agro-mint text-agro-canopy",
  harvested: "bg-agro-wheat text-agro-forest",
  completed: "bg-agro-stone text-agro-ink",
};

const roiChip = {
  profit: "bg-agro-mint text-agro-canopy",
  loss: "bg-red-50 text-agro-error",
  break_even: "bg-agro-wheat/20 text-agro-forest",
};

export default function SeasonCard({ season }: { season: Season & { farm_name?: string; crop_name?: string; pl?: { netProfitLoss: number; roi: number | null } } }) {
  const pl = season.pl ?? { netProfitLoss: 0, roi: null };
  const roiStatus = pl.roi === null ? "break_even" : pl.roi > 0 ? "profit" : pl.roi < 0 ? "loss" : "break_even";

  return (
    <Link
      href={`/profit-loss/${season.id}`}
      className="flex h-full flex-col rounded-2xl border border-agro-sprout bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21v-8" />
            <path d="M12 13c-2.4 0-4.2-1.7-4.6-4.3C9.9 9 11.6 10.5 12 13Z" />
            <path d="M12 13c2.4 0 4.2-1.7 4.6-4.3C14.1 9 12.4 10.5 12 13Z" />
            <path d="M12 9c-2.4 0-4.2-1.7-4.6-4.3C9.9 5 11.6 6.5 12 9Z" />
            <path d="M12 9c2.4 0 4.2-1.7 4.6-4.3C14.1 5 12.4 6.5 12 9Z" />
            <path d="M12 21c-2 0-3.6-1.3-4-3.4 2 .2 3.4 1.4 4 3.4Z" />
            <path d="M12 21c2 0 3.6-1.3 4-3.4-2 .2-3.4 1.4-4 3.4Z" />
          </svg>
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${statusChip[season.status as keyof typeof statusChip] ?? statusChip.active}`}>
          {season.status}
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-agro-ink">
        {season.crop_name ?? season.crop_id}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-agro-slate">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-agro-canopy" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {season.farm_name ?? season.farm_id}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-canopy">
          {season.season} {season.year}
        </span>
        <span className="rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
          {season.acres} acres
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${pl.netProfitLoss >= 0 ? "bg-agro-mint text-agro-canopy" : "bg-red-50 text-agro-error"}`}>
          {pl.netProfitLoss >= 0 ? "Profit" : "Loss"}: PKR {Math.abs(pl.netProfitLoss).toLocaleString("en-PK")}
        </span>
        {pl.roi !== null && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${roiChip[roiStatus]}`}>
            ROI: {pl.roi}%
          </span>
        )}
      </div>

      <span className="mt-4 inline-flex min-h-11 items-center gap-1 pt-1 text-sm font-semibold text-agro-canopy underline-offset-4 group-hover:underline">
        View details
        <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </Link>
  );
}
