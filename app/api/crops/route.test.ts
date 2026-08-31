import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/crops/route";
import { GET } from "@/app/api/crops/route";

const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
const mockRequireSessionApi = vi.fn();
const mockHitLimiter = vi.fn();
const mockRecommendCrops = vi.fn();

vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireSessionApi: (...args: unknown[]) => mockRequireSessionApi(...args),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  hitLimiter: (...args: unknown[]) => mockHitLimiter(...args),
  RATE_RULES: { cropsIp: { limit: 20, windowMs: 3600000 } },
}));

vi.mock("@/lib/crops/engine", () => ({
  recommendCrops: (...args: unknown[]) => mockRecommendCrops(...args),
  WeatherUnavailableError: class WeatherUnavailableError extends Error {},
}));

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/crops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/crops", () => {
  beforeEach(() => {
    mockRequireSessionApi.mockReset();
    mockHitLimiter.mockReset();
    mockRecommendCrops.mockReset();
    mockQueryOne.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireSessionApi.mockResolvedValue(null);
    const res = await POST(createRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockHitLimiter.mockReturnValue(false);
    const res = await POST(createRequest({}));
    expect(res.status).toBe(429);
  });

  it("returns 201 with recommendations on valid input", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockHitLimiter.mockReturnValue(true);
    mockRecommendCrops.mockResolvedValue({
      request: { id: "req-1", farmId: "farm-1", targetSeason: "winter", targetYear: 2026, createdAt: new Date().toISOString() },
      recommendations: [
        {
          id: "rec-1",
          rank: 1,
          crop: { id: "wheat", nameEn: "Wheat", category: "staple", typicalYieldPerAcreKg: 1200, growingDurationDays: 120, waterRequirementLevel: "medium", labourCostLevel: "medium", capitalRequirementPerAcrePkr: 50000, marketRiskBaseline: "low" },
          expectedRevenuePerAcrePkr: 150000,
          revenueConfidence: "high",
          reasonKey: "reason.suitability",
          riskFactors: [],
          waterRequirementLevel: "medium",
          scores: { suitability: 0.9, weatherFit: 0.8, profitability: 0.9, risk: 0.1, sustainability: 0.8, final: 0.85 },
          dataSourcesUsed: ["weather", "market"],
          dataFreshnessSeconds: 300,
        },
      ],
    });

    const res = await POST(
      createRequest({
        farm_id: "00000000-0000-0000-0000-000000000000",
        target_season: "winter",
        target_year: 2026,
        soil_type: "loamy",
        irrigation_type: "canal",
        budget_bracket: "medium",
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.recommendations).toHaveLength(1);
    expect(data.recommendations[0].crop.nameEn).toBe("Wheat");
  });

  it("returns 503 when WeatherUnavailableError is thrown", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockHitLimiter.mockReturnValue(true);
    mockRecommendCrops.mockRejectedValue(new Error("service_unavailable") as never);

    const res = await POST(
      createRequest({
        farm_id: "00000000-0000-0000-0000-000000000000",
        target_season: "winter",
        target_year: 2026,
        soil_type: "loamy",
        irrigation_type: "canal",
        budget_bracket: "medium",
      })
    );

    expect(res.status).toBe(500);
  });
});

describe("GET /api/crops", () => {
  beforeEach(() => {
    mockRequireSessionApi.mockReset();
    mockQueryOne.mockReset();
    mockQuery.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireSessionApi.mockResolvedValue(null);
    const request = new Request("http://localhost/api/crops");
    const res = await GET(request);
    expect(res.status).toBe(401);
  });

  it("returns paginated requests for the account", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockQueryOne.mockResolvedValue({ account_id: "acct-1" });
    mockQuery.mockResolvedValue([
      { id: "req-1", farm_id: "farm-1", target_season: "winter", target_year: 2026, created_at: "2026-08-30T00:00:00Z" },
    ]);
    mockQueryOne
      .mockResolvedValueOnce({ account_id: "acct-1" })
      .mockResolvedValueOnce({ count: "1" });

    const request = new Request("http://localhost/api/crops?farm_id=00000000-0000-0000-0000-000000000000&limit=10");
    const res = await GET(request);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.requests).toHaveLength(1);
    expect(data.requests[0].id).toBe("req-1");
  });

  it("returns 403 for cross-account farm access", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockQueryOne.mockResolvedValue({ account_id: "acct-other" });

    const request = new Request("http://localhost/api/crops?farm_id=00000000-0000-0000-0000-000000000000");
    const res = await GET(request);
    expect(res.status).toBe(403);
  });
});
