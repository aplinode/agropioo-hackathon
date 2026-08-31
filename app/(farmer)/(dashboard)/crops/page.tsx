import type { Metadata } from "next";
import { getCropsBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import CropsClient from "./crops-client";

export const metadata: Metadata = {
  title: "Crop recommendation — Agropioo",
};

export default async function CropsPage() {
  const session = await requireSessionPage();
  const bundle = await getCropsBundle();

  let farms: Array<{ id: string; name: string; location: string }> = [];
  try {
    const rows = await query<{ id: string; name: string; location: string }>(
      `SELECT id, name, location FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
      [session.accountId]
    );
    farms = rows;
  } catch {
    // farms fetch is best-effort on the landing page
  }

  return <CropsClient bundle={bundle} farms={farms} />;
}
