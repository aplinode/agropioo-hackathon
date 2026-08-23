import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import PageHeader from "@/components/shell/page-header";
import {
  demoSchemes,
  schemeTypeLabel,
} from "./demo-data";

export const metadata: Metadata = {
  title: "Schemes — Agropioo",
};

const filters = ["all", "subsidy", "loan", "equipment"] as const;
type Filter = (typeof filters)[number];

/* Government scheme matcher: filter by what you need via query param,
   read the benefits, and apply through your local office. */
export default async function SchemesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requested = typeof params.type === "string" ? params.type : "all";
  const active: Filter = filters.includes(requested as Filter)
    ? (requested as Filter)
    : "all";
  const visible =
    active === "all" ? demoSchemes : demoSchemes.filter((s) => s.type === active);

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Government schemes"
        title="Support you may qualify for"
        description="Subsidies, loans, and equipment programmes matched to small farmers — explained in plain words."
      />

      {/* Type filter */}
      <nav aria-label="Filter schemes by type" className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <Link
              key={filter}
              href={filter === "all" ? "/schemes" : `/schemes?type=${filter}`}
              aria-current={isActive ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold capitalize transition-colors ${
                isActive
                  ? "bg-agro-canopy text-white"
                  : "border border-agro-sprout bg-white text-agro-slate hover:border-agro-canopy hover:text-agro-canopy"
              }`}
            >
              {filter === "all" ? "All" : schemeTypeLabel[filter]}
            </Link>
          );
        })}
      </nav>

      {/* Scheme cards */}
      <ul className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {visible.map((scheme) => (
          <li
            key={scheme.id}
            className="flex h-full flex-col rounded-2xl border border-agro-clay bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-canopy">
                  {scheme.department}
                </p>
                <h2 className="display-heading mt-1.5 font-display text-xl font-bold leading-snug text-agro-forest">
                  {scheme.title}
                </h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-agro-mint px-2.5 py-1 text-[0.7rem] font-semibold text-agro-canopy">
                <span className="h-1.5 w-1.5 rounded-full bg-agro-success" aria-hidden="true" />
                Open
              </span>
            </div>

            <span className="mt-2 w-fit rounded-full bg-agro-stone px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
              {schemeTypeLabel[scheme.type]}
            </span>

            <ul className="mt-4 space-y-2">
              {scheme.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <CheckIcon
                    size={15}
                    className="mt-0.5 shrink-0 text-agro-canopy"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-relaxed text-agro-ink">{benefit}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-cloud">
        Demo build · verify details at your agriculture office before acting
      </p>
    </div>
  );
}
