"use client";

import { useForm } from "react-hook-form";
import { type UpdateSeasonInput } from "@/lib/validation/profit-loss";
import { useState } from "react";
import type { PLSummary } from "@/lib/calculations/profit-loss";
import PLSummaryComponent from "@/components/profit-loss/pl-summary";
import BreakEvenDisplay from "@/components/profit-loss/break-even-display";
import ExpenseList from "@/components/profit-loss/expense-list";
import ExpenseForm from "@/components/profit-loss/expense-form";
import ExpenseTimeSeries from "@/components/profit-loss/charts/expense-time-series";
import ExpenseBreakdown from "@/components/profit-loss/charts/expense-breakdown";
import BreakEvenBar from "@/components/profit-loss/charts/break-even-bar";
import { ArrowLeftIcon, TrashIcon, ArchiveIcon, RestoreIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SeasonDetail = {
  id: string;
  crop_id: string;
  crop_name?: string;
  season: string;
  year: string;
  acres: number;
  status: string;
  expected_yield: number | null;
  expected_price: number | null;
  actual_yield: number | null;
  actual_price: number | null;
  archived_at: string | null;
  farm_name?: string;
  expenses: Array<Record<string, unknown>>;
  projected_costs: Array<Record<string, unknown>>;
  pl: PLSummary;
  break_even: { yield: string; price: string } | null;
  crop_unit: string;
};

export default function SeasonDetailClient({ season }: { season: SeasonDetail }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  const totalProjectedCost = season.projected_costs.reduce((sum, p) => sum + Number(p.total_projected_pkr), 0);
  const totalActualCost = season.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const projectedRevenue = season.expected_yield && season.expected_price ? Number(season.expected_yield) * Number(season.expected_price) : 0;
  const actualRevenue = season.actual_yield && season.actual_price ? Number(season.actual_yield) * Number(season.actual_price) : 0;

  const yieldForm = useForm<UpdateSeasonInput>({
    defaultValues: {
      expected_yield: season.expected_yield ?? undefined,
      expected_price: season.expected_price ?? undefined,
    },
  });

  const handleArchive = async () => {
    if (!confirm("Archive this season? It will be hidden from your list but all data will be preserved.")) return;
    setRefreshing(true);
    const res = await fetch(`/api/profit-loss/${season.id}/archive`, { method: "POST" });
    setRefreshing(false);
    if (res.ok) onRefresh();
  };

  const handleRestore = async () => {
    if (!confirm("Restore this season? It will return to your active list.")) return;
    setRefreshing(true);
    const res = await fetch(`/api/profit-loss/${season.id}/restore`, { method: "POST" });
    setRefreshing(false);
    if (res.ok) onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this season? This cannot be undone.")) return;
    setRefreshing(true);
    const res = await fetch(`/api/profit-loss/${season.id}`, { method: "DELETE" });
    setRefreshing(false);
    if (res.ok) router.push("/profit-loss");
    else {
      const err = await res.json();
      setError(err.error?.message ?? "Failed to delete");
    }
  };

  const handleHarvest = async (data: UpdateSeasonInput) => {
    setRefreshing(true);
    const res = await fetch(`/api/profit-loss/${season.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "completed" }),
    });
    setRefreshing(false);
    if (res.ok) onRefresh();
    else {
      const err = await res.json();
      setError(err.error?.message ?? "Failed to update");
    }
  };

  const handleExpenseCreated = () => {
    onRefresh();
  };

  const expenseRows = season.expenses.map((e) => ({
    date: e.date as string,
    amount: Number(e.amount),
  }));
  const projectedRows = season.projected_costs.map((p) => ({
    date: new Date().toISOString().slice(0, 7),
    amount: Number(p.total_projected_pkr),
  }));

  return (
    <div className="space-y-6 pt-1">
      <div className="flex items-center gap-3">
        <Link href="/profit-loss" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-agro-sprout text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy">
          <ArrowLeftIcon size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-agro-forest">{season.crop_name ?? season.crop_id}</h1>
          <p className="text-sm text-agro-slate">{season.farm_name} · {season.season} {season.year} · {season.acres} acres</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          {season.archived_at ? (
            <button onClick={handleRestore} disabled={refreshing} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-agro-sprout px-3 text-xs font-semibold text-agro-ink transition-colors hover:bg-agro-mint hover:text-agro-canopy disabled:opacity-50">
              <RestoreIcon size={14} /> Restore
            </button>
          ) : (
            <>
              <button onClick={handleArchive} disabled={refreshing} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-agro-sprout px-3 text-xs font-semibold text-agro-ink transition-colors hover:bg-agro-mint hover:text-agro-canopy disabled:opacity-50">
                <ArchiveIcon size={14} /> Archive
              </button>
              <button onClick={handleDelete} disabled={refreshing} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-agro-canopy/30 px-3 text-xs font-semibold text-agro-canopy transition-colors hover:bg-agro-mint disabled:opacity-50">
                <TrashIcon size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-agro-canopy/30 bg-agro-mint p-3 text-sm text-agro-forest">{error}</div>}

      <section className="grid gap-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 rounded-full bg-agro-canopy" />
          <h2 className="font-display text-lg font-semibold text-agro-forest">P&L Summary</h2>
        </div>
        <div className="rounded-2xl border border-agro-sprout bg-white p-1">
          <PLSummaryComponent
            data={{
              totalProjectedCost,
              totalActualCost,
              projectedRevenue,
              actualRevenue,
              netProfitLoss: season.pl.netProfitLoss,
              roi: season.pl.roi,
              variance: season.pl.variance,
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-agro-sprout bg-white p-5">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 rounded-full bg-agro-canopy" />
            <h2 className="font-display text-lg font-semibold text-agro-forest">Break-even</h2>
          </div>
          <div className="mt-4">
            <BreakEvenDisplay data={season.break_even} />
          </div>
          <div className="mt-3">
            <BreakEvenBar currentYield={season.expected_yield ?? null} breakEvenYield={season.break_even?.yield ?? null} cropUnit={season.crop_unit} />
          </div>
        </div>
        <div className="rounded-2xl border border-agro-sprout bg-white p-5">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 rounded-full bg-agro-canopy" />
            <h2 className="font-display text-lg font-semibold text-agro-forest">Expense breakdown</h2>
          </div>
          <ExpenseBreakdown expenses={season.expenses.map((e) => ({ category: e.category as string, amount: Number(e.amount) }))} />
        </div>
      </section>

      <section className="rounded-2xl border border-agro-sprout bg-white p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 rounded-full bg-agro-canopy" />
          <h2 className="font-display text-lg font-semibold text-agro-forest">Monthly trend</h2>
        </div>
        <ExpenseTimeSeries expenses={expenseRows} projectedCosts={projectedRows} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-agro-sprout bg-agro-paper p-5">
          <h2 className="font-display text-lg font-semibold text-agro-forest">Log expense</h2>
          <div className="mt-4">
            <ExpenseForm seasonId={season.id} onCreated={handleExpenseCreated} />
          </div>
        </div>
        <div className="rounded-2xl border border-agro-sprout bg-agro-paper p-5">
          <h2 className="font-display text-lg font-semibold text-agro-forest">Yield & price</h2>
          <form onSubmit={yieldForm.handleSubmit((data) => handleHarvest(data))} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-agro-ink">Expected yield (per acre)</label>
              <input type="number" step="0.01" {...yieldForm.register("expected_yield")} className="focus-ring-none mt-2 h-12 w-full rounded-xl border border-agro-sprout bg-white px-4 text-sm text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-agro-canopy focus:ring-agro-canopy/20" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-agro-ink">Expected price (PKR per unit)</label>
              <input type="number" step="0.01" {...yieldForm.register("expected_price")} className="focus-ring-none mt-2 h-12 w-full rounded-xl border border-agro-sprout bg-white px-4 text-sm text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-agro-canopy focus:ring-agro-canopy/20" />
            </div>
            <button type="submit" disabled={refreshing} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md disabled:opacity-50">
              Save yield / price
            </button>
          </form>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-agro-ink">Mark harvested</h3>
            <HarvestForm seasonId={season.id} onDone={() => onRefresh()} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-agro-sprout bg-agro-paper p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 rounded-full bg-agro-canopy" />
          <h2 className="font-display text-lg font-semibold text-agro-forest">Expenses</h2>
        </div>
        <div className="mt-4">
          <ExpenseList expenses={season.expenses.map((e) => ({
            id: String(e.id),
            season_id: String(e.season_id),
            account_id: String(e.account_id),
            category: String(e.category),
            amount: Number(e.amount),
            date: String(e.date),
            note: e.note as string | null,
            created_at: String(e.created_at),
            variance: e.variance as number | undefined,
            variance_percentage: e.variance_percentage as number | null | undefined,
          }))} />
        </div>
      </section>
    </div>
  );
}

function HarvestForm({ seasonId, onDone }: { seasonId: string; onDone: () => void }) {
  const [actualYield, setActualYield] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/profit-loss/${seasonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual_yield: Number(actualYield), actual_price: Number(actualPrice), status: "completed" }),
    });
    setSubmitting(false);
    if (res.ok) onDone();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-3 space-y-3">
      <div>
        <label className="block text-sm font-semibold text-agro-ink">Actual yield (total units)</label>
        <input type="number" step="0.01" value={actualYield} onChange={(e) => setActualYield(e.target.value)} className="focus-ring-none mt-2 h-12 w-full rounded-xl border border-agro-sprout bg-white px-4 text-sm text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-agro-canopy focus:ring-agro-canopy/20" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-agro-ink">Actual selling price (PKR per unit)</label>
        <input type="number" step="0.01" value={actualPrice} onChange={(e) => setActualPrice(e.target.value)} className="focus-ring-none mt-2 h-12 w-full rounded-xl border border-agro-sprout bg-white px-4 text-sm text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-agro-canopy focus:ring-agro-canopy/20" />
      </div>
      <button type="submit" disabled={submitting} className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md disabled:opacity-50">
        Mark harvested
      </button>
    </form>
  );
}
