import type { Metadata } from "next";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { getSatelliteBundle } from "@/lib/i18n/server";
import SatelliteView from "./satellite-view";
import type { FarmOption } from "./satellite-types";

export const metadata: Metadata = {
  title: "Field monitoring — Agropioo",
};

export default async function SatellitePage() {
  const session = await requireSessionPage();
  const bundle = await getSatelliteBundle();

  const farms = await query<{ id: string; name: string; lat: number; lng: number; district: string }>(
    `SELECT id, name, lat, lng, district FROM farms
     WHERE account_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [session.accountId],
  );

  const farmOptions: FarmOption[] = (farms ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    lat: Number(f.lat),
    lng: Number(f.lng),
    district: f.district ?? "",
  }));

  return <SatelliteView bundle={bundle} farms={farmOptions} />;
}
