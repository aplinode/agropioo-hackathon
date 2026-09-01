/**
 * GET /api/prices/health — public scraper health snapshot.
 *
 * Aggregates the latest `scraper_runs` row per source_code so the operator
 * (and any monitoring) can see at a glance which portal is healthy,
 * drifting, or stale. See `specs/002-mandi-price-tracker/contracts/api-contracts.md`
 * §6 for the response shape.
 *
 * No auth, no PII, safe to expose.
 */

import { query } from "@/lib/db";
import { jsonResponse } from "@/lib/http";

const SOURCES = [
  "amis_pk",
  "samis_pk",
  "fmis_kp",
  "bmis_balochistan",
  "pbs_spi",
] as const;
type SourceCode = (typeof SOURCES)[number];

interface LatestRun {
  source_code: string;
  status: string;
  received_at: Date;
  rows_written: number;
}

export async function GET(): Promise<Response> {
  const latest = await query<LatestRun>(`
    select distinct on (source_code) source_code, status, received_at, rows_written
    from scraper_runs
    order by source_code, received_at desc
  `);

  const bySource = new Map<string, LatestRun>(
    latest.map((r) => [r.source_code, r] as const),
  );

  const sources: Record<
    SourceCode,
    { status: string; last_success: string | null; rows: number }
  > = Object.fromEntries(
    SOURCES.map((code) => {
      const row = bySource.get(code);
      return [
        code,
        {
          status: row ? row.status : "no_data",
          last_success: row ? row.received_at.toISOString() : null,
          rows: row ? row.rows_written : 0,
        },
      ];
    }),
  ) as Record<
    SourceCode,
    { status: string; last_success: string | null; rows: number }
  >;

  let mostRecent: Date | null = null;
  for (const row of latest) {
    if (!mostRecent || row.received_at > mostRecent) {
      mostRecent = row.received_at;
    }
  }
  const lastSuccessfulRun = mostRecent ? mostRecent.toISOString() : null;
  const lastRunAgeHours =
    mostRecent == null
      ? null
      : Math.round(((Date.now() - mostRecent.getTime()) / 3_600_000) * 10) / 10;

  return jsonResponse({
    last_successful_run: lastSuccessfulRun,
    last_run_age_hours: lastRunAgeHours,
    sources,
  });
}
