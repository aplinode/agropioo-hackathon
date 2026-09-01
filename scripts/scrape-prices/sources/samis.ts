/**
 * Sindh SAMIS scraper.
 *
 * https://new-theme.staging-amis.com/market_price — React frontend, the
 * price list is rendered into a Bootstrap table after the user picks
 * district / market / commodity via URL query params.
 *
 * The parser is the only piece under unit test. The Playwright launch
 * + URL-params + table-walk path is exercised locally only
 * (per Constitution "no live-network tests committed"). Drift is
 * detected by comparing today's row count against the historical
 * weekday count for samis_pk.
 */

import { SELECTORS, type SourceCode } from "../selectors";
import type { IngestRow } from "../post";

export type Province = "Punjab" | "Sindh" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad" | "Gilgit-Baltistan" | "Azad Jammu & Kashmir";

export const SAMIS_PROVINCE: Province = "Sindh";
export const SAMIS_SOURCE_CODE: SourceCode = "samis_pk";

export interface ParsedSamisCell {
  commodity: string;
  unit: string;
  minPricePkr: number;
  modalPricePkr: number;
  maxPricePkr: number;
}

export interface ParsedSamisRow {
  mandi: string;
  district: string;
  observedDate: string;
  cells: ParsedSamisCell[];
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

export function parseSamisCell(input: {
  commodity: string;
  minPrice: string;
  modalPrice: string;
  maxPrice: string;
  unit: string;
}): ParsedSamisCell | null {
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

export function parseSamisRow(input: {
  mandi: string;
  district: string;
  observedDate: string;
  rawCells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }>;
}): ParsedSamisRow {
  const cells: ParsedSamisCell[] = [];
  for (const raw of input.rawCells) {
    const cell = parseSamisCell(raw);
    if (cell) cells.push(cell);
  }
  return {
    mandi: input.mandi.trim(),
    district: input.district.trim(),
    observedDate: input.observedDate,
    cells,
  };
}

export function toIngestRows(parsed: ParsedSamisRow[], sourceCode: SourceCode = SAMIS_SOURCE_CODE): IngestRow[] {
  const rows: IngestRow[] = [];
  for (const entry of parsed) {
    if (!entry.mandi.trim() || !entry.district.trim()) continue;
    for (const cell of entry.cells) {
      rows.push({
        source_code: sourceCode,
        mandi_name: entry.mandi,
        district: entry.district,
        province: SAMIS_PROVINCE,
        crop: cell.commodity,
        unit: cell.unit === PKR_PER_MAUND ? PKR_PER_MAUND : "per_maund_40kg",
        min_price_pkr: cell.minPricePkr,
        modal_price_pkr: cell.modalPricePkr,
        max_price_pkr: cell.maxPricePkr,
        observed_date: entry.observedDate,
        source_url: `${SELECTORS[sourceCode].baseUrl}${SELECTORS[sourceCode].priceListPath}`,
      });
    }
  }
  return rows;
}

export interface ScrapeSamisOptions {
  observedDate: string;
  fetchTableRows: () => Promise<Array<{ mandi: string; district: string; cells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }> }>>;
}

export async function scrapeSamis(options: ScrapeSamisOptions): Promise<IngestRow[]> {
  const raw = await options.fetchTableRows();
  const parsed: ParsedSamisRow[] = raw.map((row) =>
    parseSamisRow({
      mandi: row.mandi,
      district: row.district,
      observedDate: options.observedDate,
      rawCells: row.cells,
    }),
  );
  return toIngestRows(parsed);
}
