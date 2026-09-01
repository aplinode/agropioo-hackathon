import type { Pool } from "pg";
import { query } from "../../lib/db";

export type HolidaySource = "amis_pk" | "samis_pk" | "fmis_kp" | "bmis_balochistan" | "pbs_spi";

export interface HolidayLookup {
  isHoliday(source: HolidaySource, date: string): Promise<boolean>;
}

interface HolidayRow {
  source: string;
  holiday_date: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function createDbHolidayLookup(_pool: Pool | null = null): HolidayLookup {
  return {
    async isHoliday(source, date) {
      if (!DATE_RE.test(date)) return false;
      const rows = await query<HolidayRow>(
        "SELECT source, holiday_date::text FROM mandi_holidays WHERE source = $1 AND holiday_date = $2 LIMIT 1",
        [source, date],
      );
      return rows.length > 0;
    },
  };
}

const staticDates: Record<HolidaySource, ReadonlySet<string>> = {
  amis_pk: new Set(),
  samis_pk: new Set(),
  fmis_kp: new Set(),
  bmis_balochistan: new Set(),
  pbs_spi: new Set(),
};

export class StaticHolidayLookup implements HolidayLookup {
  constructor(seed: Partial<Record<HolidaySource, string[]>> = {}) {
    for (const [src, dates] of Object.entries(seed) as [HolidaySource, string[]][]) {
      staticDates[src] = new Set(dates);
    }
  }

  async isHoliday(source: HolidaySource, date: string): Promise<boolean> {
    if (!DATE_RE.test(date)) return false;
    return staticDates[source].has(date);
  }
}

export const ALWAYS_OPEN_HOLIDAY_LOOKUP: HolidayLookup = {
  async isHoliday() {
    return false;
  },
};
