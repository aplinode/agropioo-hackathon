import { describe, expect, it } from "vitest";
import { SELECTORS, getSelectors, type SourceCode } from "../../../scripts/scrape-prices/selectors";

const ALL_SOURCES: SourceCode[] = ["amis_pk", "samis_pk", "fmis_kp", "bmis_balochistan", "pbs_spi"];

describe("SELECTORS", () => {
  it("contains every source code exactly once", () => {
    for (const code of ALL_SOURCES) {
      expect(SELECTORS[code]).toBeDefined();
      expect(SELECTORS[code].sourceCode).toBe(code);
    }
  });

  it("has a non-empty column extractor for every source", () => {
    for (const code of ALL_SOURCES) {
      const s = SELECTORS[code];
      expect(s.columns.commodityName.length).toBeGreaterThan(0);
      expect(s.columns.modalPrice.length).toBeGreaterThan(0);
      expect(s.columns.minPrice.length).toBeGreaterThan(0);
      expect(s.columns.maxPrice.length).toBeGreaterThan(0);
      expect(s.columns.unit.length).toBeGreaterThan(0);
    }
  });
});

describe("getSelectors", () => {
  it("returns the same record as direct indexing", () => {
    for (const code of ALL_SOURCES) {
      expect(getSelectors(code)).toBe(SELECTORS[code]);
    }
  });
});
