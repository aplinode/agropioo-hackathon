import type { Pool } from "pg";
import { getPool } from "../../lib/db";

export type DriftKind = "drift_suspected" | "healthy" | "no_history" | "weekend";

export interface DriftCheckInput {
  source: string;
  todayIso: string;
  rowsScrapedToday: number;
  weekday: boolean;
  hasWeekdayHistory: boolean;
  recentRowCount: number;
  mostRecentDate: string | null;
  mostRecentAgeDays: number | null;
}

export interface DriftResult {
  status: DriftKind;
  reason: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function detectDriftSync(input: DriftCheckInput): DriftResult {
  if (input.rowsScrapedToday > 0) {
    return { status: "healthy", reason: "rows_scraped_today" };
  }
  if (!input.weekday) {
    return { status: "weekend", reason: "non_weekday_run" };
  }
  if (!input.hasWeekdayHistory) {
    return { status: "no_history", reason: "no_prior_weekday_runs" };
  }
  return { status: "drift_suspected", reason: "zero_rows_with_history" };
}

export interface DriftContext {
  source: string;
  todayIso: string;
  weekday: boolean;
  rowsScrapedToday: number;
}

export interface DriftDbDeps {
  pool: Pool;
  lookbackDays?: number;
}

export async function detectDrift(
  ctx: DriftContext,
  deps: DriftDbDeps,
): Promise<DriftResult> {
  const result = deps.pool === null
    ? null
    : await deps.pool.query<{ day: string; is_weekday: boolean }>(
        `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
                EXTRACT(ISODOW FROM d)::int BETWEEN 1 AND 5 AS is_weekday
         FROM generate_series(($1::date - ($2::int || ' days')::interval), ($1::date - interval '1 day'), interval '1 day') AS d`,
        [ctx.todayIso, deps.lookbackDays ?? 60],
      );

  const weekdayHistory = (result?.rows ?? []).filter((row) => row.is_weekday).length;
  const mostRecentResult = deps.pool === null
    ? null
    : await deps.pool.query<{ obs_date: string; rows: number }>(
        "SELECT to_char(observed_date, 'YYYY-MM-DD') AS obs_date, rows FROM scraper_runs WHERE source = $1 ORDER BY observed_date DESC LIMIT 1",
        [ctx.source],
      );
  const mostRecent = mostRecentResult?.rows[0] ?? null;
  const mostRecentAgeDays = mostRecent
    ? Math.floor((Date.parse(ctx.todayIso) - Date.parse(mostRecent.obs_date)) / SEVEN_DAYS * 7)
    : null;

  return detectDriftSync({
    source: ctx.source,
    todayIso: ctx.todayIso,
    rowsScrapedToday: ctx.rowsScrapedToday,
    weekday: ctx.weekday,
    hasWeekdayHistory: weekdayHistory > 0,
    recentRowCount: mostRecent?.rows ?? 0,
    mostRecentDate: mostRecent?.obs_date ?? null,
    mostRecentAgeDays,
  });
}

export function createDriftDetector() {
  return (ctx: DriftContext) => detectDrift(ctx, { pool: getPool() });
}
