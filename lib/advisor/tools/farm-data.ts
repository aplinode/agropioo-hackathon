import { tool } from "@openai/agents";
import { z } from "zod";
import { demoFarms } from "@/app/(farmer)/(dashboard)/dashboard/demo-data";
import { demoRecords } from "@/app/(farmer)/(dashboard)/farms/demo-data";

export const getMyFarms = tool({
  name: "get_my_farms",
  description:
    "Get the farmer's registered farms with location, size, crop types, current growth stage, and health status. Use this when the farmer asks about their farms, land, fields, or 'how are my farms doing'.",
  parameters: z.object({
    farmName: z.string().optional().describe("Specific farm name to filter by, or omit for all farms"),
  }),
  async execute({ farmName }) {
    let farms = demoFarms;

    if (farmName) {
      farms = farms.filter(f =>
        f.name.toLowerCase().includes(farmName.toLowerCase())
      );
    }

    if (farms.length === 0) {
      return farmName
        ? `No farm found matching "${farmName}". The farmer's registered farms are: ${demoFarms.map(f => f.name).join(", ")}.`
        : "The farmer has no farms registered yet. Suggest they add a farm through the Farms section.";
    }

    return `Farmer's farms:\n${farms.map(f =>
      `• ${f.name} (${f.location}): ${f.acres} acres, ${f.crops}, sown ${f.sownOn}, current stage: ${f.stage}, health: ${f.health}`
    ).join("\n")}`;
  },
});

export const getMyRecords = tool({
  name: "get_my_records",
  description:
    "Get the farmer's farm activity records — irrigation, fertilizer applications, pesticide sprays, disease observations, and harvests. Use this when the farmer asks about their farming history, what they've done, or when they last did something.",
  parameters: z.object({
    farmId: z.string().optional().describe("Specific farm ID to filter records, or omit for all farms"),
    recordType: z.enum(["irrigation", "fertilizer", "pesticide", "disease", "harvest"]).optional().describe("Filter by record type"),
  }),
  async execute({ farmId, recordType }) {
    let records = demoRecords;

    if (farmId) {
      records = records.filter(r => r.farmId === farmId);
    }

    if (recordType) {
      records = records.filter(r => r.type === recordType);
    }

    if (records.length === 0) {
      return farmId
        ? `No records found for this farm${recordType ? ` (type: ${recordType})` : ""}. The farmer may not have logged any activities yet.`
        : `No ${recordType ?? "farm"} records found. The farmer hasn't logged any activities yet.`;
    }

    const farmMap = new Map(demoFarms.map(f => [f.id, f.name]));

    return `Farm records:\n${records.map(r =>
      `• [${farmMap.get(r.farmId) ?? r.farmId}] ${r.title} (${r.type}) — ${r.when}: ${r.note}`
    ).join("\n")}`;
  },
});
