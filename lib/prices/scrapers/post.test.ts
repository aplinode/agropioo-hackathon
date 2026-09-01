import { describe, expect, it, vi } from "vitest";
import { chunkBatch, postBatch, type IngestBatch } from "../../../scripts/scrape-prices/post";

function makeRow(i: number) {
  return {
    source_code: "amis_pk" as const,
    mandi_name: `Mandi ${i}`,
    district: "Lahore",
    province: "Punjab" as const,
    crop: "Wheat",
    unit: "per_maund_40kg" as const,
    min_price_pkr: 3000,
    modal_price_pkr: 3200,
    max_price_pkr: 3400,
    observed_date: "2026-09-01",
    source_url: "https://example.com/row/" + i,
  };
}

function makeBatch(rows: number): IngestBatch {
  return {
    source_run_id: "11111111-1111-4111-8111-111111111111",
    rows: Array.from({ length: rows }, (_, i) => makeRow(i)),
  };
}

describe("postBatch", () => {
  it("posts the batch with bearer auth and forwards client IP", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, inserted: 1 }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await postBatch(makeBatch(1), {
      baseUrl: "https://api.example.test",
      secret: "secret-token",
      clientIp: "203.0.113.5",
    });

    expect(result.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe("https://api.example.test/api/prices/ingest");
    expect(calledInit.method).toBe("POST");
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer secret-token");
    expect(headers["x-forwarded-for"]).toBe("203.0.113.5");
    expect(headers["content-type"]).toBe("application/json");
    const body = JSON.parse(calledInit.body as string);
    expect(body.rows).toHaveLength(1);
    expect(body.source_run_id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("retries once on 5xx and then returns the second response", async () => {
    let calls = 0;
    const mockFetch = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(JSON.stringify({ error: "boom" }), { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true, inserted: 1 }), { status: 200 });
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await postBatch(makeBatch(1), {
      baseUrl: "https://api.example.test",
      secret: "secret-token",
    });

    expect(result.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx and surfaces the body", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "bad" }), { status: 422 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await postBatch(makeBatch(1), {
      baseUrl: "https://api.example.test",
      secret: "secret-token",
    });

    expect(result.status).toBe(422);
    expect(result.body).toEqual({ error: "bad" });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("throws when the fetch keeps failing with a network error", async () => {
    const mockFetch = vi.fn(async () => {
      throw new TypeError("econnreset");
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      postBatch(makeBatch(1), { baseUrl: "https://api.example.test", secret: "secret-token" }),
    ).rejects.toThrow("econnreset");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("includes source_run_id and rows in the request body", async () => {
    let captured: { body: string | null } = { body: null };
    const mockFetch = vi.fn(async (_url: string, init: RequestInit) => {
      captured.body = init.body as string;
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", mockFetch);

    await postBatch(makeBatch(2), {
      baseUrl: "https://api.example.test",
      secret: "secret-token",
    });

    const body = JSON.parse(captured.body as string);
    expect(body.source_run_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(body.rows).toHaveLength(2);
    expect(body.rows[0].mandi_name).toBe("Mandi 0");
  });
});

describe("chunkBatch", () => {
  it("chunks the rows by the given size", () => {
    const batches = chunkBatch(makeBatch(5), 2);
    expect(batches).toHaveLength(3);
    expect(batches[0].rows).toHaveLength(2);
    expect(batches[1].rows).toHaveLength(2);
    expect(batches[2].rows).toHaveLength(1);
    for (const b of batches) {
      expect(b.source_run_id).toBe("11111111-1111-4111-8111-111111111111");
    }
  });

  it("returns a single batch when rows fit in one chunk", () => {
    const batches = chunkBatch(makeBatch(3), 10);
    expect(batches).toHaveLength(1);
    expect(batches[0].rows).toHaveLength(3);
  });

  it("rejects non-positive chunk sizes", () => {
    expect(() => chunkBatch(makeBatch(1), 0)).toThrow();
    expect(() => chunkBatch(makeBatch(1), -1)).toThrow();
  });
});
