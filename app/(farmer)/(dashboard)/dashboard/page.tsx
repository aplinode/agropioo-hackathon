import type { Metadata } from "next";
import { getAppLocale, getDashboardBundle } from "@/lib/i18n/server";
import DashboardView from "./dashboard-view";
import { requireSessionPage } from "@/lib/auth/guards";
import { getSupabase } from "@/lib/supabase";
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

  try {
    const supabase = getSupabase();
    const { data: rawFarms, error } = await supabase
      .from('farms')
      .select('*')
      .eq('account_id', session.accountId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(4);

    if (!error && rawFarms) {
      farms = await Promise.all(
        rawFarms.map(async (farm) => {
          const { data: recent } = await supabase
            .from('records')
            .select('type, event_date')
            .eq('farm_id', farm.id)
            .order('event_date', { ascending: false })
            .limit(5);

          return {
            ...farm,
            health: computeFarmHealth(farm.growth_stages as Record<string, string>, recent ?? []),
          };
        })
      );
    }
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
    />
  );
}
