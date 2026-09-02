import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  parseSpiRow,
  parseSpiWorkbook,
  scrapeSpi,
  toIngestRows,
  type SpiSheetRow,
} from "../../../scripts/scrape-prices/sources/pbs-spi";

describe("parseSpiRow", () => {
  it("parses a complete row", () => {
    const parsed = parseSpiRow({
      mandi: "National",
      district: "Islamabad",
      commodity: "Wheat",
      unit: "40 Kg",
      minPrice: 3200,
      modalPrice: 3400,
      maxPrice: 3600,
    });
    expect(parsed).toEqual({
      mandi: "National",
      district: "Islamabad",
      commodity: "Wheat",
      unit: "per_maund_40kg",
      minPricePkr: 3200,
      modalPricePkr: 3400,
      maxPricePkr: 3600,
    });
  });

  it("rejects rows with non-numeric prices", () => {
    expect(
      parseSpiRow({
        mandi: "National",
        district: "Islamabad",
        commodity: "Wheat",
        unit: "40 Kg",
        minPrice: "N/A",
        modalPrice: 3400,
        maxPrice: 3600,
      }),
    ).toBeNull();
  });

  it("rejects rows with empty commodity names", () => {
    expect(
      parseSpiRow({
        mandi: "National",
        district: "Islamabad",
        commodity: "  ",
        unit: "40 Kg",
        minPrice: 3200,
        modalPrice: 3400,
        maxPrice: 3600,
      }),
    ).toBeNull();
  });

  it("rejects rows with empty mandi or district", () => {
    expect(
      parseSpiRow({
        mandi: "  ",
        district: "Islamabad",
        commodity: "Wheat",
        unit: "40 Kg",
        minPrice: 3200,
        modalPrice: 3400,
        maxPrice: 3600,
      }),
    ).toBeNull();
  });

  it("accepts prices as numeric strings with commas", () => {
    const parsed = parseSpiRow({
      mandi: "National",
      district: "Islamabad",
      commodity: "Wheat",
      unit: "40 Kg",
      minPrice: "3,200",
      modalPrice: "3,400",
      maxPrice: "3,600",
    });
    expect(parsed?.minPricePkr).toBe(3200);
  });
});

describe("toIngestRows", () => {
  it("emits IngestRow[] with pbs_spi source", () => {
    const rows = toIngestRows(
      [
        {
          mandi: "National",
          district: "Islamabad",
          commodity: "Wheat",
          unit: "per_maund_40kg",
          minPricePkr: 3200,
          modalPricePkr: 3400,
          maxPricePkr: 3600,
        },
      ],
      "2026-09-01",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      mandi_external_id: "pbs_spi-national",
      crop_external_id: "wheat",
      date: "2026-09-01",
      modal_price: 3400,
      min_price: 3200,
      max_price: 3600,
      unit: "Maund",
      is_holiday: false,
    });
  });

  it("sets is_holiday when flag is true", () => {
    const rows = toIngestRows(
      [
        {
          mandi: "National",
          district: "Islamabad",
          commodity: "Wheat",
          unit: "per_maund_40kg",
          minPricePkr: 3200,
          modalPricePkr: 3400,
          maxPricePkr: 3600,
        },
      ],
      "2026-09-01",
      undefined,
      true,
    );
    expect(rows[0].is_holiday).toBe(true);
  });
});

describe("parseSpiWorkbook", () => {
  it("filters invalid rows and emits the rest", () => {
    const rows: SpiSheetRow[] = [
      { mandi: "National", district: "Islamabad", commodity: "Wheat", unit: "40 Kg", minPrice: 3200, modalPrice: 3400, maxPrice: 3600 },
      { mandi: "National", district: "Islamabad", commodity: "", unit: "40 Kg", minPrice: 1, modalPrice: 2, maxPrice: 3 },
      { mandi: "National", district: "Islamabad", commodity: "Rice", unit: "40 Kg", minPrice: "bad", modalPrice: 4200, maxPrice: 4500 },
      { mandi: "National", district: "Islamabad", commodity: "Sugar", unit: "40 Kg", minPrice: 200, modalPrice: 220, maxPrice: 240 },
    ];
    const out = parseSpiWorkbook({ rows, observedDate: "2026-09-01" });
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.crop_external_id).sort()).toEqual(["sugar", "wheat"]);
  });
});

describe("scrapeSpi", () => {
  it("returns an empty array when fetchWorkbook returns null", async () => {
    const out = await scrapeSpi({
      observedDate: "2026-09-01",
      fetchWorkbook: async () => null,
      readWorkbook: () => [],
    });
    expect(out).toEqual([]);
  });

  it("parses a real XLSX workbook into IngestRows", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Mandi", "District", "Commodity", "Unit", "Min", "Modal", "Max"],
      ["National", "Islamabad", "Wheat", "40 Kg", 3200, 3400, 3600],
      ["National", "Islamabad", "Rice", "40 Kg", 4000, 4200, 4500],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const out = await scrapeSpi({
      observedDate: "2026-09-01",
      fetchWorkbook: async () => buffer,
      readWorkbook: (data) => {
        const wb2 = XLSX.read(data, { type: "array" });
        const first = wb2.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb2.Sheets[first], { defval: "" });
        return rows.map((row) => ({
          mandi: row["Mandi"],
          district: row["District"],
          commodity: row["Commodity"],
          unit: row["Unit"],
          minPrice: row["Min"],
          modalPrice: row["Modal"],
          maxPrice: row["Max"],
        }));
      },
    });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      mandi_external_id: "pbs_spi-national",
      crop_external_id: "wheat",
      unit: "Maund",
    });
  });
});
