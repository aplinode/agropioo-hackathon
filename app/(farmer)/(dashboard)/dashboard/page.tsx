import type { Metadata } from "next";
import { getAppLocale, getDashboardBundle } from "@/lib/i18n/server";
import DashboardView from "./dashboard-view";
import { requireSessionPage } from "@/lib/auth/guards";
import { query, queryOne } from "@/lib/db";
import { computeFarmHealth } from "@/lib/farms/health";
import type { WidgetCropPrice } from "@/components/prices/dashboard-prices-widget";

export const metadata: Metadata = {
  title: "Dashboard — Agropioo",
  description:
    "Today's advisory, weather, alerts, and every Agropioo tool — one screen that answers kya karoon aaj?",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const emptyView = params.view === "empty";
  const weatherOff = params.weather === "off";
  const appLocale = await getAppLocale();
  const bundle = await getDashboardBundle();

  const session = await requireSessionPage();
  let farms: Array<Record<string, unknown>> = [];
  let totalFarms = 0;

  const userRow = await queryOne<{ full_name: string }>(
    `SELECT full_name FROM users WHERE id = $1`,
    [session.accountId],
  );
  const user = {
    fullName: userRow?.full_name ?? "Farmer",
    email: session.email,
  };

  try {
    const rawFarms = await query<Record<string, unknown>>(
      `SELECT * FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 3`,
      [session.accountId]
    );

    const totalFarmsRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM farms WHERE account_id = $1 AND archived_at IS NULL`,
      [session.accountId]
    );
    totalFarms = Number(totalFarmsRow?.count ?? 0);

    farms = await Promise.all(
      rawFarms.map(async (farm) => {
        const recent = await query<{ type: string; event_date: string }>(
          `SELECT type, event_date FROM records WHERE farm_id = $1 ORDER BY event_date DESC LIMIT 5`,
          [farm.id]
        );

        return {
          ...farm,
          health: computeFarmHealth(farm.growth_stages as Record<string, string>, recent),
        };
      })
    );
  } catch (err) {
    console.error("Error fetching farms for dashboard:", err);
  }

  let widgetPrices: WidgetCropPrice[] = [];
  try {
    // Get user's tracked crops, fallback to first 3 crops by name
    const trackedRows = await query<{ crop_id: string }>(
      `SELECT crop_id FROM user_crop_preferences WHERE user_id = $1 ORDER BY display_order LIMIT 3`,
      [session.accountId],
    );
    let cropIds: string[] = trackedRows.map((r) => r.crop_id);
    if (cropIds.length === 0) {
      const fallback = await query<{ id: string }>(
        `SELECT id FROM crops ORDER BY name_en LIMIT 3`,
      );
      cropIds = fallback.map((r) => r.id);
    }

    widgetPrices = await Promise.all(
      cropIds.map(async (cropId) => {
        const localeColumn = `name_${appLocale}`;
        const nameRow = await queryOne<{ [key: string]: string }>(
          `SELECT ${localeColumn} AS name_local, name_en FROM crops WHERE id = $1`,
          [cropId],
        );

        const cropName =
          (nameRow?.name_local && nameRow.name_local.trim() !== "") ? nameRow.name_local : nameRow?.name_en ?? cropId;

        // 7 most recent daily modal prices (any mandi, average)
        const histRows = await query<{ date: string; avg_modal: number }>(
          `SELECT date::text,
                  ROUND(AVG(modal_price))::int AS avg_modal
           FROM mandi_prices
           WHERE crop_id = $1
           GROUP BY date
           ORDER BY date DESC
           LIMIT 7`,
          [cropId],
        );

        const sorted = [...histRows].reverse();
        const sparkline = sorted.map((r) => Number(r.avg_modal));
        const latest = sparkline[sparkline.length - 1] ?? 0;
        const prev = sparkline[sparkline.length - 2] ?? latest;
        const changePct = prev === 0 ? 0 : Math.round(((latest - prev) / prev) * 1000) / 10;

        return {
          crop_id: cropId,
          crop_name: cropName,
          modal_price: latest,
          change_pct: changePct,
          sparkline,
        } satisfies WidgetCropPrice;
      }),
    );
  } catch (err) {
    console.error("Error fetching dashboard prices widget data:", err);
  }

  return (
    <DashboardView
      variant={emptyView ? "empty" : "default"}
      weatherAvailable={!weatherOff}
      appLocale={appLocale}
      bundle={bundle}
      farms={farms}
      totalFarms={totalFarms}
      user={user}
      widgetPrices={widgetPrices}
    />
  );
}
