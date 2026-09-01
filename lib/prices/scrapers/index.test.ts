import { describe, expect, it, vi } from "vitest";
import { executeRun, newRunId, SCRAPER_SOURCE_CODES, todayIso } from "../../../scripts/scrape-prices/index";

const RUN_ID = "11111111-1111-4111-8111-111111111111";

function makeRow(source: "amis_pk" | "samis_pk" | "fmis_kp" | "bmis_balochistan" | "pbs_spi", i: number) {
  const base = {
    mandi_name: `Mandi ${i}`,
    district: "District",
    crop: "Wheat",
    unit: "per_maund_40kg" as const,
    min_price_pkr: 3200,
    modal_price_pkr: 3400,
    max_price_pkr: 3600,
    observed_date: "2026-09-01",
  };
  if (source === "amis_pk") return { ...base, source_code: "amis_pk" as const, province: "Punjab" as const };
  if (source === "samis_pk") return { ...base, source_code: "samis_pk" as const, province: "Sindh" as const };
  if (source === "fmis_kp") return { ...base, source_code: "fmis_kp" as const, province: "Khyber Pakhtunkhwa" as const };
  if (source === "bmis_balochistan") return { ...base, source_code: "bmis_balochistan" as const, province: "Balochistan" as const };
  return { ...base, source_code: "pbs_spi" as const, province: "Islamabad" as const };
}

const NOOP_HOLIDAY = { async isHoliday() { return false; } } as const;

describe("executeRun", () => {
  it("exits 0 and reports total rows when at least one source writes rows", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, inserted: 2 }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [makeRow("amis_pk", 1), makeRow("amis_pk", 2)], durationMs: 100 },
        { code: "samis_pk", rows: [], durationMs: 50 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
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
    });
    expect(out.exitCode).toBe(1);
    expect(out.totalRowsWritten).toBe(0);
    expect(out.ingestCalls).toHaveLength(0);
  });

  it("isolates per-source failures (one source fails, others still write)", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [], durationMs: 50, error: new Error("portal down") },
        { code: "samis_pk", rows: [makeRow("samis_pk", 1)], durationMs: 80 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
    });
    expect(out.exitCode).toBe(0);
    expect(out.totalRowsWritten).toBe(1);
    expect(out.sourceRuns[0].status).toBe("failed");
    expect(out.sourceRuns[0].errorMessage).toBe("portal down");
    expect(out.sourceRuns[1].status).toBe("ok");
  });

  it("marks a source as failed when ingest returns a non-2xx status after retries", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const out = await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [
        { code: "amis_pk", rows: [makeRow("amis_pk", 1)], durationMs: 50 },
      ],
      ingest: { baseUrl: "https://api.example.test", secret: "secret" },
    });
    expect(out.exitCode).toBe(1);
    expect(out.sourceRuns[0].status).toBe("failed");
    expect(out.sourceRuns[0].errorMessage).toContain("500");
  });

  it("chunks rows at the requested size", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const rows = Array.from({ length: 7500 }, (_, i) => makeRow("amis_pk", i));
    await executeRun({
      observedDate: "2026-09-01",
      runId: RUN_ID,
      holidayLookup: NOOP_HOLIDAY,
      sources: [{ code: "amis_pk", rows, durationMs: 100 }],
      ingest: { baseUrl: "https://api.example.test", secret: "secret", chunkSize: 5000 },
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
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
    });
    for (const sr of out.sourceRuns) {
      expect(sr.drift).toBeDefined();
      expect(["healthy", "drift_suspected", "weekend", "no_history"]).toContain(sr.drift.status);
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
