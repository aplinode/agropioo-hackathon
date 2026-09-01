import { describe, expect, it, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

const { GET } = await import("@/app/api/prices/health/route");

describe("GET /api/prices/health", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns all five sources as no_data when scraper_runs is empty", async () => {
    mockQuery.mockResolvedValueOnce([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.last_successful_run).toBeNull();
    expect(data.last_run_age_hours).toBeNull();
    expect(Object.keys(data.sources)).toEqual([
      "amis_pk",
      "samis_pk",
      "fmis_kp",
      "bmis_balochistan",
      "pbs_spi",
    ]);
    for (const code of Object.keys(data.sources)) {
      expect(data.sources[code].status).toBe("no_data");
      expect(data.sources[code].last_success).toBeNull();
      expect(data.sources[code].rows).toBe(0);
    }
  });

  it("reports the latest run per source and the most-recent timestamp", async () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const earlier = new Date("2026-08-31T10:00:00Z");
    mockQuery.mockResolvedValueOnce([
      { source_code: "amis_pk", status: "ok", received_at: now, rows_written: 80 },
      { source_code: "samis_pk", status: "drift_suspected", received_at: earlier, rows_written: 0 },
    ]);
    const res = await GET();
    const data = await res.json();
    expect(data.sources.amis_pk.status).toBe("ok");
    expect(data.sources.amis_pk.rows).toBe(80);
    expect(data.sources.amis_pk.last_success).toBe(now.toISOString());
    expect(data.sources.samis_pk.status).toBe("drift_suspected");
    expect(data.sources.samis_pk.last_success).toBe(earlier.toISOString());
    expect(data.sources.fmis_kp.status).toBe("no_data");
    expect(data.last_successful_run).toBe(now.toISOString());
    expect(typeof data.last_run_age_hours).toBe("number");
  });
});
