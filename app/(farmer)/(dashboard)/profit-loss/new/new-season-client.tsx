"use client";

import { useForm } from "react-hook-form";
import { createSeasonSchema, type CreateSeasonInput } from "@/lib/validation/profit-loss";
import { SEASONS, YEAR_OPTIONS } from "@/lib/farms/constants";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/shell/page-header";

type Props = {
  farms: Array<{ id: string; name: string }>;
  crops: Array<{ id: string; name_en: string }>;
};

export default function NewSeasonClient({ farms, crops }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateSeasonInput>({
    resolver: async (data) => {
      const result = createSeasonSchema.safeParse(data);
      if (result.success) return { values: result.data, errors: {} };
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { values: {}, errors: fieldErrors };
    },
  });

  const onSubmit = async (data: CreateSeasonInput) => {
    const res = await fetch("/api/profit-loss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const season = await res.json();
      router.push(`/profit-loss/${season.id}`);
    } else {
      const err = await res.json();
      alert(err.error?.message ?? "Failed to create season");
    }
  };

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Financial cockpit"
        title="New season"
        description="Set up a new farming season to track costs and profits."
      />
      <div className="mt-8 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Farm</label>
            <select {...register("farm_id")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30">
              <option value="">Select a farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
            {errors.farm_id && <p className="mt-1 text-xs text-agro-error">{String(errors.farm_id.message)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Crop</label>
            <select {...register("crop_id")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30">
              <option value="">Select a crop</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.name_en}</option>
              ))}
            </select>
            {errors.crop_id && <p className="mt-1 text-xs text-agro-error">{String(errors.crop_id.message)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Season</label>
            <select {...register("season")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30">
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.season && <p className="mt-1 text-xs text-agro-error">{String(errors.season.message)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Year</label>
            <select {...register("year")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30">
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {errors.year && <p className="mt-1 text-xs text-agro-error">{String(errors.year.message)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-agro-slate">Acres</label>
            <input type="number" step="0.01" {...register("acres")} className="mt-1 block w-full rounded-lg border border-agro-sprout bg-white px-3 py-2 text-sm text-agro-ink focus:border-agro-canopy focus:outline-none focus:ring-2 focus:ring-agro-canopy/30" />
            {errors.acres && <p className="mt-1 text-xs text-agro-error">{String(errors.acres.message)}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md disabled:opacity-50">
              Create season
            </button>
            <Link href="/profit-loss" className="inline-flex h-11 items-center justify-center rounded-lg border border-agro-sprout px-4 text-sm font-semibold text-agro-ink transition-colors hover:bg-agro-mint">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
