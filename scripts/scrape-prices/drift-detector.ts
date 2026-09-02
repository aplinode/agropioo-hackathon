/**
 * `drift-detector.ts` — Per spec §Q4: "If a scraper returns 0 rows AND
 * that source has historical rows for the same weekday, the run is
 * marked as failed (drift suspected), the source is logged with
 * `status = 'drift_suspected'` in the `scraper_runs` audit table."
 *
 * "Same weekday" here means: there is at least one row in
 * `mandi_prices` for this `source_code` whose `date` falls on the same
 * day-of-week (Mon/Tue/...) as the run's target date. If yes, we
 * expect a similar row count today; if not, the selector is suspect.
 *
 * Holidays are an explicit exception: if the holiday lookup says
 * "today is closed for this mandi", the source is NOT drift-suspected
 * even if the row count is 0. The scraper runner must call
 * `applyHolidays` before `detectDrift` to apply this exemption.
 */

import { query } from "../../lib/db";
import { getSelectors, type SourceCode } from "./selectors";

export type DriftStatus = "ok" | "partial" | "drift_suspected";

export interface DriftInputs {
  sourceCode: SourceCode;
  rowsWritten: number;
  targetDate: string;
  allHolidays: boolean;
}

export interface DriftResult {
  status: DriftStatus;
  historicalCount: number;
  reason: string;
}

const PARTIAL_THRESHOLD = 0.5;

export async function detectDrift(input: DriftInputs): Promise<DriftResult> {
  const { sourceCode, rowsWritten, targetDate, allHolidays } = input;

  if (rowsWritten > 0) {
    return {
      status: "ok",
      historicalCount: 0,
      reason: `${rowsWritten} rows ingested`,
    };
  }

  if (allHolidays) {
    return {
      status: "ok",
      historicalCount: 0,
      reason: "all markets closed for the day (pre-flagged holiday)",
    };
  }

  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) {
    return {
      status: "drift_suspected",
      historicalCount: 0,
      reason: "target date unparseable; cannot compare weekday",
    };
  }
  const weekday = target.getUTCDay();

  const rows = await query<{ count: string }>(
    `select count(*)::text as count
     from mandi_prices
     where source_code = $1
       and extract(isodow from date) = $2`,
    [sourceCode, weekday],
  );
  const historicalCount = Number(rows[0]?.count ?? 0);

  if (historicalCount === 0) {
    return {
      status: "ok",
      historicalCount: 0,
      reason: "no historical data for this weekday — nothing to compare",
    };
  }

  return {
    status: "drift_suspected",
    historicalCount,
    reason:
      `0 rows but ${historicalCount} historical rows for this weekday; ` +
      `check ${getSelectors(sourceCode).displayName} selectors`,
  };
}

/** Pure helper for tests: same logic without the DB read. */
export function detectDriftSync(
  input: Omit<DriftInputs, "targetDate"> & { historicalCount: number },
): DriftResult {
  if (input.rowsWritten > 0) {
    return { status: "ok", historicalCount: 0, reason: "rows ingested" };
  }
  if (input.allHolidays) {
    return {
      status: "ok",
      historicalCount: 0,
      reason: "all markets closed for the day (pre-flagged holiday)",
    };
  }
  if (input.historicalCount === 0) {
    return {
      status: "ok",
      historicalCount: 0,
      reason: "no historical data for this weekday",
    };
  }
  return {
    status: "drift_suspected",
    historicalCount: input.historicalCount,
    reason:
      `0 rows but ${input.historicalCount} historical rows for this weekday; ` +
      `check selectors`,
  };
}

export { PARTIAL_THRESHOLD };
