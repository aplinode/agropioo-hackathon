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

const inputClass = (err?: string) =>
  `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
    err
      ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
      : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
  }`;

function getMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return undefined;
}

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-agro-ink">Category</label>
        <select {...register("category")} className={inputClass(getMessage(errors.category))}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1.5 text-sm font-medium text-agro-forest">{String(getMessage(errors.category))}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-agro-ink">Amount (PKR)</label>
        <input type="number" step="0.01" {...register("amount")} className={inputClass(getMessage(errors.amount))} />
        {errors.amount && <p className="mt-1.5 text-sm font-medium text-agro-forest">{String(getMessage(errors.amount))}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-agro-ink">Date</label>
        <input type="date" {...register("date")} className={inputClass(getMessage(errors.date))} />
        {errors.date && <p className="mt-1.5 text-sm font-medium text-agro-forest">{String(getMessage(errors.date))}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-agro-ink">Note (optional)</label>
        <input type="text" {...register("note")} className={inputClass(getMessage(errors.note))} />
      </div>
      <button type="submit" disabled={isSubmitting} className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md disabled:opacity-50">
        Add expense
      </button>
    </form>
  );
}
