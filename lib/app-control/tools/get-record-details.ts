import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

export const getRecordDetails = tool({
  name: "get_record_details",
  description:
    "Get details of farm activity records. Use this when the farmer asks what activities they've logged, when they last irrigated, sprayed, or harvested.",
  parameters: z.object({
    farmId: z.string().optional().describe("Specific farm ID, or omit for all farms"),
    recordType: z
      .enum(["sowing", "planting", "irrigation", "fertilizer", "pesticide", "disease", "harvest"])
      .optional()
      .describe("Filter by record type"),
    limit: z.number().optional().describe("Max records to return (default 20)"),
  }),
  async execute({ farmId, recordType, limit }) {
    const max = limit ?? 20;
    const conditions: string[] = ["r.account_id = $1"];
    const params: (string | number)[] = [""];
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
      LIMIT $${paramIdx}`;
    params.push(max);

    const records = await query<{
      id: string;
      farm_name: string;
      type: string;
      event_date: string;
      title: string | null;
      note: string | null;
      yield_qty: string | null;
      labor_cost: string | null;
      transport_cost: string | null;
    }>(sql, params);

    if (records.length === 0) {
      return `No records found${farmId ? " for this farm" : ""}${recordType ? ` of type ${recordType}` : ""}.`;
    }

    const lines = records.map((r) => {
      const parts = [`• [${r.farm_name}] ${r.title ?? r.type} on ${r.event_date}`];
      if (r.note) parts.push(`: ${r.note}`);
      const costs: string[] = [];
      if (r.labor_cost) costs.push(`labor Rs ${r.labor_cost}`);
      if (r.transport_cost) costs.push(`transport Rs ${r.transport_cost}`);
      if (r.yield_qty) parts.push(` | Yield: ${r.yield_qty}`);
      if (costs.length > 0) parts.push(` | Costs: ${costs.join(", ")}`);
      return parts.join("");
    });

    return `Recent farm records:\n${lines.join("\n")}`;
  },
});
