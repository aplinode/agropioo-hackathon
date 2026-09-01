import { describe, expect, it } from "vitest";
import { parseAmisCell, parseAmisRow, scrapeAmis, toIngestRows } from "../../../scripts/scrape-prices/sources/amis";

describe("parseAmisCell", () => {
  it("parses a complete row", () => {
    const cell = parseAmisCell({
      commodity: "Wheat",
      minPrice: "3,200",
      modalPrice: "3,400",
      maxPrice: "3,600",
      unit: "40 Kg",
    });
    expect(cell).toEqual({
      commodity: "Wheat",
      unit: "per_maund_40kg",
      minPricePkr: 3200,
      modalPricePkr: 3400,
      maxPricePkr: 3600,
    });
  });

  it("rejects rows with non-numeric prices", () => {
    expect(
      parseAmisCell({
        commodity: "Wheat",
        minPrice: "N/A",
        modalPrice: "3,400",
        maxPrice: "3,600",
        unit: "40 Kg",
      }),
    ).toBeNull();
  });

  it("rejects rows with empty commodity names", () => {
    expect(
      parseAmisCell({
        commodity: "  ",
        minPrice: "3,200",
        modalPrice: "3,400",
        maxPrice: "3,600",
        unit: "40 Kg",
      }),
    ).toBeNull();
  });

  it("normalizes unit to per_maund_40kg for 40kg-style labels", () => {
    const cell = parseAmisCell({
      commodity: "Rice",
      minPrice: "4000",
      modalPrice: "4200",
      maxPrice: "4500",
      unit: "Per Maund",
    });
    expect(cell?.unit).toBe("per_maund_40kg");
  });
});

describe("parseAmisRow", () => {
  it("filters invalid cells and keeps the rest", () => {
    const parsed = parseAmisRow({
      mandi: "Lahore",
      district: "Lahore",
      observedDate: "2026-09-01",
      rawCells: [
        { commodity: "Wheat", minPrice: "3200", modalPrice: "3400", maxPrice: "3600", unit: "40 Kg" },
        { commodity: "", minPrice: "1", modalPrice: "2", maxPrice: "3", unit: "40 Kg" },
        { commodity: "Rice", minPrice: "bad", modalPrice: "4200", maxPrice: "4500", unit: "40 Kg" },
      ],
    });
    expect(parsed.cells).toHaveLength(1);
    expect(parsed.cells[0].commodity).toBe("Wheat");
  });
});

describe("toIngestRows", () => {
  it("emits one IngestRow per (mandi × crop) intersection with amis_pk source", () => {
    const rows = toIngestRows([
      {
        mandi: "Lahore",
        district: "Lahore",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 },
          { commodity: "Rice", unit: "per_maund_40kg", minPricePkr: 4000, modalPricePkr: 4200, maxPricePkr: 4500 },
        ],
      },
      {
        mandi: "Faisalabad",
        district: "Faisalabad",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3100, modalPricePkr: 3300, maxPricePkr: 3500 },
        ],
      },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      source_code: "amis_pk",
      mandi_name: "Lahore",
      district: "Lahore",
      province: "Punjab",
      crop: "Wheat",
      unit: "per_maund_40kg",
      observed_date: "2026-09-01",
    });
    expect(rows[0].source_url).toContain("ViewPrices.aspx");
  });

  it("skips rows with empty mandi or district", () => {
    const rows = toIngestRows([
      {
        mandi: "  ",
        district: "Lahore",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ]);
    expect(rows).toHaveLength(0);
  });

  it("coerces non-maund units back to per_maund_40kg to match the schema's strict literal", () => {
    const rows = toIngestRows([
      {
        mandi: "Lahore",
        district: "Lahore",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_100kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ]);
    expect(rows[0].unit).toBe("per_maund_40kg");
  });
});

describe("scrapeAmis", () => {
  it("invokes the injected fetcher and produces IngestRows", async () => {
    const calls = { count: 0 };
    const rows = await scrapeAmis({
      observedDate: "2026-09-01",
      fetchTableRows: async () => {
        calls.count += 1;
        return [
          {
            mandi: "Lahore",
            district: "Lahore",
            cells: [{ commodity: "Wheat", minPrice: "3200", modalPrice: "3400", maxPrice: "3600", unit: "40 Kg" }],
          },
        ];
      },
    });
    expect(calls.count).toBe(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].crop).toBe("Wheat");
  });

  it("returns an empty array when the fetcher returns no rows", async () => {
    const rows = await scrapeAmis({
      observedDate: "2026-09-01",
      fetchTableRows: async () => [],
    });
    expect(rows).toEqual([]);
  });
});
