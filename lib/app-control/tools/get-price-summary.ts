import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

export const getPriceSummary = tool({
  name: "get_price_summary",
  description:
    "Get current mandi (market) prices for crops. Use this when the farmer asks about prices, rates, or whether to sell.",
  parameters: z.object({
    crop: z.string().optional().describe("Crop name (e.g. wheat, cotton, rice)"),
    market: z.string().optional().describe("Market/mandi name"),
  }),
  async execute({ crop, market }) {
    const rows = await query<{
      crop_name: string;
      mandi_name: string;
      modal_price: number;
      min_price: number;
      max_price: number;
      date: string;
    }>(`
      select distinct on (p.crop_id, p.mandi_id)
             c.name_en as crop_name,
             m.name_en as mandi_name,
             p.modal_price,
             p.min_price,
             p.max_price,
             p.date
      from mandi_prices p
      join crops c on c.id = p.crop_id
      join mandis m on m.id = p.mandi_id
      where ($1::text is null or c.name_en ilike '%' || $1 || '%')
        and ($2::text is null or m.name_en ilike '%' || $2 || '%')
      order by p.crop_id, p.mandi_id, p.date desc
      limit 20
    `, [crop ?? null, market ?? null]);

    if (rows.length === 0) {
      return `No current mandi price data found${crop ? ` for "${crop}"` : ""}${market ? ` at "${market}"` : ""}.`;
    }

    const lines = rows.map((r) => {
      const price = Number(r.modal_price).toLocaleString("en-PK");
      const min = Number(r.min_price).toLocaleString("en-PK");
      const max = Number(r.max_price).toLocaleString("en-PK");
      return `• ${r.crop_name} at ${r.mandi_name}: Rs ${price}/maund (Rs ${min}–${max}, ${r.date})`;
    });

    return `Current mandi prices:\n${lines.join("\n")}`;
  },
});
