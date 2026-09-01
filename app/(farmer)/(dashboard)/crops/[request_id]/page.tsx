import type { Metadata } from "next";
import { getCropsBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { query, queryOne } from "@/lib/db";
import CropsClient from "../crops-client";

interface PageProps {
  params: Promise<{ request_id: string }>;
}

export const metadata: Metadata = {
  title: "Recommendation detail — Agropioo",
};

export default async function CropRecommendationDetailPage({ params }: PageProps) {
  const session = await requireSessionPage();
  const bundle = await getCropsBundle();
  const { request_id } = await params;

  let request: Record<string, unknown> | null = null;
  let recommendations: Array<Record<string, unknown>> = [];
  try {
    const requestRow = await queryOne<Record<string, unknown>>(
      `SELECT * FROM crop_recommendation_requests WHERE id = $1 AND account_id = $2`,
      [request_id, session.accountId]
    );
    if (requestRow) {
      request = requestRow;
      const recs = await query<Record<string, unknown>>(
        `SELECT * FROM crop_recommendations WHERE request_id = $1 ORDER BY rank ASC`,
        [request_id]
      );
      recommendations = recs;
    }
  } catch {
    // best-effort render; client shows not-found state
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-agro-sprout bg-white p-8 text-center">
        <p className="text-sm text-agro-slate">{bundle.errors.notFound}</p>
      </div>
    );
  }

  const mappedRecommendations = recommendations.map((rec) => ({
    id: rec.id as string,
    rank: rec.rank as number,
    crop: {
      id: rec.crop_id as string,
      nameEn: rec.crop_name_en as string,
      category: rec.crop_category as string,
      typicalYieldPerAcreKg: rec.typical_yield_per_acre_kg as number,
      growingDurationDays: rec.growing_duration_days as number,
      waterRequirementLevel: rec.water_requirement_level as string,
      labourCostLevel: rec.labour_cost_level as string,
      capitalRequirementPerAcrePkr: rec.capital_requirement_per_acre_pkr as number,
      marketRiskBaseline: rec.market_risk_baseline as string,
    },
    expectedRevenuePerAcrePkr: rec.expected_revenue_per_acre_pkr as number,
    revenueConfidence: rec.revenue_confidence as string,
    reasonKey: rec.reason_key as string,
    riskFactors: (rec.risk_factors as string[]) ?? [],
    waterRequirementLevel: rec.water_requirement_level as string,
    scores: rec.scores as {
      suitability: number;
      weatherFit: number;
      profitability: number;
      risk: number;
      sustainability: number;
      final: number;
    },
    dataSourcesUsed: (rec.data_sources_used as string[]) ?? [],
    dataFreshnessSeconds: rec.data_freshness_seconds as number,
  }));

  return (
    <div className="space-y-6 pt-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => history.back()}
          className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline"
        >
          ← {bundle.detail.back}
        </button>
      </div>

      <div className="rounded-2xl border border-agro-sprout bg-white p-5 sm:p-6">
        <h1 className="font-display text-2xl font-bold text-agro-forest sm:text-3xl">{bundle.detail.title}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-agro-slate">Season</p>
            <p className="mt-1 text-sm font-medium text-agro-ink">{String(request.target_season)}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-agro-slate">Year</p>
            <p className="mt-1 text-sm font-medium text-agro-ink">{String(request.target_year)}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-agro-slate">Soil</p>
            <p className="mt-1 text-sm font-medium text-agro-ink">{String(request.soil_type)}</p>
          </div>
        </div>
      </div>

      <CropsClient
        bundle={bundle}
        farms={[]}
        initialRecommendations={mappedRecommendations}
      />
    </div>
  );
}
