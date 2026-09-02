/**
 * PBS Weekly SPI XLSX scraper (federal cross-check).
 *
 * The Pakistan Bureau of Statistics publishes a weekly SPI XLSX at
 * https://www.pbs.gov.pk/price-statistics/. We use the `xlsx` package
 * to read the workbook and emit IngestRow[] as a federal-level
 * cross-check on the four provincial portals. The result is expected
 * to be sparse (one row per national item, not per mandi) — that's
 * fine, the drift detector allows zero rows for sources that
 * legitimately have no mandi-level granularity.
 *
 * The parser is the only piece under unit test (the xlsx → JS-row
 * step uses a small in-memory fixture workbook). The download
 * itself is exercised locally only (per Constitution "no
 * live-network tests committed"). Drift is detected by comparing
 * today's row count against the historical weekday count for pbs_spi.
 */

import { SELECTORS, type SourceCode } from "../selectors";
import type { IngestRow } from "../post";

export type Province = "Punjab" | "Sindh" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad" | "Gilgit-Baltistan" | "Azad Jammu & Kashmir";

export const SPI_PROVINCE: Province = "Islamabad";
export const SPI_SOURCE_CODE: SourceCode = "pbs_spi";

export interface ParsedSpiRow {
  mandi: string;
  district: string;
  commodity: string;
  unit: string;
  minPricePkr: number;
  modalPricePkr: number;
  maxPricePkr: number;
}

const PKR_PER_MAUND = "per_maund_40kg";

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeUnit(raw: unknown): string {
  if (typeof raw !== "string") return PKR_PER_MAUND;
  const u = raw.trim().toLowerCase();
  if (!u) return PKR_PER_MAUND;
  if (u.includes("maund") || u.includes("40")) return PKR_PER_MAUND;
  if (u.includes("100")) return "per_100kg";
  if (u.includes("kg")) return "per_kg";
  return u.replace(/\s+/g, "_");
}

export function parseSpiRow(input: {
  mandi: unknown;
  district: unknown;
  commodity: unknown;
  unit: unknown;
  minPrice: unknown;
  modalPrice: unknown;
  maxPrice: unknown;
}): ParsedSpiRow | null {
  const min = asNumber(input.minPrice);
  const modal = asNumber(input.modalPrice);
  const max = asNumber(input.maxPrice);
  if (min === null || modal === null || max === null) return null;
  const commodity = typeof input.commodity === "string" ? input.commodity.trim() : "";
  if (!commodity) return null;
  const mandi = typeof input.mandi === "string" ? input.mandi.trim() : "";
  const district = typeof input.district === "string" ? input.district.trim() : "";
  if (!mandi || !district) return null;
  return {
    mandi,
    district,
    commodity,
    unit: normalizeUnit(input.unit),
    minPricePkr: min,
    modalPricePkr: modal,
    maxPricePkr: max,
  };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function toIngestRows(parsed: ParsedSpiRow[], observedDate: string, sourceCode: SourceCode = SPI_SOURCE_CODE, isHoliday = false): IngestRow[] {
  const rows: IngestRow[] = [];
  for (const entry of parsed) {
    rows.push({
      mandi_external_id: `${sourceCode}-${slugify(entry.mandi)}`,
      crop_external_id: slugify(entry.commodity),
      date: observedDate,
      modal_price: entry.modalPricePkr,
      min_price: entry.minPricePkr,
      max_price: entry.maxPricePkr,
      unit: "Maund",
      is_holiday: isHoliday,
    });
  }
  return rows;
}

export interface SpiSheetRow {
  mandi: unknown;
  district: unknown;
  commodity: unknown;
  unit: unknown;
  minPrice: unknown;
  modalPrice: unknown;
  maxPrice: unknown;
}

export interface ParseSpiWorkbookInput {
  rows: SpiSheetRow[];
  observedDate: string;
}

export function parseSpiWorkbook(input: ParseSpiWorkbookInput): IngestRow[] {
  const parsed: ParsedSpiRow[] = [];
  for (const row of input.rows) {
    const p = parseSpiRow(row);
    if (p) parsed.push(p);
  }
  return toIngestRows(parsed, input.observedDate);
}

export interface ScrapeSpiOptions {
  observedDate: string;
  fetchWorkbook: () => Promise<ArrayBuffer | null>;
  readWorkbook: (data: ArrayBuffer) => SpiSheetRow[];
}

export async function scrapeSpi(options: ScrapeSpiOptions): Promise<IngestRow[]> {
  const data = await options.fetchWorkbook();
  if (!data) return [];
  const rows = options.readWorkbook(data);
  return parseSpiWorkbook({ rows, observedDate: options.observedDate });
}
