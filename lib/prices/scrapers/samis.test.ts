import { describe, expect, it } from "vitest";
import { parseSamisCell, parseSamisRow, scrapeSamis, toIngestRows } from "../../../scripts/scrape-prices/sources/samis";

describe("parseSamisCell", () => {
  it("parses a complete row", () => {
    const cell = parseSamisCell({
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
      parseSamisCell({
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
      parseSamisCell({
        commodity: "  ",
        minPrice: "3,200",
        modalPrice: "3,400",
        maxPrice: "3,600",
        unit: "40 Kg",
      }),
    ).toBeNull();
  });

  it("normalizes unit to per_maund_40kg for 40kg-style labels", () => {
    const cell = parseSamisCell({
      commodity: "Rice",
      minPrice: "4000",
      modalPrice: "4200",
      maxPrice: "4500",
      unit: "Per Maund",
    });
    expect(cell?.unit).toBe("per_maund_40kg");
  });
});

describe("parseSamisRow", () => {
  it("filters invalid cells and keeps the rest", () => {
    const parsed = parseSamisRow({
      mandi: "Karachi",
      district: "Karachi",
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
  it("emits one IngestRow per (mandi × crop) intersection with samis_pk source", () => {
    const rows = toIngestRows([
      {
        mandi: "Karachi",
        district: "Karachi",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 },
          { commodity: "Rice", unit: "per_maund_40kg", minPricePkr: 4000, modalPricePkr: 4200, maxPricePkr: 4500 },
        ],
      },
      {
        mandi: "Hyderabad",
        district: "Hyderabad",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3100, modalPricePkr: 3300, maxPricePkr: 3500 },
        ],
      },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      mandi_external_id: "samis_pk-karachi",
      crop_external_id: "wheat",
      date: "2026-09-01",
      modal_price: 3400,
      min_price: 3200,
      max_price: 3600,
      unit: "Maund",
      is_holiday: false,
    });
  });

  it("skips rows with empty mandi or district", () => {
    const rows = toIngestRows([
      {
        mandi: "  ",
        district: "Karachi",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ]);
    expect(rows).toHaveLength(0);
  });

  it("sets is_holiday when flag is true", () => {
    const rows = toIngestRows([
      {
        mandi: "Karachi",
        district: "Karachi",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ], undefined, true);
    expect(rows[0].is_holiday).toBe(true);
  });
});

describe("scrapeSamis", () => {
  it("invokes the injected fetcher and produces IngestRows", async () => {
    const calls = { count: 0 };
    const rows = await scrapeSamis({
      observedDate: "2026-09-01",
      fetchTableRows: async () => {
        calls.count += 1;
        return [
          {
            mandi: "Karachi",
            district: "Karachi",
            cells: [{ commodity: "Wheat", minPrice: "3200", modalPrice: "3400", maxPrice: "3600", unit: "40 Kg" }],
          },
        ];
      },
    });
    expect(calls.count).toBe(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].crop_external_id).toBe("wheat");
  });

  it("returns an empty array when the fetcher returns no rows", async () => {
    const rows = await scrapeSamis({
      observedDate: "2026-09-01",
      fetchTableRows: async () => [],
    });
    expect(rows).toEqual([]);
  });
});
