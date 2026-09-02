import { describe, expect, it } from "vitest";
import { detectDriftSync } from "../../../scripts/scrape-prices/drift-detector";

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
  });
});
