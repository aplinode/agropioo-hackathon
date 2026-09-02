import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { postBatch, type IngestPayload } from "../../../scripts/scrape-prices/post";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function serverError(): Response {
  return new Response("boom", { status: 503 });
}

const sample: IngestPayload = {
  source_code: "amis_pk",
  scraped_at: "2026-09-01T05:00:00Z",
  rows: [
    {
      mandi_external_id: "multan-mandi",
      crop_external_id: "wheat",
      date: "2026-09-01",
      modal_price: 4250,
      min_price: 4150,
      max_price: 4300,
      unit: "Maund",
      is_holiday: false,
    },
  ],
};

describe("post.ts", () => {
  it("returns ok=true with zero counts when there are no rows", async () => {
    const res = await postBatch("http://localhost:3000", "secret", { ...sample, rows: [] });
    expect(res.ok).toBe(true);
    expect(res.rowsWritten).toBe(0);
    expect(res.attempts).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("POSTs the batch with bearer auth and the right headers", async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ rows_written: 1, rows_rejected: 0 }));
    await postBatch("http://localhost:3000", "secret", sample);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe("http://localhost:3000/api/prices/ingest");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret");
    expect((init.headers as Record<string, string>)["x-forwarded-for"]).toBeTruthy();
    const body = JSON.parse(init.body as string);
    expect(body.source_code).toBe("amis_pk");
    expect(body.rows).toHaveLength(1);
  });

  it("retries once on 5xx and succeeds on the second attempt", async () => {
    mockFetch
      .mockResolvedValueOnce(serverError())
      .mockResolvedValueOnce(okResponse({ rows_written: 1, rows_rejected: 0 }));
    const res = await postBatch("http://localhost:3000", "secret", sample);
    expect(res.ok).toBe(true);
    expect(res.attempts).toBe(2);
  });

  it("reports rows_written and rows_rejected from the route", async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ rows_written: 2, rows_rejected: 3 }));
    const res = await postBatch("http://localhost:3000", "secret", sample);
    expect(res.rowsWritten).toBe(2);
    expect(res.rowsRejected).toBe(3);
  });

  it("splits batches over 5000 rows into multiple POSTs", async () => {
    const big: IngestPayload = {
      ...sample,
      rows: Array.from({ length: 5001 }, (_, i) => ({
        ...sample.rows[0],
        crop_external_id: i % 2 === 0 ? "wheat" : "cotton",
      })),
    };
    mockFetch
      .mockResolvedValueOnce(okResponse({ rows_written: 5000, rows_rejected: 0 }))
      .mockResolvedValueOnce(okResponse({ rows_written: 1, rows_rejected: 0 }));
    const res = await postBatch("http://localhost:3000", "secret", big);
    expect(res.ok).toBe(true);
    expect(res.rowsWritten).toBe(5001);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
