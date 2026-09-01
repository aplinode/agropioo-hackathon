import { describe, expect, it, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockWithTransaction = vi.fn();
const mockEvaluateAndDispatchAlerts = vi.fn();

vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  withTransaction: (...args: unknown[]) => mockWithTransaction(...args),
}));

vi.mock("@/lib/prices/alerts", () => ({
  evaluateAndDispatchAlerts: (...args: unknown[]) =>
    mockEvaluateAndDispatchAlerts(...args),
}));

const { POST } = await import("@/app/api/prices/ingest/route");
const { __resetRateLimitBucketsForTests } = await import("@/lib/http");

function makeBearer(): string {
  return `Bearer ${process.env.PRICES_CRON_SECRET}`;
}

function makeBody(rows: unknown[]): string {
  return JSON.stringify({
    source_code: "amis_pk",
    scraped_at: new Date().toISOString(),
    rows,
  });
}

function buildRow(overrides: Record<string, unknown> = {}): unknown {
  return {
    mandi_external_id: "multan-mandi",
    crop_external_id: "wheat",
    date: "2026-09-01",
    modal_price: 4250,
    min_price: 4150,
    max_price: 4300,
    unit: "Maund",
    is_holiday: false,
    ...overrides,
  };
}

describe("POST /api/prices/ingest", () => {
  beforeEach(() => {
    process.env.PRICES_CRON_SECRET = "test-secret-1234567890";
    mockQuery.mockReset();
    mockWithTransaction.mockReset();
    mockEvaluateAndDispatchAlerts.mockReset();
    __resetRateLimitBucketsForTests();
  });

  it("returns 500 when PRICES_CRON_SECRET is not configured", async () => {
    delete process.env.PRICES_CRON_SECRET;
    const req = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      headers: { authorization: "Bearer anything" },
      body: makeBody([buildRow()]),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      body: makeBody([buildRow()]),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when bearer is wrong", async () => {
    const req = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      headers: { authorization: "Bearer not-the-secret" },
      body: makeBody([buildRow()]),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when the body is malformed", async () => {
    const req = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      headers: { authorization: makeBearer() },
      body: JSON.stringify({ source_code: "amis_pk", rows: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 once per-IP limit is exceeded", async () => {
    const ok = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      headers: { authorization: makeBearer() },
      body: makeBody([buildRow()]),
    });
    mockQuery.mockResolvedValue([{ id: "multan-mandi", district: "multan" }]);
    mockWithTransaction.mockImplementation(async (fn) =>
      fn({ query: vi.fn().mockResolvedValue({ rowCount: 1 }) }),
    );
    mockEvaluateAndDispatchAlerts.mockResolvedValue({
      evaluated: 0,
      triggered: 0,
    });
    for (let i = 0; i < 10; i++) {
      const res = await POST(ok.clone());
      expect([200, 400]).toContain(res.status);
    }
    const res = await POST(ok.clone());
    expect(res.status).toBe(429);
  });

  it("upserts rows and writes an audit row on success", async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: "multan-mandi", district: "multan" }])
      .mockResolvedValueOnce([{ id: "wheat" }, { id: "cotton" }]);
    const innerQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    mockWithTransaction.mockImplementation(async (fn) => fn({ query: innerQuery }));
    mockEvaluateAndDispatchAlerts.mockResolvedValue({
      evaluated: 2,
      triggered: 1,
    });

    const req = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      headers: { authorization: makeBearer() },
      body: makeBody([buildRow(), buildRow({ crop_external_id: "cotton" })]),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rows_written).toBe(2);
    expect(data.rows_rejected).toBe(0);
    expect(data.source_code).toBe("amis_pk");
    expect(data.alerts_evaluated).toBe(2);
    expect(data.alerts_triggered).toBe(1);
    expect(data.request_id).toBeTruthy();

    expect(innerQuery).toHaveBeenCalledTimes(2);
    const auditCall = mockQuery.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("insert into scraper_runs"),
    );
    expect(auditCall).toBeTruthy();
  });

  it("counts rows with unknown mandi/crop as rejected and status partial", async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: "multan-mandi", district: "multan" }])
      .mockResolvedValueOnce([{ id: "wheat" }]);
    const innerQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    mockWithTransaction.mockImplementation(async (fn) => fn({ query: innerQuery }));
    mockEvaluateAndDispatchAlerts.mockResolvedValue({
      evaluated: 0,
      triggered: 0,
    });

    const req = new Request("http://localhost/api/prices/ingest", {
      method: "POST",
      headers: { authorization: makeBearer() },
      body: makeBody([buildRow(), buildRow({ mandi_external_id: "unknown-mandi" })]),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rows_written).toBe(1);
    expect(data.rows_rejected).toBe(1);
  });
});
