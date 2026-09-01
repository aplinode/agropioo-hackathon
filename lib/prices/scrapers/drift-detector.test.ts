import { describe, expect, it } from "vitest";
import { detectDriftSync } from "../../../scripts/scrape-prices/drift-detector";

describe("detectDriftSync", () => {
  const base = {
    source: "amis_pk",
    todayIso: "2026-09-01",
    rowsScrapedToday: 0,
    weekday: true,
    hasWeekdayHistory: true,
    recentRowCount: 50,
    mostRecentDate: "2026-08-31",
    mostRecentAgeDays: 1,
  };

  it("returns healthy when rows were scraped today", () => {
    expect(detectDriftSync({ ...base, rowsScrapedToday: 10 })).toEqual({
      status: "healthy",
      reason: "rows_scraped_today",
    });
  });

  it("returns weekend when the run is on a non-weekday", () => {
    expect(detectDriftSync({ ...base, weekday: false })).toEqual({
      status: "weekend",
      reason: "non_weekday_run",
    });
  });

  it("returns no_history when there is no prior weekday history", () => {
    expect(detectDriftSync({ ...base, hasWeekdayHistory: false })).toEqual({
      status: "no_history",
      reason: "no_prior_weekday_runs",
    });
  });

  it("returns drift_suspected on a zero-row weekday run with prior history", () => {
    expect(detectDriftSync(base)).toEqual({
      status: "drift_suspected",
      reason: "zero_rows_with_history",
    });
  });
});
