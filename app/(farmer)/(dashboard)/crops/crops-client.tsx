"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  DocumentIcon,
  CompassIcon,
  AlertTriangleIcon,
  XIcon,
  SproutIcon,
  CheckIcon,
} from "@/components/icons";
import type { CropsBundle } from "./crops-bundle";

const formSchema = z.object({
  farmId: z.string().uuid().optional().nullable(),
  targetSeason: z.enum(["summer", "winter", "autumn", "spring", "rainy", "windy"]),
  targetYear: z.number().int().min(new Date().getFullYear()).max(2035),
  soilType: z.enum([
    "sandy",
    "sandy_loam",
    "loamy",
    "clay_loam",
    "clay",
    "silty",
    "saline",
    "rocky",
    "other",
  ]),
  irrigationType: z.enum(["rainfed", "canal", "tubewell", "mixed"]),
  budgetBracket: z.enum(["low", "medium", "high", "very_high"]),
});

type FormValues = z.infer<typeof formSchema>;

type CropRecommendation = {
  id: string;
  rank: number;
  crop: {
    id: string;
    nameEn: string;
    category: string;
    typicalYieldPerAcreKg: number;
    growingDurationDays: number;
    waterRequirementLevel: string;
    labourCostLevel: string;
    capitalRequirementPerAcrePkr: number;
    marketRiskBaseline: string;
  };
  expectedRevenuePerAcrePkr: number;
  revenueConfidence: string;
  reasonKey: string;
  riskFactors: string[];
  waterRequirementLevel: string;
  scores: {
    suitability: number;
    weatherFit: number;
    profitability: number;
    risk: number;
    sustainability: number;
    final: number;
  };
  dataSourcesUsed: string[];
  dataFreshnessSeconds: number;
};

type CropRecommendationRequest = {
  id: string;
  farmId: string;
  targetSeason: string;
  targetYear: number;
  createdAt: string;
};

type RotationSuggestion = {
  sequencePosition: number;
  targetSeason: string;
  targetYear: number;
  crop: { nameEn: string };
  reasonKey: string;
  isGeneric: boolean;
};

type FarmPlanEntry = {
  id: string;
  recommendationId: string;
  targetSeason: string;
  targetYear: number;
  rotationSuggestions: RotationSuggestion[];
};

const riskLabelMap: Record<string, string> = {
  price_volatility: "Price volatility",
  pest_pressure: "Pest pressure",
  weather: "Weather risk",
  water_stress: "Water stress",
  input_cost: "Input cost",
};

function resolveReason(bundle: CropsBundle, reasonKey: string, cropName: string, soilLabel: string, seasonLabel: string): string {
  const template = bundle.reason[reasonKey as keyof typeof bundle.reason] ?? bundle.reason.generic;
  return template
    .replace("{crop}", cropName)
    .replace("{soil}", soilLabel)
    .replace("{season}", seasonLabel);
}

function SeasonSelect({ bundle, value, onChange }: { bundle: CropsBundle; value: string; onChange: (v: "summer" | "winter" | "autumn" | "spring" | "rainy" | "windy") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-agro-sprout bg-white px-3 text-sm text-agro-ink"
      >
        <span>{bundle.seasons[value as keyof typeof bundle.seasons] ?? bundle.form.seasonLabel}</span>
        <ChevronDownIcon className="h-4 w-4 text-agro-slate" />
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-agro-sprout bg-white shadow-sm">
          {(["summer", "winter", "autumn", "spring", "rainy", "windy"] as const).map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-agro-mint"
              >
                {bundle.seasons[opt]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SoilSelect({ bundle, value, onChange }: { bundle: CropsBundle; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const soilKeys = ["sandy", "sandy_loam", "loamy", "clay_loam", "clay", "silty", "saline", "rocky", "other"] as const;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-agro-sprout bg-white px-3 text-sm text-agro-ink"
      >
        <span>{bundle.soil[value as keyof typeof bundle.soil] ?? bundle.form.soilLabel}</span>
        <ChevronDownIcon className="h-4 w-4 text-agro-slate" />
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-agro-sprout bg-white shadow-sm">
          {soilKeys.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-agro-mint"
              >
                {bundle.soil[opt]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IrrigationSelect({ bundle, value, onChange }: { bundle: CropsBundle; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const irrigationKeys = ["rainfed", "canal", "tubewell", "mixed"] as const;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-agro-sprout bg-white px-3 text-sm text-agro-ink"
      >
        <span>{bundle.irrigation[value as keyof typeof bundle.irrigation] ?? bundle.form.irrigationLabel}</span>
        <ChevronDownIcon className="h-4 w-4 text-agro-slate" />
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-agro-sprout bg-white shadow-sm">
          {irrigationKeys.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-agro-mint"
              >
                {bundle.irrigation[opt]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BudgetSelect({ bundle, value, onChange }: { bundle: CropsBundle; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const budgetKeys = ["low", "medium", "high", "very_high"] as const;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-agro-sprout bg-white px-3 text-sm text-agro-ink"
      >
        <span>{bundle.budget[value as keyof typeof bundle.budget] ?? bundle.form.budgetLabel}</span>
        <ChevronDownIcon className="h-4 w-4 text-agro-slate" />
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-agro-sprout bg-white shadow-sm">
          {budgetKeys.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-agro-mint"
              >
                {bundle.budget[opt]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  bundle,
  onCompare,
  onSave,
  savingId,
}: {
  recommendation: CropRecommendation;
  bundle: CropsBundle;
  onCompare: () => void;
  onSave: () => void;
  savingId: string | null;
}) {
  const soilLabel = recommendation.crop.id;
  const reason = resolveReason(bundle, recommendation.reasonKey, recommendation.crop.nameEn, soilLabel, "");

  return (
    <div className="rounded-2xl border border-agro-sprout bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wide text-agro-canopy">
            {bundle.results.rank.replace("{n}", String(recommendation.rank))}
          </span>
          <h3 className="mt-1 font-display text-lg font-bold text-agro-forest">{recommendation.crop.nameEn}</h3>
        </div>
        <span className="rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-canopy">
          {recommendation.crop.category}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-agro-mint p-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">{bundle.results.revenue}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-agro-forest">
            PKR {recommendation.expectedRevenuePerAcrePkr.toLocaleString()}
          </p>
          <p className="mt-0.5 font-mono text-[0.65rem] text-agro-slate">
            {bundle.confidence[recommendation.revenueConfidence as keyof typeof bundle.confidence] ?? recommendation.revenueConfidence}
          </p>
        </div>
        <div className="rounded-xl bg-agro-mint p-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">Duration</p>
          <p className="mt-1 font-mono text-sm font-semibold text-agro-forest">{recommendation.crop.growingDurationDays} days</p>
        </div>
        <div className="rounded-xl bg-agro-mint p-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">Water</p>
          <p className="mt-1 font-mono text-sm font-semibold text-agro-forest">
            {bundle.water[recommendation.waterRequirementLevel as keyof typeof bundle.water] ?? recommendation.waterRequirementLevel}
          </p>
        </div>
        <div className="rounded-xl bg-agro-mint p-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">Risk</p>
          <p className="mt-1 font-mono text-sm font-semibold text-agro-forest">
            {recommendation.crop.marketRiskBaseline}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-agro-ink">{bundle.results.reason}</p>
        <p className="mt-1 text-sm leading-relaxed text-agro-slate">{reason}</p>
      </div>

      {recommendation.riskFactors.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-agro-slate">{bundle.results.risks}</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {recommendation.riskFactors.map((risk) => (
              <li key={risk} className="rounded-md border border-agro-sprout bg-agro-mint px-2 py-1 font-mono text-[0.7rem] text-agro-slate">
                {riskLabelMap[risk] ?? risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={savingId === recommendation.id}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:opacity-70"
        >
          <CheckIcon className="h-4 w-4" />
          {savingId === recommendation.id ? bundle.results.saved : bundle.results.saveToPlan}
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-agro-sprout bg-white px-4 text-sm font-semibold text-agro-ink transition-colors hover:border-agro-canopy hover:text-agro-canopy"
        >
          <CompassIcon className="h-4 w-4" />
          {bundle.results.compare}
        </button>
      </div>
    </div>
  );
}

function ComparisonView({
  recommendations,
  bundle,
  onClose,
  onSaveSelected,
  savingId,
  selectedId,
  onSelectId,
}: {
  recommendations: CropRecommendation[];
  bundle: CropsBundle;
  onClose: () => void;
  onSaveSelected: () => void;
  savingId: string | null;
  selectedId: string | null;
  onSelectId: (id: string) => void;
}) {

  return (
    <div className="rounded-2xl border border-agro-sprout bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-agro-forest">{bundle.compare.title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-agro-slate transition-colors hover:bg-agro-mint"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-agro-sprout">
              <th className="pb-2 font-mono text-xs uppercase tracking-wide text-agro-slate">{bundle.compare.revenue}</th>
              <th className="pb-2 font-mono text-xs uppercase tracking-wide text-agro-slate">{bundle.compare.duration}</th>
              <th className="pb-2 font-mono text-xs uppercase tracking-wide text-agro-slate">{bundle.compare.water}</th>
              <th className="pb-2 font-mono text-xs uppercase tracking-wide text-agro-slate">{bundle.compare.marketRisk}</th>
              <th className="pb-2 font-mono text-xs uppercase tracking-wide text-agro-slate">{bundle.compare.soilImpact}</th>
              <th className="pb-2 font-mono text-xs uppercase tracking-wide text-agro-slate">{bundle.compare.labour}</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec) => (
              <tr
                key={rec.id}
                className={`border-b border-agro-sprout last:border-0 ${selectedId === rec.id ? "bg-agro-mint/50" : ""}`}
              >
                <td className="py-3 font-mono text-sm font-semibold text-agro-forest">
                  PKR {rec.expectedRevenuePerAcrePkr.toLocaleString()}
                </td>
                <td className="py-3 text-sm text-agro-ink">{rec.crop.growingDurationDays} days</td>
                <td className="py-3 text-sm text-agro-ink">
                  {bundle.water[rec.waterRequirementLevel as keyof typeof bundle.water] ?? rec.waterRequirementLevel}
                </td>
                <td className="py-3 text-sm text-agro-ink">{rec.crop.marketRiskBaseline}</td>
                <td className="py-3 text-sm text-agro-ink">{rec.crop.category}</td>
                <td className="py-3 text-sm text-agro-ink">
                  {bundle.water[rec.crop.labourCostLevel as keyof typeof bundle.water] ?? rec.crop.labourCostLevel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-agro-ink">{bundle.compare.selectToSave}</p>
        <div className="mt-2 flex flex-wrap gap-2">
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => onSelectId(rec.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedId === rec.id
                    ? "border-agro-canopy bg-agro-mint text-agro-canopy"
                    : "border-agro-sprout bg-white text-agro-ink hover:border-agro-canopy"
                }`}
              >
                {rec.crop.nameEn}
              </button>
            ))}
        </div>
        <button
          type="button"
          onClick={onSaveSelected}
          disabled={!selectedId || savingId === selectedId}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-agro-canopy px-4 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:opacity-70"
        >
          <DocumentIcon className="h-4 w-4" />
          {bundle.compare.saveSelected}
        </button>
      </div>
    </div>
  );
}

function RotationPlan({ plan, bundle }: { plan: FarmPlanEntry | null; bundle: CropsBundle }) {
  if (!plan) return null;
  return (
    <div className="mt-6 rounded-2xl border border-agro-sprout bg-white p-5">
      <h3 className="font-display text-lg font-bold text-agro-forest">{bundle.rotation.savedTitle}</h3>
      <ul className="mt-3 space-y-2">
        {plan.rotationSuggestions.map((suggestion) => (
          <li key={suggestion.sequencePosition} className="rounded-xl border border-agro-sprout bg-agro-mint p-3">
            <p className="font-mono text-xs uppercase tracking-wide text-agro-slate">
              {bundle.rotation.nextSeason
                .replace("{season}", bundle.seasons[suggestion.targetSeason as keyof typeof bundle.seasons] ?? suggestion.targetSeason)
                .replace("{year}", String(suggestion.targetYear))}
            </p>
            <p className="mt-1 font-semibold text-agro-ink">{suggestion.crop.nameEn}</p>
            <p className="mt-1 text-sm text-agro-slate">
              {suggestion.isGeneric ? bundle.rotation.generic : bundle.rotationKeys[suggestion.reasonKey as keyof typeof bundle.rotationKeys] ?? suggestion.reasonKey}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CropsClientProps = {
  bundle: CropsBundle;
  farms: Array<{ id: string; name: string; location: string }>;
  initialRecommendations?: CropRecommendation[];
};

export default function CropsClient({ bundle, farms, initialRecommendations = [] }: CropsClientProps) {
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>(initialRecommendations);
  const [existingRequest, setExistingRequest] = useState<CropRecommendationRequest | null>(null);
  const [rotationPlan, setRotationPlan] = useState<FarmPlanEntry | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareSelectedId, setCompareSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noCandidates, setNoCandidates] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      farmId: farms[0]?.id ?? null,
      targetSeason: "winter",
      targetYear: currentYear + 1,
      soilType: "loamy",
      irrigationType: "canal",
      budgetBracket: "medium",
    },
  });

  const watchedSeason = watch("targetSeason");
  const watchedBudget = watch("budgetBracket");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    setNoCandidates(false);
    setExistingRequest(null);
    setRecommendations([]);
    setRotationPlan(null);

    try {
      const res = await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farm_id: values.farmId,
          target_season: values.targetSeason,
          target_year: values.targetYear,
          soil_type: values.soilType,
          irrigation_type: values.irrigationType,
          budget_bracket: values.budgetBracket,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.error?.code === "recommendation_exists") {
          setExistingRequest(data.existing);
          return;
        }
        if (res.status === 503) {
          setError(bundle.errors.serviceUnavailable);
          return;
        }
        setError(data.error?.message ?? bundle.errors.generic);
        return;
      }

      setRecommendations(data.recommendations ?? []);
      if (data.recommendations?.length === 0) setNoCandidates(true);
    } catch {
      setError(bundle.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function loadExisting(requestId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crops/${requestId}`);
      if (!res.ok) {
        setError(bundle.errors.notFound);
        return;
      }
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
      setExistingRequest(null);
      if (data.recommendations?.length === 0) setNoCandidates(true);
    } catch {
      setError(bundle.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function saveRecommendation(recommendationId: string) {
    setSavingId(recommendationId);
    setError(null);
    try {
      const res = await fetch("/api/crops/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation_id: recommendationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? bundle.errors.generic);
        return;
      }
      setRotationPlan(data.plan);
    } catch {
      setError(bundle.errors.generic);
    } finally {
      setSavingId(null);
    }
  }

  async function saveSelectedFromComparison() {
    const selected = recommendations.find((r) => r.id === compareSelectedId);
    if (!selected) return;
    await saveRecommendation(selected.id);
    setShowCompare(false);
    setCompareSelectedId(null);
  }

  return (
    <div className="space-y-8 pt-1">
      <div>
        <h1 className="display-heading font-display text-2xl font-bold text-agro-forest sm:text-3xl">{bundle.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-agro-slate">{bundle.description}</p>
      </div>

      {farms.length === 0 ? (
        <div className="rounded-2xl border border-agro-sprout bg-white p-6 text-center">
          <p className="text-sm text-agro-slate">{bundle.form.noFarm}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-agro-sprout bg-white p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-agro-ink">{bundle.form.farmLabel}</label>
              <select
                {...register("farmId")}
                className="mt-1 h-11 w-full rounded-lg border border-agro-sprout bg-white px-3 text-sm text-agro-ink"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-agro-ink">{bundle.form.seasonLabel}</label>
              <input type="hidden" {...register("targetSeason")} value={watchedSeason} />
              <div className="mt-1">
                <SeasonSelect bundle={bundle} value={watchedSeason} onChange={(v) => setValue("targetSeason", v as FormValues["targetSeason"])} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-agro-ink">{bundle.form.yearLabel}</label>
              <select
                {...register("targetYear", { valueAsNumber: true })}
                className="mt-1 h-11 w-full rounded-lg border border-agro-sprout bg-white px-3 text-sm text-agro-ink"
              >
                {Array.from({ length: 2035 - currentYear + 1 }, (_, i) => currentYear + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-agro-ink">{bundle.form.soilLabel}</label>
              <input type="hidden" {...register("soilType")} value={watch("soilType")} />
              <div className="mt-1">
                <SoilSelect bundle={bundle} value={watch("soilType")} onChange={(v) => setValue("soilType", v as FormValues["soilType"])} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-agro-ink">{bundle.form.irrigationLabel}</label>
              <input type="hidden" {...register("irrigationType")} value={watch("irrigationType")} />
              <div className="mt-1">
                <IrrigationSelect bundle={bundle} value={watch("irrigationType")} onChange={(v) => setValue("irrigationType", v as FormValues["irrigationType"])} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-agro-ink">{bundle.form.budgetLabel}</label>
              <input type="hidden" {...register("budgetBracket")} value={watchedBudget} />
              <div className="mt-1">
                <BudgetSelect bundle={bundle} value={watchedBudget} onChange={(v) => setValue("budgetBracket", v as FormValues["budgetBracket"])} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:opacity-70"
            >
              <SproutIcon className="h-4 w-4" />
              {loading ? bundle.form.submitting : bundle.form.submit}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-agro-sprout bg-agro-mint p-4 text-sm text-agro-ink">
          <AlertTriangleIcon className="h-5 w-5 shrink-0 text-agro-canopy" />
          <span>{error}</span>
        </div>
      )}

      {existingRequest && (
        <div className="rounded-2xl border border-agro-sprout bg-white p-5">
          <p className="text-sm text-agro-ink">{bundle.results.alreadyExists}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => loadExisting(existingRequest.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-agro-sprout bg-white px-4 text-sm font-semibold text-agro-ink hover:border-agro-canopy hover:text-agro-canopy"
            >
              {bundle.results.viewExisting}
            </button>
          </div>
        </div>
      )}

      {noCandidates && !error && (
        <div className="rounded-2xl border border-agro-sprout bg-white p-5 text-sm text-agro-ink">
          {bundle.results.noCandidates}
        </div>
      )}

      {recommendations.length > 0 && !showCompare && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-agro-forest">{bundle.results.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                bundle={bundle}
                onCompare={() => setShowCompare(true)}
                onSave={() => saveRecommendation(rec.id)}
                savingId={savingId}
              />
            ))}
          </div>
          <RotationPlan plan={rotationPlan} bundle={bundle} />
        </div>
      )}

      {showCompare && (
        <ComparisonView
          recommendations={recommendations}
          bundle={bundle}
          onClose={() => { setShowCompare(false); setCompareSelectedId(null); }}
          onSaveSelected={saveSelectedFromComparison}
          savingId={savingId}
          selectedId={compareSelectedId}
          onSelectId={setCompareSelectedId}
        />
      )}
    </div>
  );
}
