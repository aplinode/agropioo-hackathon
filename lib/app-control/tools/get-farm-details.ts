import { tool } from "@openai/agents";
import { z } from "zod";
import { queryOne } from "@/lib/db";

type FarmDetailRow = {
  id: string;
  name: string;
  location: string;
  district: string;
  acres: string;
  crops: string | string[];
  growth_stages: Record<string, string>;
  soil_type: string | null;
  irrigation_method: string | null;
  primary_crop: string | null;
  sowing_date: string | null;
};

function formatCrops(crops: string | string[]): string {
  if (Array.isArray(crops)) return crops.join(", ");
  if (typeof crops === "string") {
    try {
      const parsed = JSON.parse(crops);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch { /* not JSON, use as-is */ }
  }
  return String(crops);
}

function formatGrowthStage(stages: Record<string, string>): string {
  const entries = Object.entries(stages);
  if (entries.length === 0) return "not set";
  return entries.map(([crop, stage]) => `${crop}: ${stage}`).join(", ");
}

export const getFarmDetails = tool({
  name: "get_farm_details",
  description:
    "Get detailed information about a specific farm including soil type, irrigation method, crop details, growth stages, and sowing date. Use this when the farmer asks about a specific farm's details, soil, irrigation, or crops.",
  parameters: z.object({
    farmId: z.string().describe("The farm ID to get details for"),
  }),
  async execute({ farmId }) {
    const farm = await queryOne<FarmDetailRow>(
      `SELECT id, name, location, district, acres, crops, growth_stages, soil_type, irrigation_method, primary_crop, sowing_date
       FROM farms
       WHERE id = $1 AND archived_at IS NULL`,
      [farmId]
    );

    if (!farm) {
      return "Farm not found. Please check your farm list.";
    }

    const crops = formatCrops(farm.crops);
    const stage = formatGrowthStage(farm.growth_stages);
    const soil = farm.soil_type || "not recorded";
    const irrigation = farm.irrigation_method || "not recorded";
    const sowing = farm.sowing_date || "not recorded";

    return `Farm: ${farm.name}
Location: ${farm.location}, ${farm.district}
Size: ${farm.acres} acres
Soil type: ${soil}
Irrigation: ${irrigation}
Primary crop: ${farm.primary_crop || "not set"}
Sowing date: ${sowing}
Crops: ${crops}
Growth stages: ${stage}`;
  },
});
