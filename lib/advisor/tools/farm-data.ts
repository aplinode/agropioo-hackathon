import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

type FarmRow = {
  id: string;
  name: string;
  location: string;
  district: string;
  acres: string;
  crops: string | string[];
  growth_stages: Record<string, string>;
};

type RecordRow = {
  id: string;
  farm_id: string;
  farm_name: string;
  type: string;
  event_date: string;
  title: string | null;
  note: string | null;
  yield_qty: string | null;
  labor_cost: string | null;
  transport_cost: string | null;
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
  if (entries.length === 0) return "unknown";
  return entries.map(([crop, stage]) => `${crop}: ${stage}`).join(", ");
}

export function createFarmDataTools(accountId: string) {
  const getMyFarms = tool({
    name: "get_my_farms",
    description:
      "Get the farmer's registered farms with location, size, crop types, current growth stage, and health status. Use this when the farmer asks about their farms, land, fields, or 'how are my farms doing'.",
    parameters: z.object({
      farmName: z.string().optional().describe("Specific farm name to filter by, or omit for all farms"),
    }),
    async execute({ farmName }) {
      let sql = `SELECT id, name, location, district, acres, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`;
      const params: (string)[] = [accountId];

      if (farmName) {
        sql = `SELECT id, name, location, district, acres, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL AND lower(name) LIKE $2 ORDER BY created_at DESC`;
        params.push(`%${farmName.toLowerCase()}%`);
      }

      const farms = await query<FarmRow>(sql, params);

      if (farms.length === 0) {
        return farmName
          ? `No farm found matching "${farmName}". Suggest the farmer check their Farms section or add a new farm.`
          : "The farmer has no farms registered yet. Suggest they add a farm through the Farms section.";
      }

      return `Farmer's farms:\n${farms.map(f => {
        const crops = formatCrops(f.crops);
        const stage = formatGrowthStage(f.growth_stages);
        return `• ${f.name} (${f.location}, ${f.district}): ${f.acres} acres, ${crops}, current stage: ${stage}`;
      }).join("\n")}`;
    },
  });

  const getMyRecords = tool({
    name: "get_my_records",
    description:
      "Get the farmer's farm activity records — irrigation, fertilizer applications, pesticide sprays, disease observations, and harvests. Use this when the farmer asks about their farming history, what they've done, or when they last did something.",
    parameters: z.object({
      farmId: z.string().optional().describe("Specific farm ID to filter records, or omit for all farms"),
      recordType: z.enum(["sowing", "planting", "irrigation", "fertilizer", "pesticide", "disease", "harvest"]).optional().describe("Filter by record type"),
    }),
    async execute({ farmId, recordType }) {
      const conditions: string[] = ["r.account_id = $1"];
      const params: string[] = [accountId];
      let paramIdx = 2;

      if (farmId) {
        conditions.push(`r.farm_id = $${paramIdx++}`);
        params.push(farmId);
      }
      if (recordType) {
        conditions.push(`r.type = $${paramIdx++}`);
        params.push(recordType);
      }

      const sql = `SELECT r.id, r.farm_id, f.name AS farm_name, r.type, r.event_date, r.title, r.note, r.yield_qty, r.labor_cost, r.transport_cost
        FROM records r
        JOIN farms f ON f.id = r.farm_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY r.event_date DESC, r.created_at DESC
        LIMIT 50`;

      const records = await query<RecordRow>(sql, params);

      if (records.length === 0) {
        return farmId
          ? `No records found for this farm${recordType ? ` (type: ${recordType})` : ""}. The farmer may not have logged any activities yet.`
          : `No ${recordType ?? "farm"} records found. The farmer hasn't logged any activities yet.`;
      }

      return `Farm records:\n${records.map(r => {
        const parts = [`• [${r.farm_name}] ${r.title ?? r.type} (${r.type}) — ${r.event_date}`];
        if (r.note) parts.push(`: ${r.note}`);
        const costs: string[] = [];
        if (r.labor_cost) costs.push(`labor Rs ${r.labor_cost}`);
        if (r.transport_cost) costs.push(`transport Rs ${r.transport_cost}`);
        if (r.yield_qty) parts.push(` | Yield: ${r.yield_qty}`);
        if (costs.length > 0) parts.push(` | Costs: ${costs.join(", ")}`);
        return parts.join("");
      }).join("\n")}`;
    },
  });

  return { getMyFarms, getMyRecords };
}
