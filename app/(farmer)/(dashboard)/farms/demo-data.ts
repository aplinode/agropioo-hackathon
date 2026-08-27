/* Typed demo data for the farms feature (UI-only demo build).
   Farm records stay consistent with the dashboard's demoFarms ids. */

import type { FarmsBundle } from "./farms-bundle";

export type RecordKind =
  | "irrigation"
  | "fertilizer"
  | "pesticide"
  | "disease"
  | "harvest";

export type DemoRecord = {
  id: string;
  farmId: string;
  type: RecordKind;
  title: string;
  note: string;
  when: string;
};

export const recordTypeLabel = {
  irrigation: "Irrigation",
  fertilizer: "Fertilizer",
  pesticide: "Pesticide",
  disease: "Disease",
  harvest: "Harvest",
} as const;

/** Translated record type labels from the farms bundle. */
export function getRecordTypeLabel(
  bundle: FarmsBundle,
): Record<RecordKind, string> {
  return {
    irrigation: bundle.records.types.irrigation,
    fertilizer: bundle.records.types.fertilizer,
    pesticide: bundle.records.types.pesticide,
    disease: bundle.records.types.disease,
    harvest: bundle.records.types.harvest,
  };
}

export const demoRecords: DemoRecord[] = [
  {
    id: "rec-01",
    farmId: "farm-khalilpur",
    type: "irrigation",
    title: "Canal turn · full field",
    note: "Third canal turn of the season. Water stood well at the tail end.",
    when: "18 Aug 2026",
  },
  {
    id: "rec-02",
    farmId: "farm-khalilpur",
    type: "fertilizer",
    title: "Urea · one bag per acre",
    note: "Broadcast before the irrigation so it moves into the root zone.",
    when: "16 Aug 2026",
  },
  {
    id: "rec-03",
    farmId: "farm-khalilpur",
    type: "disease",
    title: "Yellowing spotted near the watercourse",
    note: "Small patches only. Advisor says watch for rust after the rain.",
    when: "14 Aug 2026",
  },
  {
    id: "rec-04",
    farmId: "farm-sahiwal",
    type: "irrigation",
    title: "Tube well · 6 hours",
    note: "Ran the tube well overnight for the squaring stage.",
    when: "20 Aug 2026",
  },
  {
    id: "rec-05",
    farmId: "farm-sahiwal",
    type: "pesticide",
    title: "Whitefly spray · lower leaves",
    note: "Sprayed in the morning before wind picked up. Next scan in 5 days.",
    when: "19 Aug 2026",
  },
  {
    id: "rec-06",
    farmId: "farm-sahiwal",
    type: "fertilizer",
    title: "DAP top-up on ridges",
    note: "Placed along the ridges during the earthing-up pass.",
    when: "11 Aug 2026",
  },
  {
    id: "rec-07",
    farmId: "farm-chak62",
    type: "irrigation",
    title: "Canal turn · two days standing",
    note: "Tillering needs moisture — kept the field wet through the turn.",
    when: "17 Aug 2026",
  },
  {
    id: "rec-08",
    farmId: "farm-chak62",
    type: "fertilizer",
    title: "Nitrogen split · second dose",
    note: "Half bag per acre, placed beside the sets.",
    when: "9 Aug 2026",
  },
];

export function recordsForFarm(farmId: string): DemoRecord[] {
  return demoRecords.filter((record) => record.farmId === farmId);
}
