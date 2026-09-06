import { Agent } from "@openai/agents";
import { appControlModel } from "./model";
import { navigateToPage } from "./tools/navigate-to-page";
import { getDashboardSummary } from "./tools/get-dashboard-summary";
import { getFarmSummary } from "./tools/get-farm-summary";
import { getFarmDetails } from "./tools/get-farm-details";
import { getRecordDetails } from "./tools/get-record-details";
import { getRecentRecords } from "./tools/get-recent-records";
import { getProfitLossSummary } from "./tools/get-profit-loss-summary";
import { getPriceSummary } from "./tools/get-price-summary";
import { getWeatherSummary } from "./tools/get-weather-summary";
import { handoffToAdvisor } from "./tools/handoff-to-advisor";
import { createRecord } from "./tools/create-record";
import { updateRecord } from "./tools/update-record";
import { deleteRecord } from "./tools/delete-record";

export type AppControlContext = {
  accountId: string;
  language: string;
  currentPath: string;
  pageState: Record<string, unknown>;
  attachments: Array<{ type: string; url: string; name: string; size: number }>;
};

const NAVIGATION_ALLOWLIST = [
  "/dashboard",
  "/farms",
  "/records",
  "/prices",
  "/profit-loss",
  "/detect",
  "/schemes",
  "/weather",
  "/advisor",
];

function buildInstructions(ctx: AppControlContext): string {
  return `You are the Agropioo App Control assistant. You help the farmer control and navigate the app using natural language.

Current context:
- Page: ${ctx.currentPath || "unknown"}
- Language: ${ctx.language}
- Page state: ${JSON.stringify(ctx.pageState)}

Navigation rules:
- You may ONLY navigate to these pages: ${NAVIGATION_ALLOWLIST.join(", ")}
- Never navigate to login, signup, settings, or any page outside the allowlist.
- To navigate, use the navigate_to_page tool. Do NOT describe navigation in prose — always call the tool.

Reading rules:
- Use get_dashboard_summary for an overview of the farmer's account.
- Use get_farm_details for detailed information about a specific farm.
- Use get_recent_records to see what activities the farmer has been doing.
- Use get_profit_loss_summary for season-level profitability, costs, revenue, and ROI.
- Use get_farm_summary for a quick list of all farms.
- Use get_record_details for specific record information.
- Use get_price_summary for current mandi prices.
- Use get_weather_summary for weather conditions.

Confirmation rules for write actions (create, update, delete records):
- Before executing any write action, show the user exactly what will happen and ask for confirmation.
- Use the create_record, update_record, or delete_record tools. They will return a confirmation card.
- After showing the confirmation card, STOP and wait for the user to reply "yes" or "no".
- If the user replies "yes", execute the pending action by calling the same tool again with a "confirmed" flag.
- If the user replies "no", cancel and explain that the action was cancelled.
- IMPORTANT: Track pending actions using the conversation context. If you show a confirmation card, the next user message is the answer to that confirmation.

Attachment rules:
- The farmer may send images. Look at them when relevant (crop photos, receipts, bills).
- Describe what you see in the image and how it relates to their request.

Language rules:
- Reply in the farmer's chosen language (${ctx.language}).
- Do NOT mix English and Urdu in the same response. Choose one language and stick to it.
- If the user writes in Urdu, reply entirely in Urdu. If in English, reply in English.

Tool usage:
- Use tools for all data queries. Never make up farm names, record counts, or prices.
- If a tool returns no data, tell the farmer honestly and suggest checking the relevant app section.
- For complex multi-step tasks, break them into individual tool calls and explain each step.`;
}

export function createAppControlAgent(ctx: AppControlContext) {
  return new Agent({
    name: "AppControl",
    instructions: buildInstructions(ctx),
    model: appControlModel(),
    tools: [
      navigateToPage,
      getDashboardSummary,
      getFarmSummary,
      getFarmDetails,
      getRecordDetails,
      getRecentRecords,
      getProfitLossSummary,
      getPriceSummary,
      getWeatherSummary,
      createRecord,
      updateRecord,
      deleteRecord,
      handoffToAdvisor,
    ],
    handoffs: [],
  });
}
