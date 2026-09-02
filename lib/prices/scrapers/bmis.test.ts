import { describe, expect, it } from "vitest";
import { parseBmisCell, parseBmisRow, scrapeBmis, toIngestRows } from "../../../scripts/scrape-prices/sources/bmis";

describe("parseBmisCell", () => {
  it("parses a complete row", () => {
    const cell = parseBmisCell({
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
      parseBmisCell({
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
      parseBmisCell({
        commodity: "  ",
        minPrice: "3,200",
        modalPrice: "3,400",
        maxPrice: "3,600",
        unit: "40 Kg",
      }),
    ).toBeNull();
  });

  it("normalizes unit to per_maund_40kg for 40kg-style labels", () => {
    const cell = parseBmisCell({
      commodity: "Rice",
      minPrice: "4000",
      modalPrice: "4200",
      maxPrice: "4500",
      unit: "Per Maund",
    });
    expect(cell?.unit).toBe("per_maund_40kg");
  });
});

describe("parseBmisRow", () => {
  it("filters invalid cells and keeps the rest", () => {
    const parsed = parseBmisRow({
      mandi: "Quetta",
      district: "Quetta",
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
  it("emits one IngestRow per (mandi × crop) intersection with bmis_balochistan source", () => {
    const rows = toIngestRows([
      {
        mandi: "Quetta",
        district: "Quetta",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 },
          { commodity: "Rice", unit: "per_maund_40kg", minPricePkr: 4000, modalPricePkr: 4200, maxPricePkr: 4500 },
        ],
      },
      {
        mandi: "Khuzdar",
        district: "Khuzdar",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3100, modalPricePkr: 3300, maxPricePkr: 3500 },
        ],
      },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      mandi_external_id: "bmis_balochistan-quetta",
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
        district: "Quetta",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ]);
    expect(rows).toHaveLength(0);
  });

  it("sets is_holiday when flag is true", () => {
    const rows = toIngestRows([
      {
        mandi: "Quetta",
        district: "Quetta",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ], undefined, true);
    expect(rows[0].is_holiday).toBe(true);
  });
});

describe("scrapeBmis", () => {
  it("uses the primary fetcher when it returns rows", async () => {
    const calls = { primary: 0, fallback: 0 };
    const rows = await scrapeBmis({
      observedDate: "2026-09-01",
      fetchPrimary: async () => {
        calls.primary += 1;
        return [
          {
            mandi: "Quetta",
            district: "Quetta",
            cells: [{ commodity: "Wheat", minPrice: "3200", modalPrice: "3400", maxPrice: "3600", unit: "40 Kg" }],
          },
        ];
      },
      fetchFallback: async () => {
        calls.fallback += 1;
        return [];
      },
    });
    expect(calls.primary).toBe(1);
    expect(calls.fallback).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].mandi_external_id).toContain("bmis_balochistan");
  });

  it("falls back to the secondary URL when the primary returns nothing", async () => {
    const calls = { primary: 0, fallback: 0 };
    const rows = await scrapeBmis({
      observedDate: "2026-09-01",
      fetchPrimary: async () => {
        calls.primary += 1;
        return [];
      },
      fetchFallback: async () => {
        calls.fallback += 1;
        return [
          {
            mandi: "Khuzdar",
            district: "Khuzdar",
            cells: [{ commodity: "Wheat", minPrice: "3100", modalPrice: "3300", maxPrice: "3500", unit: "40 Kg" }],
          },
        ];
      },
    });
    expect(calls.primary).toBe(1);
    expect(calls.fallback).toBe(1);
    expect(rows).toHaveLength(1);
  });

  it("returns an empty array when both fetchers return nothing", async () => {
    const rows = await scrapeBmis({
      observedDate: "2026-09-01",
      fetchPrimary: async () => [],
    });
    expect(rows).toEqual([]);
  });
});
