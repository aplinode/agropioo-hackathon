import { tool } from "@openai/agents";
import { z } from "zod";
import { demoPrices, demoMandi } from "@/app/(farmer)/(dashboard)/prices/demo-data";

export const getMarketPrices = tool({
  name: "get_market_prices",
  description:
    "Get current mandi (market) prices for agricultural commodities. Returns price per 40 kg (1 maund), weekly trend, and a sell/hold signal. Use this when the farmer asks about crop prices, mandi rates, or whether to sell.",
  parameters: z.object({
    crop: z.string().optional().describe("Crop name to look up (wheat, cotton, sugarcane, maize). Omit for all available prices."),
    market: z.string().optional().describe("Market/mandi name (currently only Multan available)"),
  }),
  async execute({ crop }) {
    let prices = demoPrices;

    if (crop) {
      const filtered = prices.filter(p =>
        p.crop.toLowerCase().includes(crop.toLowerCase()) ||
        p.urduName.includes(crop)
      );
      if (filtered.length > 0) prices = filtered;
    }

    if (prices.length === 0) {
      return `No price data available for "${crop}". Available crops: ${demoPrices.map(p => p.crop).join(", ")}. Mandi: ${demoMandi}.`;
    }

    return `Mandi prices at ${demoMandi}:\n${prices.map(p =>
      `• ${p.crop} (${p.urduName}): Rs ${p.pricePer40kg.toLocaleString()}/40kg (${p.direction === "up" ? "↑" : "↓"} Rs ${Math.abs(p.changeRs)} this week). Signal: ${p.signal} — ${p.signalNote}`
    ).join("\n")}\n\nNote: Prices are indicative rates and may vary at the actual mandi.`;
  },
});
