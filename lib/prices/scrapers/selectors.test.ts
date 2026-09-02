import { describe, expect, it } from "vitest";
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
});
