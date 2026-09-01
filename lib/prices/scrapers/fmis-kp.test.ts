import { describe, expect, it } from "vitest";
import { parseFmisCell, parseFmisCsv, parseFmisRow, scrapeFmis, toIngestRows } from "../../../scripts/scrape-prices/sources/fmis-kp";

describe("parseFmisCell", () => {
  it("parses a complete row", () => {
    const cell = parseFmisCell({
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
      parseFmisCell({
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
      parseFmisCell({
        commodity: "  ",
        minPrice: "3,200",
        modalPrice: "3,400",
        maxPrice: "3,600",
        unit: "40 Kg",
      }),
    ).toBeNull();
  });

  it("normalizes unit to per_maund_40kg for 40kg-style labels", () => {
    const cell = parseFmisCell({
      commodity: "Rice",
      minPrice: "4000",
      modalPrice: "4200",
      maxPrice: "4500",
      unit: "Per Maund",
    });
    expect(cell?.unit).toBe("per_maund_40kg");
  });
});

describe("parseFmisRow", () => {
  it("filters invalid cells and keeps the rest", () => {
    const parsed = parseFmisRow({
      mandi: "Peshawar",
      district: "Peshawar",
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
  it("emits one IngestRow per (mandi × crop) intersection with fmis_kp source", () => {
    const rows = toIngestRows([
      {
        mandi: "Peshawar",
        district: "Peshawar",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 },
          { commodity: "Rice", unit: "per_maund_40kg", minPricePkr: 4000, modalPricePkr: 4200, maxPricePkr: 4500 },
        ],
      },
      {
        mandi: "Mardan",
        district: "Mardan",
        observedDate: "2026-09-01",
        cells: [
          { commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3100, modalPricePkr: 3300, maxPricePkr: 3500 },
        ],
      },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      source_code: "fmis_kp",
      mandi_name: "Peshawar",
      district: "Peshawar",
      province: "Khyber Pakhtunkhwa",
      crop: "Wheat",
      unit: "per_maund_40kg",
      observed_date: "2026-09-01",
    });
    expect(rows[0].source_url).toContain("kp_essential_commodities_price");
  });

  it("skips rows with empty mandi or district", () => {
    const rows = toIngestRows([
      {
        mandi: "  ",
        district: "Peshawar",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_maund_40kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ]);
    expect(rows).toHaveLength(0);
  });

  it("coerces non-maund units back to per_maund_40kg to match the schema's strict literal", () => {
    const rows = toIngestRows([
      {
        mandi: "Peshawar",
        district: "Peshawar",
        observedDate: "2026-09-01",
        cells: [{ commodity: "Wheat", unit: "per_100kg", minPricePkr: 3200, modalPricePkr: 3400, maxPricePkr: 3600 }],
      },
    ]);
    expect(rows[0].unit).toBe("per_maund_40kg");
  });
});

describe("parseFmisCsv", () => {
  it("groups rows by (mandi, district) into a single ParsedFmisRow per key", () => {
    const csv = [
      "Market,District,Commodity,Min,Modal,Max,Unit",
      "Peshawar,Peshawar,Wheat,3200,3400,3600,40 Kg",
      "Peshawar,Peshawar,Rice,4000,4200,4500,40 Kg",
      "Mardan,Mardan,Wheat,3100,3300,3500,40 Kg",
    ].join("\n");
    const { rows } = parseFmisCsv(csv, "2026-09-01");
    expect(rows).toHaveLength(2);
    const peshawar = rows.find((r) => r.mandi === "Peshawar");
    expect(peshawar?.cells).toHaveLength(2);
    expect(peshawar?.cells.map((c) => c.commodity).sort()).toEqual(["Rice", "Wheat"]);
    const mardan = rows.find((r) => r.mandi === "Mardan");
    expect(mardan?.cells).toHaveLength(1);
    expect(mardan?.cells[0].commodity).toBe("Wheat");
  });

  it("handles quoted fields with embedded commas", () => {
    const csv = [
      "Market,District,Commodity,Min,Modal,Max,Unit",
      '"Mandi, A","District, B",Wheat,3200,3400,3600,40 Kg',
    ].join("\n");
    const { rows } = parseFmisCsv(csv, "2026-09-01");
    expect(rows).toHaveLength(1);
    expect(rows[0].mandi).toBe("Mandi, A");
    expect(rows[0].district).toBe("District, B");
  });

  it("returns an empty list for header-only or empty CSV", () => {
    expect(parseFmisCsv("Market,District,Commodity,Min,Modal,Max,Unit", "2026-09-01").rows).toEqual([]);
    expect(parseFmisCsv("", "2026-09-01").rows).toEqual([]);
  });

  it("skips rows where mandi or district is missing", () => {
    const csv = [
      "Market,District,Commodity,Min,Modal,Max,Unit",
      ",Peshawar,Wheat,3200,3400,3600,40 Kg",
    ].join("\n");
    const { rows } = parseFmisCsv(csv, "2026-09-01");
    expect(rows).toEqual([]);
  });
});

describe("scrapeFmis", () => {
  it("uses the CSV export when available and it parses to rows", async () => {
    const csv = [
      "Market,District,Commodity,Min,Modal,Max,Unit",
      "Peshawar,Peshawar,Wheat,3200,3400,3600,40 Kg",
    ].join("\n");
    const calls = { csv: 0, table: 0 };
    const rows = await scrapeFmis({
      observedDate: "2026-09-01",
      fetchCsv: async () => {
        calls.csv += 1;
        return csv;
      },
      fetchTableRows: async () => {
        calls.table += 1;
        return [];
      },
    });
    expect(calls.csv).toBe(1);
    expect(calls.table).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].source_code).toBe("fmis_kp");
  });

  it("falls back to table rows when the CSV export returns nothing", async () => {
    const calls = { csv: 0, table: 0 };
    const rows = await scrapeFmis({
      observedDate: "2026-09-01",
      fetchCsv: async () => {
        calls.csv += 1;
        return null;
      },
      fetchTableRows: async () => {
        calls.table += 1;
        return [
          {
            mandi: "Peshawar",
            district: "Peshawar",
            cells: [{ commodity: "Wheat", minPrice: "3200", modalPrice: "3400", maxPrice: "3600", unit: "40 Kg" }],
          },
        ];
      },
    });
    expect(calls.csv).toBe(1);
    expect(calls.table).toBe(1);
    expect(rows).toHaveLength(1);
  });

  it("returns an empty array when both paths yield nothing", async () => {
    const rows = await scrapeFmis({
      observedDate: "2026-09-01",
      fetchCsv: async () => "",
      fetchTableRows: async () => [],
    });
    expect(rows).toEqual([]);
  });
});
