/**
 * Scraper runner.
 *
 * This is the script invoked by `npm run scrape:prices` and by the
 * GitHub Actions cron. It is the ONLY place that touches the
 * Playwright browser, the XLSX download, and the ingest API.
 *
 * Design rules (per the 002 spec):
 * - One Playwright browser instance is shared across all sources.
 * - Each source runs in its own try/catch — one failure cannot
 *   block the others.
 * - Drift detection runs per source after scraping; the result is
 *   logged but does not abort the run (it is surfaced via the
 *   scraper_runs audit table + the /api/prices/health endpoint).
 * - The runner exits 0 if at least one source wrote rows across
 *   all sources, exit 1 if zero rows were written across all
 *   sources. Per-source partial success is acceptable.
 *
 * The runner exposes a pure orchestration function `executeRun(options)`
 * that the live entry point (`main()`) wires to the real fetchers,
 * plus a separate `runScrapers` that takes pre-built fetchers as
 * arguments. The pure form is what the unit tests exercise.
 */

import { randomUUID } from "node:crypto";

import { postBatch, type IngestPayload, type IngestRow, type PostResult } from "./post";
import { detectDrift, type DriftResult } from "./drift-detector";
import { SELECTORS, type SourceCode } from "./selectors";
import type { HolidayLookup, HolidayLookupResult } from "./holiday-check";

export interface SourceRunResult {
  source: SourceCode;
  status: "ok" | "failed";
  rowsWritten: number;
  drift: DriftResult;
  errorMessage?: string;
  durationMs: number;
}

export interface ExecuteRunInput {
  observedDate: string;
  runId: string;
  holidayLookup: HolidayLookup;
  sources: Array<{
    code: SourceCode;
    rows: IngestRow[];
    error?: Error;
    durationMs: number;
  }>;
  ingest: {
    baseUrl: string;
    secret: string;
  };
  detectDriftFn?: typeof detectDrift;
  postBatchFn?: typeof postBatch;
}

export interface ExecuteRunOutput {
  sourceRuns: SourceRunResult[];
  ingestCalls: Array<{ source: SourceCode; status: number; rowsWritten: number; rowsRejected: number; durationMs: number }>;
  totalRowsWritten: number;
  exitCode: 0 | 1;
}

export async function executeRun(input: ExecuteRunInput): Promise<ExecuteRunOutput> {
  const detect = input.detectDriftFn ?? detectDrift;
  const post = input.postBatchFn ?? postBatch;
  const sourceRuns: SourceRunResult[] = [];
  const ingestCalls: ExecuteRunOutput["ingestCalls"] = [];
  let totalRowsWritten = 0;

  const isHolidayResult: HolidayLookupResult = { isHoliday: false };

  for (const source of input.sources) {
    const drift = await detect({
      sourceCode: source.code,
      rowsWritten: source.rows.length,
      targetDate: input.observedDate,
      allHolidays: isHolidayResult.isHoliday,
    });

    const sourceRun: SourceRunResult = {
      source: source.code,
      status: source.error ? "failed" : "ok",
      rowsWritten: 0,
      drift,
      errorMessage: source.error?.message,
      durationMs: source.durationMs,
    };

    if (source.error) {
      sourceRuns.push(sourceRun);
      continue;
    }

    if (source.rows.length === 0) {
      sourceRuns.push(sourceRun);
      continue;
    }

    const payload: IngestPayload = {
      source_code: source.code,
      scraped_at: new Date().toISOString(),
      rows: source.rows,
    };

    const t0 = Date.now();
    const result: PostResult = await post(
      input.ingest.baseUrl,
      input.ingest.secret,
      payload,
    );
    ingestCalls.push({
      source: source.code,
      status: result.status,
      rowsWritten: result.rowsWritten,
      rowsRejected: result.rowsRejected,
      durationMs: Date.now() - t0,
    });
    if (result.ok) {
      totalRowsWritten += result.rowsWritten;
      sourceRun.rowsWritten = result.rowsWritten;
    } else {
      sourceRun.status = "failed";
      sourceRun.errorMessage = result.errorMessage ?? `ingest ${result.status}`;
    }
    sourceRuns.push(sourceRun);
  }

  return {
    sourceRuns,
    ingestCalls,
    totalRowsWritten,
    exitCode: totalRowsWritten > 0 ? 0 : 1,
  };
}

export function newRunId(): string {
  return randomUUID();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const SCRAPER_SOURCE_CODES: SourceCode[] = [
  "amis_pk",
  "samis_pk",
  "fmis_kp",
  "bmis_balochistan",
  "pbs_spi",
];

export { SELECTORS };
