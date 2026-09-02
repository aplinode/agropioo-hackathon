/**
 * KP FMIS scraper.
 *
 * https://fmis.kp.gov.pk/kp_essential_commodities_price — server-rendered
 * DataTable. Per the spec, the built-in CSV export endpoint
 * (`?export=csv`) is the preferred happy path; we fall back to
 * table-row scraping if the export is unavailable.
 *
 * The parser is the only piece under unit test. The Playwright
 * navigate / fetch / fall-back chain is exercised locally only
 * (per Constitution "no live-network tests committed"). Drift is
 * detected by comparing today's row count against the historical
 * weekday count for fmis_kp.
 */

import { SELECTORS, type SourceCode } from "../selectors";
import type { IngestRow } from "../post";

export type Province = "Punjab" | "Sindh" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad" | "Gilgit-Baltistan" | "Azad Jammu & Kashmir";

export const FMIS_PROVINCE: Province = "Khyber Pakhtunkhwa";
export const FMIS_SOURCE_CODE: SourceCode = "fmis_kp";

export interface ParsedFmisCell {
  commodity: string;
  unit: string;
  minPricePkr: number;
  modalPricePkr: number;
  maxPricePkr: number;
}

export interface ParsedFmisRow {
  mandi: string;
  district: string;
  observedDate: string;
  cells: ParsedFmisCell[];
}

const PKR_PER_MAUND = "per_maund_40kg";

function asNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeUnit(raw: string | undefined): string {
  const u = (raw ?? "").trim().toLowerCase();
  if (!u) return PKR_PER_MAUND;
  if (u.includes("maund") || u.includes("40")) return PKR_PER_MAUND;
  if (u.includes("100")) return "per_100kg";
  if (u.includes("kg")) return "per_kg";
  return u.replace(/\s+/g, "_");
}

export function parseFmisCell(input: {
  commodity: string;
  minPrice: string;
  modalPrice: string;
  maxPrice: string;
  unit: string;
}): ParsedFmisCell | null {
  const min = asNumber(input.minPrice);
  const modal = asNumber(input.modalPrice);
  const max = asNumber(input.maxPrice);
  if (min === null || modal === null || max === null) return null;
  if (!input.commodity.trim()) return null;
  return {
    commodity: input.commodity.trim(),
    unit: normalizeUnit(input.unit),
    minPricePkr: min,
    modalPricePkr: modal,
    maxPricePkr: max,
  };
}

export function parseFmisRow(input: {
  mandi: string;
  district: string;
  observedDate: string;
  rawCells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }>;
}): ParsedFmisRow {
  const cells: ParsedFmisCell[] = [];
  for (const raw of input.rawCells) {
    const cell = parseFmisCell(raw);
    if (cell) cells.push(cell);
  }
  return {
    mandi: input.mandi.trim(),
    district: input.district.trim(),
    observedDate: input.observedDate,
    cells,
  };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function toIngestRows(parsed: ParsedFmisRow[], sourceCode: SourceCode = FMIS_SOURCE_CODE, isHoliday = false): IngestRow[] {
  const rows: IngestRow[] = [];
  for (const entry of parsed) {
    if (!entry.mandi.trim() || !entry.district.trim()) continue;
    for (const cell of entry.cells) {
      rows.push({
        mandi_external_id: `${sourceCode}-${slugify(entry.mandi)}`,
        crop_external_id: slugify(cell.commodity),
        date: entry.observedDate,
        modal_price: cell.modalPricePkr,
        min_price: cell.minPricePkr,
        max_price: cell.maxPricePkr,
        unit: "Maund",
        is_holiday: isHoliday,
      });
    }
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

export interface ParsedFmisCsv {
  rows: ParsedFmisRow[];
}

export function parseFmisCsv(csv: string, observedDate: string): ParsedFmisCsv {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [] };
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const mandiIdx = headers.findIndex((h) => h.includes("market") || h.includes("mandi"));
  const districtIdx = headers.findIndex((h) => h.includes("district"));
  const commodityIdx = headers.findIndex((h) => h.includes("commodity") || h.includes("item") || h.includes("product"));
  const minIdx = headers.findIndex((h) => h.includes("min"));
  const modalIdx = headers.findIndex((h) => h.includes("modal") || h.includes("avg"));
  const maxIdx = headers.findIndex((h) => h.includes("max"));
  const unitIdx = headers.findIndex((h) => h.includes("unit"));

  const grouped = new Map<string, ParsedFmisRow>();
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const mandi = mandiIdx >= 0 ? (cols[mandiIdx] ?? "").trim() : "";
    const district = districtIdx >= 0 ? (cols[districtIdx] ?? "").trim() : "";
    if (!mandi || !district) continue;
    const cell = parseFmisCell({
      commodity: commodityIdx >= 0 ? cols[commodityIdx] ?? "" : "",
      minPrice: minIdx >= 0 ? cols[minIdx] ?? "" : "",
      modalPrice: modalIdx >= 0 ? cols[modalIdx] ?? "" : "",
      maxPrice: maxIdx >= 0 ? cols[maxIdx] ?? "" : "",
      unit: unitIdx >= 0 ? cols[unitIdx] ?? "" : "40 Kg",
    });
    if (!cell) continue;
    const key = `${mandi}|${district}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.cells.push(cell);
    } else {
      grouped.set(key, {
        mandi,
        district,
        observedDate,
        cells: [cell],
      });
    }
  }
  return { rows: Array.from(grouped.values()) };
}

export interface ScrapeFmisOptions {
  observedDate: string;
  fetchTableRows: () => Promise<Array<{ mandi: string; district: string; cells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }> }>>;
  fetchCsv?: () => Promise<string | null>;
}

export async function scrapeFmis(options: ScrapeFmisOptions): Promise<IngestRow[]> {
  if (options.fetchCsv) {
    const csv = await options.fetchCsv();
    if (csv && csv.trim().length > 0) {
      const { rows } = parseFmisCsv(csv, options.observedDate);
      if (rows.length > 0) return toIngestRows(rows);
    }
  }
  const raw = await options.fetchTableRows();
  const parsed: ParsedFmisRow[] = raw.map((row) =>
    parseFmisRow({
      mandi: row.mandi,
      district: row.district,
      observedDate: options.observedDate,
      rawCells: row.cells,
    }),
  );
  return toIngestRows(parsed);
}
