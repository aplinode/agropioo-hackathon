import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

type RecordRow = {
  id: string;
  farm_name: string;
  type: string;
  event_date: string;
  title: string | null;
  note: string | null;
  yield_qty: string | null;
  labor_cost: string | null;
  transport_cost: string | null;
};

export const getRecentRecords = tool({
  name: "get_recent_records",
  description:
    "Get recent farming activity records for the farmer. Shows what activities they've logged recently across all farms. Use this when the farmer asks 'what have I been doing', 'show my recent activities', or 'what did I log this week'.",
  parameters: z.object({
    days: z.number().optional().describe("Number of past days to look back (default 14)"),
    farmId: z.string().optional().describe("Specific farm ID to filter by, or omit for all farms"),
    recordType: z.enum(["sowing", "planting", "irrigation", "fertilizer", "pesticide", "disease", "harvest"]).optional().describe("Filter by record type"),
  }),
  async execute({ days, farmId, recordType }) {
    const lookbackDays = days ?? 14;
    const conditions: string[] = ["r.account_id = $1", "r.event_date >= current_date - $2::int"];
    const params: (string | number)[] = ["", lookbackDays];
    let paramIdx = 3;

    if (farmId) {
      conditions.push(`r.farm_id = $${paramIdx++}`);
      params.push(farmId);
    }
    if (recordType) {
      conditions.push(`r.type = $${paramIdx++}`);
      params.push(recordType);
    }

    const sql = `SELECT r.id, f.name AS farm_name, r.type, r.event_date, r.title, r.note, r.yield_qty, r.labor_cost, r.transport_cost
      FROM records r
      JOIN farms f ON f.id = r.farm_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY r.event_date DESC, r.created_at DESC
      LIMIT 20`;

    const records = await query<RecordRow>(sql, params);

    if (records.length === 0) {
      return `No records found in the last ${lookbackDays} days${recordType ? ` of type ${recordType}` : ""}${farmId ? " for this farm" : ""}.`;
    }

    const lines = records.map((r) => {
      const parts = [`• [${r.farm_name}] ${r.title ?? r.type} (${r.type}) — ${r.event_date}`];
      if (r.note) parts.push(`: ${r.note}`);
      const costs: string[] = [];
      if (r.labor_cost) costs.push(`labor Rs ${r.labor_cost}`);
      if (r.transport_cost) costs.push(`transport Rs ${r.transport_cost}`);
      if (r.yield_qty) parts.push(` | Yield: ${r.yield_qty}`);
      if (costs.length > 0) parts.push(` | Costs: ${costs.join(", ")}`);
      return parts.join("");
    });

    return `Recent activities (last ${lookbackDays} days):\n${lines.join("\n")}`;
  },
});
