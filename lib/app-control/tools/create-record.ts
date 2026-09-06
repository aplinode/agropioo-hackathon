import { tool } from "@openai/agents";
import { z } from "zod";

export const createRecord = tool({
  name: "create_record",
  description:
    "Create a new farm activity record (sowing, irrigation, fertilizer, pesticide, disease, harvest). ALWAYS show the farmer what will be created and ask for confirmation BEFORE creating. Wait for the user to reply 'yes' or 'no'.",
  parameters: z.object({
    farmId: z.string().describe("Farm ID"),
    type: z.enum(["sowing", "planting", "irrigation", "fertilizer", "pesticide", "disease", "harvest"]).describe("Record type"),
    eventDate: z.string().describe("Date of the activity (YYYY-MM-DD)"),
    title: z.string().optional().describe("Short title for the record"),
    note: z.string().optional().describe("Additional notes"),
    yieldQty: z.string().optional().describe("Yield quantity with unit, e.g. '500 kg'"),
    laborCost: z.string().optional().describe("Labor cost in PKR"),
    transportCost: z.string().optional().describe("Transport cost in PKR"),
    confirmed: z.boolean().optional().describe("Set to true only after the user confirms with 'yes'"),
  }),
  async execute({ farmId, type, eventDate, title, note, yieldQty, laborCost, transportCost, confirmed }) {
    if (!confirmed) {
      const summary = [
        `Create a new ${type} record:`,
        `• Farm ID: ${farmId}`,
        `• Date: ${eventDate}`,
        title ? `• Title: ${title}` : null,
        note ? `• Note: ${note}` : null,
        yieldQty ? `• Yield: ${yieldQty}` : null,
        laborCost ? `• Labor cost: Rs ${laborCost}` : null,
        transportCost ? `• Transport cost: Rs ${transportCost}` : null,
      ].filter(Boolean).join("\n");

      return JSON.stringify({
        type: "confirmation",
        action: "create_record",
        message: `${summary}\n\nDo you want to create this record? Reply yes or no.`,
        data: { farmId, type, eventDate, title, note, yieldQty, laborCost, transportCost },
      });
    }

    const sql = `INSERT INTO records (account_id, farm_id, type, event_date, title, note, yield_qty, labor_cost, transport_cost)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`;
    const row = await query<{ id: string }>(sql, [
      "",
      farmId,
      type,
      eventDate,
      title ?? null,
      note ?? null,
      yieldQty ?? null,
      laborCost ?? null,
      transportCost ?? null,
    ]);

    return `Record created successfully (ID: ${row[0]?.id ?? "unknown"}). You can view it in the Records section.`;
  },
});
