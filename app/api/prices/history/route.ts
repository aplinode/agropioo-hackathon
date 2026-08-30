/**
 * GET /api/prices/history — historical modal prices for a crop at a mandi.
 */

import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { historyQuerySchema } from "@/lib/prices/api-types";

const RANGE_DAYS: Record<string, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "12M": 365,
};

export async function GET(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    crop_id: searchParams.get("crop_id") ?? undefined,
    mandi_id: searchParams.get("mandi_id") ?? undefined,
    range: searchParams.get("range") ?? "3M",
  });

  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid query parameters", 422);
  }

  const { crop_id, mandi_id, range } = parsed.data;
  const days = RANGE_DAYS[range];

  try {
    const history = await query<{ date: string; modal_price: number; min_price: number; max_price: number }>(
      `select date, modal_price, min_price, max_price
       from mandi_prices
       where crop_id = $1 and mandi_id = $2 and is_holiday = false
         and date >= current_date - ($3 || ' days')::interval
       order by date asc`,
      [crop_id, mandi_id, String(days)]
    );

    return jsonResponse({ crop_id, mandi_id, range, history: history ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/prices/history error:", message);
    return errorResponse("server_error", message, 500);
  }
}
