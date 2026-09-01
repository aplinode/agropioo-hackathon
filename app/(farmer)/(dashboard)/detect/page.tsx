import type { Metadata } from "next";
import { getDetectBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import DetectUpload from "./detect-upload";
import type { FarmOption, ScanHistoryItem } from "./detect-types";

export const metadata: Metadata = {
  title: "Detect — Agropioo",
};

const LIMIT = 20;

export default async function DetectPage() {
  const session = await requireSessionPage();
  const [bundle, rawFarms, rawScans, rawChats] = await Promise.all([
    getDetectBundle(),
    query<{ id: string; name: string; crops: unknown }>(
      `SELECT id, name, crops FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
      [session.accountId],
    ),
    query<{
      id: string;
      disease_name: string;
      confidence: number;
      severity: string;
      crop: string;
      causes: string;
      treatment_steps: unknown;
      rescan_timing: string;
      caution: string;
      image_url: string;
      created_at: string;
      farm_id: string | null;
      farm_name: string | null;
    }>(
      `SELECT ds.id, ds.disease_name, ds.confidence, ds.severity, ds.crop,
              ds.causes, ds.treatment_steps, ds.rescan_timing, ds.caution,
              ds.image_url, ds.created_at, ds.farm_id,
              f.name AS farm_name
       FROM detect_scans ds
       LEFT JOIN farms f ON f.id = ds.farm_id
       WHERE ds.account_id = $1
       ORDER BY ds.created_at DESC
       LIMIT $2`,
      [session.accountId, LIMIT],
    ),
    query<{
      id: string;
      title: string;
      scan_id: string | null;
      updated_at: string;
    }>(
      `SELECT id, title, scan_id, updated_at FROM detect_chats WHERE account_id = $1 ORDER BY updated_at DESC`,
      [session.accountId],
    ),
  ]);

  const farms: FarmOption[] = (rawFarms ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    crops: Array.isArray(f.crops)
      ? f.crops.join(", ")
      : typeof f.crops === "string"
        ? f.crops
        : String(f.crops ?? ""),
  }));

  const nextCursor =
    rawScans.length === LIMIT
      ? rawScans[rawScans.length - 1].created_at
      : null;

  const initialScans: ScanHistoryItem[] = (rawScans ?? []).map((r) => ({
    id: r.id,
    diseaseName: r.disease_name,
    confidence: Number(r.confidence),
    severity: r.severity as ScanHistoryItem["severity"],
    crop: r.crop,
    causes: r.causes,
    steps: Array.isArray(r.treatment_steps)
      ? r.treatment_steps
      : typeof r.treatment_steps === "string"
        ? JSON.parse(r.treatment_steps)
        : [],
    rescanTiming: r.rescan_timing,
    caution: r.caution,
    imageUrl: r.image_url,
    createdAt: r.created_at,
    farmId: r.farm_id,
    farmName: r.farm_name,
    saveStatus: r.farm_id ? "saved" : "not_saved",
  }));

  const initialChats: { id: string; title: string; scanId: string | null; updatedAt: string }[] = (rawChats ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    scanId: c.scan_id,
    updatedAt: c.updated_at,
  }));

  return (
    <div className="pt-1">
      <DetectUpload
        bundle={bundle}
        farms={farms}
        initialScans={initialScans}
        nextCursor={nextCursor}
        initialChats={initialChats}
      />
    </div>
  );
}
