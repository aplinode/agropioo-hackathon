import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getDictionary } from "@/lib/i18n/server";
import type { CatalogKey } from "@/catalog";
import { getForecast } from "@/lib/weather/openweather";
import { runAlertScan } from "@/lib/weather/alerts";

/* POST /api/weather/alerts/trigger — internal cron endpoint. Scans every active
   farm's near-term forecast and enqueues alerts. Protected by ADVISOR_CRON_SECRET,
   not a user session (contract §"POST /api/weather/alerts/trigger"). */
export async function POST(request: Request) {
  const secret = process.env.ADVISOR_CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return errorResponse("unauthorized", "Unauthorized", 401);
  }

  try {
    const dict = await getDictionary("en");
    const t = dict.t;
    const resolve = (key: string) => t(key as CatalogKey).text;

    const farms = await query<{
      id: string;
      account_id: string;
      name: string;
      lat: number;
      lng: number;
      email: string | null;
    }>(
      `SELECT f.id, f.account_id, f.name, f.lat, f.lng, u.email
       FROM farms f JOIN users u ON u.id = f.account_id
       WHERE f.archived_at IS NULL AND f.primary_crop IS NOT NULL`,
    );

    let scanned = 0;
    let alertsCreated = 0;
    for (const farm of farms ?? []) {
      const forecast = await getForecast(Number(farm.lat), Number(farm.lng));
      if (!forecast) continue;
      scanned += 1;
      const created = await runAlertScan(
        { farm_id: farm.id, account_id: farm.account_id, farm_name: farm.name },
        forecast,
        resolve,
        farm.email,
      );
      alertsCreated += created.length;
    }

    return jsonResponse({ scanned, alerts_created: alertsCreated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
