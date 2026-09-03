import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shell/page-header";
import { PlusIcon } from "@/components/icons";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";

export const metadata: Metadata = {
  title: "Profit / Loss — Agropioo",
};

export default async function ProfitLossPage() {
  const session = await requireSessionPage();
  let seasons: Array<{ id: string; crop_name: string; farm_name: string; season: string; year: string; acres: number; status: string }> = [];
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT s.id, s.crop_id, c.name_en as crop_name, f.name as farm_name, s.season, s.year, s.acres, s.status
        FROM seasons s
        JOIN farms f ON f.id = s.farm_id
        JOIN crops c ON c.id = s.crop_id
        WHERE s.account_id = $1 AND s.archived_at IS NULL
        ORDER BY s.created_at DESC`,
      [session.accountId]
    );
    seasons = (rows ?? []).map((r) => ({
      id: String(r.id),
      crop_name: String(r.crop_name ?? r.crop_id ?? ""),
      farm_name: String(r.farm_name ?? ""),
      season: String(r.season ?? ""),
      year: String(r.year ?? ""),
      acres: Number(r.acres ?? 0),
      status: String(r.status ?? "active"),
    }));
  } catch (err) {
    console.error("Error fetching seasons:", err);
  }

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Financial cockpit"
        title="Profit / Loss"
        description="Track your season-level costs, revenue, and profitability."
        action={
          <Link
            href="/profit-loss/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md"
          >
            <PlusIcon className="h-4 w-4" />
            New season
          </Link>
        }
      />

      {seasons.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-agro-sprout bg-white p-8 text-center">
          <p className="text-sm text-agro-slate">No seasons yet. Start your first season to track costs and profits.</p>
          <Link href="/profit-loss/new" className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white">
            Start a new season
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2">
          {seasons.map((season) => (
            <li key={season.id}>
              <a
                href={`/profit-loss/${season.id}`}
                className="group flex h-full flex-col rounded-2xl border border-agro-sprout bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-agro-sprout hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy transition-colors duration-200 group-hover:bg-agro-canopy group-hover:text-white">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 21v-8" />
                      <path d="M12 13c-2.4 0-4.2-1.7-4.6-4.3C9.9 9 11.6 10.5 12 13Z" />
                      <path d="M12 13c2.4 0 4.2-1.7 4.6-4.3C14.1 9 12.4 10.5 12 13Z" />
                      <path d="M12 9c-2.4 0-4.2-1.7-4.6-4.3C9.9 5 11.6 6.5 12 9Z" />
                      <path d="M12 9c2.4 0 4.2-1.7 4.6-4.3C14.1 5 12.4 6.5 12 9Z" />
                    </svg>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${season.status === 'active' ? 'bg-agro-mint text-agro-canopy' : season.status === 'harvested' ? 'bg-agro-wheat text-agro-forest' : 'bg-agro-stone text-agro-ink'}`}>
                    {season.status}
                  </span>
                </div>

                <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-agro-ink">
                  {season.crop_name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-agro-slate">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-agro-canopy" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {season.farm_name}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-canopy">
                    {season.season} {season.year}
                  </span>
                  <span className="rounded-full border border-agro-sprout bg-white px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                    {season.acres} acres
                  </span>
                </div>

                <span className="mt-4 inline-flex min-h-11 items-center gap-1 pt-1 text-sm font-semibold text-agro-canopy underline-offset-4 group-hover:underline">
                  View details
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
