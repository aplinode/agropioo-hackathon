import { tool } from "@openai/agents";
import { z } from "zod";

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

export const navigateToPage = tool({
  name: "navigate_to_page",
  description:
    "Navigate the farmer to a specific page in the app. Use this when the farmer wants to go to a different section (farms, records, prices, advisor, etc.). The path must be one of the allowed pages.",
  parameters: z.object({
    path: z.string().describe("The page path to navigate to, e.g. /farms, /records, /prices"),
  }),
  async execute({ path }) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (!NAVIGATION_ALLOWLIST.includes(normalized)) {
      return `I can't navigate to "${normalized}". I can only take you to: ${NAVIGATION_ALLOWLIST.join(", ")}.`;
    }

    return JSON.stringify({
      type: "navigation_button",
      path: normalized,
      label: `Go to ${normalized.replace(/^\//, "").replace(/^\w/, (c) => c.toUpperCase())}`,
    });
  },
});
