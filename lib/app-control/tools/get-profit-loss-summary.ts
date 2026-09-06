import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

type ProfitLossRow = {
  id: string;
  crop_name: string;
  farm_name: string;
  season: string;
  year: string;
  acres: number;
  status: string;
  total_actual_cost: number;
  total_projected_cost: number;
  actual_yield: number;
  actual_price: number;
};

export const getProfitLossSummary = tool({
  name: "get_profit_loss_summary",
  description:
    "Get a profit/loss summary for the farmer's seasons. Shows costs, revenue, net profit/loss, and ROI for each season. Use this when the farmer asks about profits, losses, earnings, ROI, or financial performance.",
  parameters: z.object({
    farmId: z.string().optional().describe("Specific farm ID to filter by, or omit for all farms"),
    season: z.string().optional().describe("Season name filter, e.g. 'Rabi' or 'Kharif'"),
    limit: z.number().optional().describe("Max seasons to return (default 10)"),
  }),
  async execute({ farmId, season, limit }) {
    const max = limit ?? 10;
    const conditions: string[] = ["s.account_id = $1", "s.archived_at IS NULL"];
    const params: (string | number)[] = [""];
    let paramIdx = 2;

    if (farmId) {
      conditions.push(`s.farm_id = $${paramIdx++}`);
      params.push(farmId);
    }
    if (season) {
      conditions.push(`s.season ILIKE $${paramIdx++}`);
      params.push(`%${season}%`);
    }

    const sql = `SELECT s.id, c.name_en as crop_name, f.name as farm_name, s.season, s.year, s.acres, s.status,
             COALESCE(SUM(e.amount), 0) as total_actual_cost,
             COALESCE(SUM(pc.total_projected_pkr), 0) as total_projected_cost,
             COALESCE(s.actual_yield, 0) as actual_yield,
             COALESCE(s.actual_price, 0) as actual_price
        FROM seasons s
        JOIN farms f ON f.id = s.farm_id
        JOIN crops c ON c.id = s.crop_id
        LEFT JOIN expenses e ON e.season_id = s.id
        LEFT JOIN projected_costs pc ON pc.season_id = s.id
       WHERE ${conditions.join(" AND ")}
       GROUP BY s.id, c.name_en, f.name, s.season, s.year, s.acres, s.status, s.actual_yield, s.actual_price
       ORDER BY s.created_at DESC
       LIMIT $${paramIdx}`;
    params.push(max);

    const rows = await query<ProfitLossRow>(sql, params);

    if (rows.length === 0) {
      return `No seasons found${farmId ? " for this farm" : ""}${season ? ` matching "${season}"` : ""}. Start tracking a season from the Profit/Loss page.`;
    }

    const lines = rows.map((r) => {
      const revenue = Number(r.actual_price);
      const cost = Number(r.total_actual_cost);
      const net = revenue - cost;
      const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
      const profitLoss = net >= 0 ? `Profit: PKR ${net.toLocaleString("en-PK")}` : `Loss: PKR ${Math.abs(net).toLocaleString("en-PK")}`;
      return `• [${r.farm_name}] ${r.crop_name} (${r.season} ${r.year}): ${profitLoss}, ROI: ${roi.toFixed(1)}% (${r.acres} acres)`;
    });

    return `Profit/Loss summary:\n${lines.join("\n")}`;
  },
});
