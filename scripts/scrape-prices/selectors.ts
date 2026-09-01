/**
 * Per-portal CSS selectors, base URLs, and date-extraction strategy.
 *
 * This is the single file that owns how we find the price rows on each
 * provincial portal. The scraper's drift detector compares today's row
 * count against historical weekday counts; if selectors silently break
 * and the run produces 0 rows, drift is suspected and the cron exits
 * non-zero (per spec §Q1).
 *
 * Updating a portal's selectors? Update ONLY this file. No CSS strings
 * live anywhere else in the scraper.
 */

export type SourceCode =
  | "amis_pk"
  | "samis_pk"
  | "fmis_kp"
  | "bmis_balochistan"
  | "pbs_spi";

export type CssSelector = string;

export interface PortalSelectors {
  readonly sourceCode: SourceCode;
  readonly displayName: string;
  readonly province: "punjab" | "sindh" | "khyber_pakhtunkhwa" | "balochistan" | "federal";
  readonly baseUrl: string;
  readonly priceListPath: string;
  readonly priceTable: CssSelector;
  readonly priceRow: CssSelector;
  readonly columns: {
    commodityName: CssSelector;
    modalPrice: CssSelector;
    minPrice: CssSelector;
    maxPrice: CssSelector;
    unit: CssSelector;
  };
  readonly dateFormat: "iso" | "dd-mm-yyyy" | "dd-mmm-yyyy";
  readonly csvExportPath?: string;
  readonly waitFor?: { selector: CssSelector; timeoutMs: number };
}

export const SELECTORS: Record<SourceCode, PortalSelectors> = {
  amis_pk: {
    sourceCode: "amis_pk",
    displayName: "Punjab AMIS",
    province: "punjab",
    baseUrl: "http://www.amis.pk",
    priceListPath: "/ViewPrices.aspx",
    priceTable: "table#ContentPlaceHolder1_GridView1",
    priceRow: "tbody tr",
    columns: {
      commodityName: "td:nth-child(2)",
      modalPrice: "td:nth-child(4)",
      minPrice: "td:nth-child(3)",
      maxPrice: "td:nth-child(5)",
      unit: "td:nth-child(6)",
    },
    dateFormat: "dd-mmm-yyyy",
    waitFor: { selector: "table#ContentPlaceHolder1_GridView1", timeoutMs: 15_000 },
  },
  samis_pk: {
    sourceCode: "samis_pk",
    displayName: "Sindh SAMIS",
    province: "sindh",
    baseUrl: "https://new-theme.staging-amis.com",
    priceListPath: "/market_price",
    priceTable: "table.table tbody",
    priceRow: "tr",
    columns: {
      commodityName: "td:nth-child(1)",
      modalPrice: "td:nth-child(4)",
      minPrice: "td:nth-child(3)",
      maxPrice: "td:nth-child(5)",
      unit: "td:nth-child(6)",
    },
    dateFormat: "iso",
    waitFor: { selector: "table.table tbody tr", timeoutMs: 15_000 },
  },
  fmis_kp: {
    sourceCode: "fmis_kp",
    displayName: "KP FMIS",
    province: "khyber_pakhtunkhwa",
    baseUrl: "https://fmis.kp.gov.pk",
    priceListPath: "/kp_essential_commodities_price",
    priceTable: "table#commodities-table tbody",
    priceRow: "tr",
    columns: {
      commodityName: "td:nth-child(3)",
      modalPrice: "td:nth-child(4)",
      minPrice: "td:nth-child(5)",
      maxPrice: "td:nth-child(6)",
      unit: "td:nth-child(7)",
    },
    dateFormat: "iso",
    csvExportPath: "/kp_essential_commodities_price?export=csv",
    waitFor: { selector: "table#commodities-table tbody tr", timeoutMs: 15_000 },
  },
  bmis_balochistan: {
    sourceCode: "bmis_balochistan",
    displayName: "Balochistan BMIS",
    province: "balochistan",
    baseUrl: "https://amisbalochistan.org",
    priceListPath: "/prices/",
    priceTable: "table.price-list tbody",
    priceRow: "tr",
    columns: {
      commodityName: "td:nth-child(1)",
      modalPrice: "td:nth-child(2)",
      minPrice: "td:nth-child(3)",
      maxPrice: "td:nth-child(4)",
      unit: "td:nth-child(5)",
    },
    dateFormat: "dd-mm-yyyy",
    waitFor: { selector: "table.price-list tbody tr", timeoutMs: 20_000 },
  },
  pbs_spi: {
    sourceCode: "pbs_spi",
    displayName: "PBS Weekly SPI",
    province: "federal",
    baseUrl: "https://www.pbs.gov.pk",
    priceListPath: "/price-statistics/",
    priceTable: "table",
    priceRow: "tr",
    columns: {
      commodityName: "td:nth-child(1)",
      modalPrice: "td:nth-child(4)",
      minPrice: "td:nth-child(3)",
      maxPrice: "td:nth-child(5)",
      unit: "td:nth-child(2)",
    },
    dateFormat: "iso",
  },
};

export function getSelectors(code: SourceCode): PortalSelectors {
  return SELECTORS[code];
}
