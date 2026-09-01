/**
 * `holiday-check.ts` — Tells the scraper whether a given (mandi, date) is
 * a pre-flagged holiday in `mandi_holidays`. Used to:
 *   1. Set `is_holiday=true` on rows for that day so the UI shows the
 *      "Mandi Closed / Market Holiday" badge (spec FR-003).
 *   2. Prevent the drift detector from false-positiving a 0-row run on
 *      a legitimate holiday (spec §Q4).
 *
 * The scraper reads `mandi_holidays` directly through `lib/db.ts` (the
 * shared Postgres client is the only allowed data path; the scraper is
 * a Node script, not the App Router, but the same client module works
 * in both contexts per Constitution IV).
 */

import { query } from "../../lib/db";

export interface HolidayLookupResult {
  isHoliday: boolean;
  label?: string;
}

export interface HolidayLookup {
  isHoliday(mandiId: string, date: string): Promise<HolidayLookupResult>;
}

/** Production lookup — reads from the shared Postgres client. */
export function createDbHolidayLookup(): HolidayLookup {
  return {
    async isHoliday(mandiId, date) {
      const rows = await query<{ label: string }>(
        `select label from mandi_holidays
         where (mandi_id = $1 or province = (
           select province from mandis where id = $1
         ))
           and date = $2
         limit 1`,
        [mandiId, date],
      );
      if (rows.length === 0) return { isHoliday: false };
      return { isHoliday: true, label: rows[0].label };
    },
  };
}

/** Conservative fallback for tests + dry-run: assume no holiday. The drift
 *  detector will then treat 0-row days as suspect, which is the safer
 *  default when the holiday table is unavailable. */
export const ALWAYS_OPEN_HOLIDAY_LOOKUP: HolidayLookup = {
  async isHoliday() {
    return { isHoliday: false };
  },
};

/** In-memory lookup for tests. */
export class StaticHolidayLookup implements HolidayLookup {
  private readonly map: Map<string, string>;
  constructor(entries: { mandiId: string; date: string; label: string }[]) {
    this.map = new Map(
      entries.map((e) => [`${e.mandiId}|${e.date}`, e.label] as const),
    );
  }
  async isHoliday(mandiId: string, date: string): Promise<HolidayLookupResult> {
    const label = this.map.get(`${mandiId}|${date}`);
    return label ? { isHoliday: true, label } : { isHoliday: false };
  }
}
