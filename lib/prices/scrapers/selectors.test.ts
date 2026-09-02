import { describe, expect, it } from "vitest";
<<<<<<< HEAD
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
=======
import {
  SELECTORS,
  getSelectors,
  type SourceCode,
} from "../../../scripts/scrape-prices/selectors";

describe("scraper selectors", () => {
  it("contains a selector entry for every required source", () => {
    const required: SourceCode[] = [
      "amis_pk",
      "samis_pk",
      "fmis_kp",
      "bmis_balochistan",
      "pbs_spi",
    ];
    for (const code of required) {
      expect(SELECTORS[code], `missing selectors for ${code}`).toBeDefined();
    }
  });

  it("every entry has the required column extractors", () => {
    for (const [code, sel] of Object.entries(SELECTORS)) {
      expect(sel.columns.commodityName, `${code}.commodityName`).toBeTruthy();
      expect(sel.columns.modalPrice, `${code}.modalPrice`).toBeTruthy();
      expect(sel.columns.minPrice, `${code}.minPrice`).toBeTruthy();
      expect(sel.columns.maxPrice, `${code}.maxPrice`).toBeTruthy();
      expect(sel.priceTable, `${code}.priceTable`).toBeTruthy();
      expect(sel.priceRow, `${code}.priceRow`).toBeTruthy();
    }
  });

  it("getSelectors returns the same object as SELECTORS[code]", () => {
    expect(getSelectors("amis_pk")).toBe(SELECTORS.amis_pk);
  });
>>>>>>> c84d8bc (feat(002-scraper): per-portal CSS selectors (single source of truth))
});
