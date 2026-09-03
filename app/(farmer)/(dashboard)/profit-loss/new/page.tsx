import type { Metadata } from "next";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import NewSeasonClient from "./new-season-client";

export const metadata: Metadata = {
  title: "New season — Agropioo",
};

export default async function NewSeasonPage() {
  const session = await requireSessionPage();
  const [farms, crops] = await Promise.all([
    query<{ id: string; name: string }>(
      `SELECT id, name FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
      [session.accountId]
    ),
    query<{ id: string; name_en: string }>(
      `SELECT id, name_en FROM crops ORDER BY name_en`
    ),
  ]);

  return <NewSeasonClient farms={farms} crops={crops} />;
}
