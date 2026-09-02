import { describe, expect, it, vi } from "vitest";
import { executeRun, newRunId, SCRAPER_SOURCE_CODES, todayIso } from "../../../scripts/scrape-prices/index";
import type { IngestRow } from "../../../scripts/scrape-prices/post";
import type { HolidayLookup, HolidayLookupResult } from "../../../scripts/scrape-prices/holiday-check";

const RUN_ID = "11111111-1111-4111-8111-111111111111";

function makeRow(source: "amis_pk" | "samis_pk" | "fmis_kp" | "bmis_balochistan" | "pbs_spi", i: number): IngestRow {
  return {
    mandi_external_id: `${source}-mandi-${i}`,
    crop_external_id: "wheat",
    date: "2026-09-01",
    modal_price: 3400,
    min_price: 3200,
    max_price: 3600,
    unit: "Maund",
    is_holiday: false,
  };
}

const NOOP_HOLIDAY: HolidayLookup = {
  async isHoliday(): Promise<HolidayLookupResult> {
    return { isHoliday: false };
  },
};

const NOOP_DRIFT = vi.fn(async () => ({
  status: "ok" as const,
  historicalCount: 0,
  reason: "mocked",
}));

describe("executeRun", () => {
  it("exits 0 and reports total rows when at least one source writes rows", async () => {
    const mockPostBatch = vi.fn(async () => ({
      ok: true,
      rowsWritten: 2,
      rowsRejected: 0,
      status: 200,
      attempts: 1,
    }));

    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [makeRow("amis_pk", 1), makeRow("amis_pk", 2)], durationMs: 100 },
        { code: "samis_pk", rows: [], durationMs: 50 },
      ],
       ingest: { baseUrl: "https://api.example.test", secret: "secret" },
       postBatchFn: mockPostBatch,
       detectDriftFn: NOOP_DRIFT,
     });

     expect(out.exitCode).toBe(0);
     expect(out.totalRowsWritten).toBe(2);
    expect(out.sourceRuns).toHaveLength(2);
    expect(out.sourceRuns[0].rowsWritten).toBe(2);
    expect(out.sourceRuns[0].status).toBe("ok");
    expect(out.ingestCalls).toHaveLength(1);
    expect(out.ingestCalls[0].status).toBe(200);
  });

  it("exits 1 when no source wrote any rows", async () => {
    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [], durationMs: 50 },
        { code: "samis_pk", rows: [], durationMs: 50 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
      detectDriftFn: NOOP_DRIFT,
    });
    expect(out.exitCode).toBe(1);
    expect(out.totalRowsWritten).toBe(0);
    expect(out.ingestCalls).toHaveLength(0);
  });

  it("isolates per-source failures (one source fails, others still write)", async () => {
    const mockPostBatch = vi.fn(async () => ({
      ok: true,
      rowsWritten: 1,
      rowsRejected: 0,
      status: 200,
      attempts: 1,
    }));

    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [], durationMs: 50, error: new Error("portal down") },
        { code: "samis_pk", rows: [makeRow("samis_pk", 1)], durationMs: 80 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
      postBatchFn: mockPostBatch,
      detectDriftFn: NOOP_DRIFT,
    });
    expect(out.exitCode).toBe(0);
    expect(out.totalRowsWritten).toBe(1);
    expect(out.sourceRuns[0].status).toBe("failed");
    expect(out.sourceRuns[0].errorMessage).toBe("portal down");
    expect(out.sourceRuns[1].status).toBe("ok");
  });

  it("marks a source as failed when ingest returns a non-2xx status after retries", async () => {
    const mockPostBatch = vi.fn(async () => ({
      ok: false,
      rowsWritten: 0,
      rowsRejected: 0,
      status: 500,
      attempts: 2,
      errorMessage: "HTTP 500",
    }));

    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [makeRow("amis_pk", 1)], durationMs: 50 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
      postBatchFn: mockPostBatch,
      detectDriftFn: NOOP_DRIFT,
    });
    expect(out.exitCode).toBe(1);
    expect(out.sourceRuns[0].status).toBe("failed");
    expect(out.sourceRuns[0].errorMessage).toContain("500");
  });

  it("runs drift detection for every source and surfaces its status", async () => {
    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [], durationMs: 50 },
        { code: "pbs_spi", rows: [], durationMs: 50 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
      detectDriftFn: NOOP_DRIFT,
    });
    for (const sr of out.sourceRuns) {
      expect(sr.drift).toBeDefined();
      expect(["ok", "drift_suspected", "partial"]).toContain(sr.drift.status);
    }
  });
});

describe("newRunId", () => {
  it("returns a UUID-shaped string", () => {
    const id = newRunId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("returns distinct ids on each call", () => {
    const a = newRunId();
    const b = newRunId();
    expect(a).not.toBe(b);
  });
});

describe("todayIso", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("SCRAPER_SOURCE_CODES", () => {
  it("contains exactly the five expected source codes in spec order", () => {
    expect(SCRAPER_SOURCE_CODES).toEqual([
      "amis_pk",
      "samis_pk",
      "fmis_kp",
      "bmis_balochistan",
      "pbs_spi",
    ]);
  });
});
