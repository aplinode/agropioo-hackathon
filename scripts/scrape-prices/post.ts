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
}
