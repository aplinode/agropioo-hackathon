"use client";

import { useForm } from "react-hook-form";
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/validation/profit-loss";

const EXPENSE_CATEGORIES = [
  { value: "seed", label: "Seed" },
  { value: "fertilizer", label: "Fertilizer" },
  { value: "labor", label: "Labor" },
  { value: "irrigation", label: "Irrigation" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
] as const;

type Props = {
  seasonId: string;
  onCreated?: () => void;
};

export default function ExpenseForm({ seasonId, onCreated }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateExpenseInput>({
    resolver: async (data) => {
      const result = createExpenseSchema.safeParse({ ...data, season_id: seasonId });
      if (result.success) return { values: result.data, errors: {} };
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { values: {}, errors: fieldErrors };
    },
  });

  const onSubmit = async (data: CreateExpenseInput) => {
    const res = await fetch(`/api/profit-loss/${seasonId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      reset();
      onCreated?.();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Category</label>
        <select {...register("category")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-agro-error">{String(errors.category.message)}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Amount (PKR)</label>
        <input type="number" step="0.01" {...register("amount")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30" />
        {errors.amount && <p className="mt-1 text-xs text-agro-error">{String(errors.amount.message)}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Date</label>
        <input type="date" {...register("date")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30" />
        {errors.date && <p className="mt-1 text-xs text-agro-error">{String(errors.date.message)}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Note (optional)</label>
        <input type="text" {...register("note")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30" />
      </div>
      <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md disabled:opacity-50">
        Add expense
      </button>
    </form>
  );
}
