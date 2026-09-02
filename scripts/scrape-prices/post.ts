<<<<<<< HEAD
import { z } from "zod";

export const ingestRowSchema = z.object({
  source_code: z.enum(["amis_pk", "samis_pk", "fmis_kp", "bmis_balochistan", "pbs_spi", "seed_pk_initial"]),
  mandi_name: z.string().min(1).max(200),
  district: z.string().min(1).max(100),
  province: z.enum(["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad", "Gilgit-Baltistan", "Azad Jammu & Kashmir"]),
  crop: z.string().min(1).max(100),
  unit: z.literal("per_maund_40kg"),
  min_price_pkr: z.number().nonnegative().max(1_000_000),
  modal_price_pkr: z.number().nonnegative().max(1_000_000),
  max_price_pkr: z.number().nonnegative().max(1_000_000),
  observed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_url: z.string().url().optional(),
});

export const ingestBatchSchema = z.object({
  source_run_id: z.string().uuid(),
  rows: z.array(ingestRowSchema).min(1).max(5000),
});

export type IngestRow = z.infer<typeof ingestRowSchema>;
export type IngestBatch = z.infer<typeof ingestBatchSchema>;

const MAX_RETRIES = 1;
const BACKOFF_MS = 1000;

export class IngestError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface PostOptions {
  baseUrl: string;
  secret: string;
  clientIp?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export interface PostResult {
  status: number;
  body: unknown;
}

export async function postBatch(batch: IngestBatch, options: PostOptions): Promise<PostResult> {
  const url = new URL("/api/prices/ingest", options.baseUrl).toString();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${options.secret}`,
  };
  if (options.clientIp) headers["x-forwarded-for"] = options.clientIp;

  const fetcher = options.fetchImpl ?? fetch;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetcher(url, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
        signal: options.signal,
      });
      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text.length > 0 ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new IngestError(response.status, parsed, `Ingest ${response.status}`);
        await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
        attempt += 1;
        continue;
      }
      return { status: response.status, body: parsed };
    } catch (err) {
      lastError = err;
      if (attempt >= MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
      attempt += 1;
    }
  }

  if (lastError instanceof IngestError) {
    return { status: lastError.status, body: lastError.body };
  }
  throw lastError instanceof Error ? lastError : new Error("postBatch failed");
}

export function chunkBatch(batch: IngestBatch, chunkSize: number): IngestBatch[] {
  if (chunkSize <= 0) throw new Error("chunkSize must be > 0");
  const chunks: IngestBatch[] = [];
  for (let i = 0; i < batch.rows.length; i += chunkSize) {
    chunks.push({ source_run_id: batch.source_run_id, rows: batch.rows.slice(i, i + chunkSize) });
  }
  return chunks;
=======
/**
 * `post.ts` — Bearer-authenticated POST to `/api/prices/ingest`.
 *
 * Splits a batch into ≤5000-row chunks (the route's Zod cap), signs each
 * with the bearer, retries once on 5xx with exponential backoff, and
 * returns aggregated counts.
 *
 * Per Constitution §V: never log the bearer. We only log the IP and
 * the response status.
 */

import { setTimeout as sleep } from "node:timers/promises";
import type { SourceCode } from "./selectors";

export interface IngestRow {
  mandi_external_id: string;
  crop_external_id: string;
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  unit: "Maund";
  is_holiday: boolean;
}

export interface IngestPayload {
  source_code: SourceCode;
  scraped_at: string;
  rows: IngestRow[];
}

export interface PostResult {
  ok: boolean;
  rowsWritten: number;
  rowsRejected: number;
  status: number;
  attempts: number;
  errorMessage?: string;
}

const MAX_BATCH = 5000;
const MAX_ATTEMPTS = 2;
const BACKOFF_MS = 1500;

export async function postBatch(
  appBaseUrl: string,
  bearer: string,
  payload: IngestPayload,
  clientIp: string = "scraper-runner",
): Promise<PostResult> {
  if (payload.rows.length === 0) {
    return {
      ok: true,
      rowsWritten: 0,
      rowsRejected: 0,
      status: 200,
      attempts: 0,
    };
  }

  let totalWritten = 0;
  let totalRejected = 0;
  let lastStatus = 0;
  let lastError: string | undefined;
  let attempts = 0;

  for (let i = 0; i < payload.rows.length; i += MAX_BATCH) {
    const chunk: IngestPayload = {
      source_code: payload.source_code,
      scraped_at: payload.scraped_at,
      rows: payload.rows.slice(i, i + MAX_BATCH),
    };

    const url = new URL("/api/prices/ingest", appBaseUrl);
    let attempt = 0;
    let success = false;
    while (attempt < MAX_ATTEMPTS && !success) {
      attempt++;
      attempts++;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${bearer}`,
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify(chunk),
        });
        lastStatus = res.status;
        if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
          await sleep(BACKOFF_MS * attempt);
          continue;
        }
        if (!res.ok) {
          lastError = await safeReadError(res);
          break;
        }
        const body = (await res.json()) as {
          rows_written?: number;
          rows_rejected?: number;
        };
        totalWritten += Number(body.rows_written ?? 0);
        totalRejected += Number(body.rows_rejected ?? 0);
        success = true;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        if (attempt < MAX_ATTEMPTS) {
          await sleep(BACKOFF_MS * attempt);
          continue;
        }
      }
    }
  }

  return {
    ok: lastStatus >= 200 && lastStatus < 300,
    rowsWritten: totalWritten,
    rowsRejected: totalRejected,
    status: lastStatus,
    attempts,
    errorMessage: lastError,
  };
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
>>>>>>> b42257a (Merge branch '002-mandi-price-tracker' into main — resolve 19 conflicts)
}
