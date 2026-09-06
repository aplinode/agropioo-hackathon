import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

export const getFarmSummary = tool({
  name: "get_farm_summary",
  description:
    "Get a summary of the farmer's farms: names, locations, sizes, crops, and current growth stages. Use this when the farmer asks about their farms or wants an overview.",
  parameters: z.object({
    farmId: z.string().optional().describe("Specific farm ID, or omit for all farms"),
  }),
  async execute({ farmId }) {
    let sql = `SELECT id, name, location, district, acres, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`;
    const params: (string | number)[] = [""];

    if (farmId) {
      sql = `SELECT id, name, location, district, acres, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL AND id = $2 ORDER BY created_at DESC`;
      params.push(farmId);
    }

    const farms = await query<{
      id: string;
      name: string;
      location: string;
      district: string;
      acres: string;
      crops: string | string[];
      growth_stages: Record<string, string>;
    }>(sql, params);

    if (farms.length === 0) {
      return "You have no farms registered yet. You can add one from the Farms section.";
    }

    const lines = farms.map((f) => {
      const crops = Array.isArray(f.crops) ? f.crops.join(", ") : String(f.crops);
      const stages = Object.entries(f.growth_stages)
        .map(([crop, stage]) => `${crop}: ${stage}`)
        .join(", ") || "not set";
      return `• ${f.name} (${f.location}, ${f.district}): ${f.acres} acres, crops: ${crops}, stages: ${stages}`;
    });

    return `Your farms:\n${lines.join("\n")}`;
  },
});
