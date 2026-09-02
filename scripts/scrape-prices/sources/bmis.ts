/**
 * Balochistan BMIS scraper.
 *
 * The portal at https://amisbalochistan.org/prices/ is the primary
 * source. The spec calls out a fallback at
 * https://balochistankissan.gob.pk/pages/market-rates — when the
 * primary yields no rows, we try the fallback. The parser is the only
 * piece under unit test; the Playwright launch + fallback chain is
 * exercised locally only (per Constitution "no live-network tests
 * committed"). Drift is detected by comparing today's row count
 * against the historical weekday count for bmis_balochistan.
 */

import { SELECTORS, type SourceCode } from "../selectors";
import type { IngestRow } from "../post";

export type Province = "Punjab" | "Sindh" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad" | "Gilgit-Baltistan" | "Azad Jammu & Kashmir";

export const BMIS_PROVINCE: Province = "Balochistan";
export const BMIS_SOURCE_CODE: SourceCode = "bmis_balochistan";

export interface ParsedBmisCell {
  commodity: string;
  unit: string;
  minPricePkr: number;
  modalPricePkr: number;
  maxPricePkr: number;
}

export interface ParsedBmisRow {
  mandi: string;
  district: string;
  observedDate: string;
  cells: ParsedBmisCell[];
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

export function parseBmisCell(input: {
  commodity: string;
  minPrice: string;
  modalPrice: string;
  maxPrice: string;
  unit: string;
}): ParsedBmisCell | null {
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

export function parseBmisRow(input: {
  mandi: string;
  district: string;
  observedDate: string;
  rawCells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }>;
}): ParsedBmisRow {
  const cells: ParsedBmisCell[] = [];
  for (const raw of input.rawCells) {
    const cell = parseBmisCell(raw);
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

export function toIngestRows(parsed: ParsedBmisRow[], sourceCode: SourceCode = BMIS_SOURCE_CODE, isHoliday = false): IngestRow[] {
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

export type BmisFetcher = () => Promise<Array<{ mandi: string; district: string; cells: Array<{ commodity: string; minPrice: string; modalPrice: string; maxPrice: string; unit: string }> }>>;

export interface ScrapeBmisOptions {
  observedDate: string;
  fetchPrimary: BmisFetcher;
  fetchFallback?: BmisFetcher;
}

export async function scrapeBmis(options: ScrapeBmisOptions): Promise<IngestRow[]> {
  const primaryRaw = await options.fetchPrimary();
  const primaryParsed: ParsedBmisRow[] = primaryRaw.map((row) =>
    parseBmisRow({
      mandi: row.mandi,
      district: row.district,
      observedDate: options.observedDate,
      rawCells: row.cells,
    }),
  );
  const primary = toIngestRows(primaryParsed);
  if (primary.length > 0) return primary;
  if (!options.fetchFallback) return primary;
  const fallbackRaw = await options.fetchFallback();
  const fallbackParsed: ParsedBmisRow[] = fallbackRaw.map((row) =>
    parseBmisRow({
      mandi: row.mandi,
      district: row.district,
      observedDate: options.observedDate,
      rawCells: row.cells,
    }),
  );
  return toIngestRows(fallbackParsed);
}
