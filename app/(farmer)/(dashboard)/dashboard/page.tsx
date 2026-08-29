import type { Metadata } from "next";
import { getAppLocale, getDashboardBundle } from "@/lib/i18n/server";
import DashboardView from "./dashboard-view";
import { requireSessionPage } from "@/lib/auth/guards";
import { query, queryOne } from "@/lib/db";
import { computeFarmHealth } from "@/lib/farms/health";

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
      `SELECT * FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 4`,
      [session.accountId]
    );

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

  return (
    <DashboardView
      variant={emptyView ? "empty" : "default"}
      weatherAvailable={!weatherOff}
      appLocale={appLocale}
      bundle={bundle}
      farms={farms}
      user={user}
    />
  );
}
