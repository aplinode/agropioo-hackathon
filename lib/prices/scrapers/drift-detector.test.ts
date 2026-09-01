import { describe, expect, it } from "vitest";
import { detectDriftSync } from "../../../scripts/scrape-prices/drift-detector";

<<<<<<< HEAD
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
=======
describe("drift detector (sync)", () => {
  it("returns ok when rows were ingested", () => {
    const r = detectDriftSync({
      sourceCode: "amis_pk",
      rowsWritten: 50,
      allHolidays: false,
      historicalCount: 100,
    });
    expect(r.status).toBe("ok");
  });

  it("returns ok when rowsWritten=0 and all markets are closed for the day", () => {
    const r = detectDriftSync({
      sourceCode: "samis_pk",
      rowsWritten: 0,
      allHolidays: true,
      historicalCount: 40,
    });
    expect(r.status).toBe("ok");
    expect(r.reason).toContain("holiday");
  });

  it("returns ok when rowsWritten=0 and no history exists yet", () => {
    const r = detectDriftSync({
      sourceCode: "fmis_kp",
      rowsWritten: 0,
      allHolidays: false,
      historicalCount: 0,
    });
    expect(r.status).toBe("ok");
  });

  it("returns drift_suspected when rowsWritten=0 and weekday history exists", () => {
    const r = detectDriftSync({
      sourceCode: "amis_pk",
      rowsWritten: 0,
      allHolidays: false,
      historicalCount: 30,
    });
    expect(r.status).toBe("drift_suspected");
    expect(r.historicalCount).toBe(30);
>>>>>>> b42257a (Merge branch '002-mandi-price-tracker' into main — resolve 19 conflicts)
  });
});
