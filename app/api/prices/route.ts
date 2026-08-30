/**
 * GET /api/prices — current mandi prices for a crop near a district.
 */
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { resolveDistrictContext, haversineKm } from "@/lib/prices/proximity";
import { getAppLocale } from "@/lib/i18n/server";

export const getPricesQuerySchema = z.object({
  crop_id: z.string().optional(),
  district: z.string().optional(),
  query: z.string().optional(),
  include_bordering: z.coerce.boolean().default(true),
});

export type CurrentPriceRow = {
  mandi_id: string;
  mandi_name_en: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  crop_id: string;
  crop_name: string;
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  unit: string;
  is_holiday: boolean;
  updated_days_ago: number;
  prev_modal: number | null;
};

function cropNameColumn(locale: string): string {
  const safe = /^[a-z]{2,3}$/.test(locale) ? locale : "en";
  return `name_${safe}`;
}

export async function GET(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const parsed = getPricesQuerySchema.safeParse({
    crop_id: searchParams.get("crop_id") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    include_bordering: searchParams.get("include_bordering") ?? "true",
  });

  if (!parsed.success) {
    return errorResponse("validation_error", "Invalid query parameters", 422);
  }

  const input = parsed.data;
  const locale = await getAppLocale();
  const nameColumn = cropNameColumn(locale);

  try {
    if (input.query) {
      const prices = await query<CurrentPriceRow>(
        `select
           m.id as mandi_id, m.name_en as mandi_name_en, m.district,
           m.latitude, m.longitude,
           c.id as crop_id, c.${nameColumn} as crop_name,
           p.date, p.modal_price, p.min_price, p.max_price, p.unit, p.is_holiday,
           0 as updated_days_ago,
           lag(p.modal_price) over (partition by p.mandi_id, p.crop_id order by p.date) as prev_modal
         from mandi_prices p
         join mandis m on m.id = p.mandi_id
         join crops c on c.id = p.crop_id
         where (
           lower(m.name_en) like $1
           or lower(m.district) like $1
           or lower(c.name_en) like $1
           or lower(c.${nameColumn}) like $1
         )
         order by p.date desc, p.modal_price desc
         limit 50`,
        [`%${input.query.toLowerCase()}%`]
      );
      return jsonResponse({
        district: null,
        is_fallback_hub: false,
        prices: enrichPrices(prices, null, null),
      });
    }

    let district = input.district ?? null;
    if (!district) {
      const farm = await queryOne<{ district: string }>(
        `select district from farms where account_id = $1 and archived_at is null order by created_at desc limit 1`,
        [session.accountId]
      );
      district = farm?.district ?? null;
    }

    const context = await resolveDistrictContext(district ?? undefined);
    const districts = input.include_bordering
      ? context.searchDistricts
      : [context.district];

    const prices = await query<CurrentPriceRow>(
      `select
         m.id as mandi_id, m.name_en as mandi_name_en, m.district,
         m.latitude, m.longitude,
         c.id as crop_id, c.${nameColumn} as crop_name,
         p.date, p.modal_price, p.min_price, p.max_price, p.unit, p.is_holiday,
         current_date - p.date as updated_days_ago,
         lag(p.modal_price) over (partition by p.mandi_id, p.crop_id order by p.date) as prev_modal
       from mandi_prices p
       join mandis m on m.id = p.mandi_id
       join crops c on c.id = p.crop_id
       where m.district = any($1)
         ${input.crop_id ? "and c.id = $2" : ""}
       order by p.date desc, p.modal_price desc`,
      input.crop_id ? [districts, input.crop_id] : [districts]
    );

    const uniquePrices = dedupeLatestPricePerMandiCrop(prices);
    const enriched = enrichPrices(uniquePrices, context.farmLat, context.farmLng);

    if (enriched.length > 0) {
      const bestModal = Math.max(...enriched.map((p) => p.modal_price));
      for (const price of enriched) {
        price.is_best_price = price.modal_price === bestModal;
      }
    }

    return jsonResponse({
      district: context.district,
      is_fallback_hub: context.isFallbackHub,
      prices: enriched,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/prices error:", message);
    return errorResponse("server_error", message, 500);
  }
}

function dedupeLatestPricePerMandiCrop(rows: CurrentPriceRow[]): CurrentPriceRow[] {
  const seen = new Set<string>();
  const out: CurrentPriceRow[] = [];
  for (const row of rows) {
    const key = `${row.mandi_id}:${row.crop_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function enrichPrices(
  rows: CurrentPriceRow[],
  farmLat: number | null,
  farmLng: number | null
): Array<CurrentPriceRow & { distance_km: number | null; change_pct: number; change_pkr: number; is_best_price: boolean }> {
  return rows.map((row) => {
    const prev = row.prev_modal ? Number(row.prev_modal) : null;
    const current = Number(row.modal_price);
    const change_pkr = prev !== null ? Math.round((current - prev) * 100) / 100 : 0;
    const change_pct = prev !== null && prev > 0 ? Math.round((change_pkr / prev) * 1000) / 10 : 0;

    let distance_km: number | null = null;
    if (farmLat !== null && farmLng !== null && row.latitude !== null && row.longitude !== null) {
      distance_km = haversineKm(farmLat, farmLng, Number(row.latitude), Number(row.longitude));
    }

    return {
      ...row,
      distance_km,
      change_pct,
      change_pkr,
      is_best_price: false,
    };
  });
}
