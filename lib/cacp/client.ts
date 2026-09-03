const CACP_API_URL = process.env.CACP_API_URL ?? null;

const FALLBACK_PROJECTIONS: Record<string, Record<string, number>> = {
  wheat: { seed: 1200, fertilizer: 3500, labor: 4500, irrigation: 1800, transport: 800 },
  cotton: { seed: 2500, fertilizer: 6000, labor: 5500, irrigation: 3500, transport: 1500 },
  sugarcane: { seed: 3500, fertilizer: 8000, labor: 7000, irrigation: 4000, transport: 2000 },
  maize: { seed: 1000, fertilizer: 3000, labor: 3500, irrigation: 1500, transport: 700 },
  rice: { seed: 1500, fertilizer: 4500, labor: 5000, irrigation: 2500, transport: 1200 },
};

export type ProjectedCostRow = {
  category: 'seed' | 'fertilizer' | 'labor' | 'irrigation' | 'transport';
  per_acre_cost_pkr: number;
  total_projected_pkr: number;
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCACPProjections(cropId: string, acres: number): Promise<ProjectedCostRow[] | null> {
  if (!CACP_API_URL) return buildFallback(cropId, acres);

  try {
    const url = `${CACP_API_URL}?crop=${encodeURIComponent(cropId)}`;
    const response = await fetchWithTimeout(url, 5000);
    if (!response.ok) return buildFallback(cropId, acres);
    const data = (await response.json()) as Record<string, unknown>;
    const costs = data.costs as Record<string, number> | undefined;
    if (!costs) return buildFallback(cropId, acres);

    const categories = ['seed', 'fertilizer', 'labor', 'irrigation', 'transport'] as const;
    return categories.map((category) => ({
      category,
      per_acre_cost_pkr: costs[category] ?? 0,
      total_projected_pkr: Math.round((costs[category] ?? 0) * acres * 100) / 100,
    }));
  } catch {
    return buildFallback(cropId, acres);
  }
}

function buildFallback(cropId: string, acres: number): ProjectedCostRow[] | null {
  const cropData = FALLBACK_PROJECTIONS[cropId];
  if (!cropData) return null;

  const categories = ['seed', 'fertilizer', 'labor', 'irrigation', 'transport'] as const;
  return categories.map((category) => ({
    category,
    per_acre_cost_pkr: cropData[category],
    total_projected_pkr: Math.round(cropData[category] * acres * 100) / 100,
  }));
}
