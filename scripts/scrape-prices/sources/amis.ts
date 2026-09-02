/**
 * Punjab AMIS scraper.
 *
 * http://www.amis.pk/ViewPrices.aspx — ASP.NET GridView, server-side
 * rendered. Playwright navigates to the price list, walks the table,
 * and emits one IngestRow per (mandi × crop) intersection.
 *
 * The parser is the only piece under unit test. The Playwright launch
 * + navigation path is exercised locally only (per Constitution
 * "no live-network tests committed"). Drift is detected by comparing
 * today's row count against the historical weekday count for amis_pk
 * (see drift-detector.ts).
 */

import { SELECTORS, type SourceCode } from "../selectors";
import type { IngestRow } from "../post";

export type Province = "Punjab" | "Sindh" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad" | "Gilgit-Baltistan" | "Azad Jammu & Kashmir";

export const AMIS_PROVINCE: Province = "Punjab";
export const AMIS_SOURCE_CODE: SourceCode = "amis_pk";

export interface ParsedAmisCell {
  commodity: string;
  unit: string;
  minPricePkr: number;
  modalPricePkr: number;
  maxPricePkr: number;
}

export interface ParsedAmisRow {
  mandi: string;
  district: string;
  observedDate: string;
  cells: ParsedAmisCell[];
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

export function parseAmisCell(input: {
  commodity: string;
  minPrice: string;
  modalPrice: string;
  maxPrice: string;
  unit: string;
}): ParsedAmisCell | null {
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

export function parseAmisRow(input: {
  mandi: string;
  district: string;
  observedDate: string;
  rawCells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }>;
}): ParsedAmisRow {
  const cells: ParsedAmisCell[] = [];
  for (const raw of input.rawCells) {
    const cell = parseAmisCell(raw);
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

export function toIngestRows(parsed: ParsedAmisRow[], sourceCode: SourceCode = AMIS_SOURCE_CODE, isHoliday = false): IngestRow[] {
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

export interface ScrapeAmisOptions {
  observedDate: string;
  fetchTableRows: () => Promise<Array<{ mandi: string; district: string; cells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }> }>>;
}

export async function scrapeAmis(options: ScrapeAmisOptions): Promise<IngestRow[]> {
  const raw = await options.fetchTableRows();
  const parsed: ParsedAmisRow[] = raw.map((row) =>
    parseAmisRow({
      mandi: row.mandi,
      district: row.district,
      observedDate: options.observedDate,
      rawCells: row.cells,
    }),
  );
  return toIngestRows(parsed);
}
