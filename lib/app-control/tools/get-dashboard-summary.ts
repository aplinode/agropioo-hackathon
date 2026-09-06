import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

export const getDashboardSummary = tool({
  name: "get_dashboard_summary",
  description:
    "Get a quick summary of the farmer's dashboard: farm count, recent records count, upcoming season tasks, and any alerts. Use this when the farmer asks 'what's on my dashboard', 'show my overview', or 'what do I need to do today'.",
  parameters: z.object({}),
  async execute() {
    const farms = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM farms WHERE account_id = $1 AND archived_at IS NULL`,
      [""]
    );

    const recentRecords = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM records WHERE account_id = $1 AND event_date >= current_date - 7`,
      [""]
    );

    const alerts = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM weather_alerts WHERE account_id = $1 AND read_at IS NULL AND dismissed_at IS NULL`,
      [""]
    );

    const farmCount = Number(farms[0]?.count ?? "0");
    const recordsCount = Number(recentRecords[0]?.count ?? "0");
    const alertsCount = Number(alerts[0]?.count ?? "0");

    return `Dashboard summary:
• Farms registered: ${farmCount}
• Activities logged this week: ${recordsCount}
• Unread alerts: ${alertsCount}

${alertsCount > 0 ? "You have unread alerts — check the notifications bell." : "No new alerts."}
${recordsCount === 0 ? "No recent activity — consider logging irrigation, spraying, or harvesting." : ""}`;
  },
});
