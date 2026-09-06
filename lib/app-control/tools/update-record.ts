import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

export const updateRecord = tool({
  name: "update_record",
  description:
    "Update an existing farm activity record. ALWAYS show the farmer exactly what will change and ask for confirmation BEFORE updating. Wait for the user to reply 'yes' or 'no'.",
  parameters: z.object({
    recordId: z.string().describe("Record ID to update"),
    farmId: z.string().optional().describe("New farm ID"),
    type: z.enum(["sowing", "planting", "irrigation", "fertilizer", "pesticide", "disease", "harvest"]).optional().describe("New record type"),
    eventDate: z.string().optional().describe("New date (YYYY-MM-DD)"),
    title: z.string().optional().describe("New title"),
    note: z.string().optional().describe("New note"),
    yieldQty: z.string().optional().describe("New yield quantity"),
    laborCost: z.string().optional().describe("New labor cost"),
    transportCost: z.string().optional().describe("New transport cost"),
    confirmed: z.boolean().optional().describe("Set to true only after the user confirms with 'yes'"),
  }),
  async execute({ recordId, farmId, type, eventDate, title, note, yieldQty, laborCost, transportCost, confirmed }) {
    const existing = await queryOne<{ id: string; farm_id: string; type: string; event_date: string; title: string | null; note: string | null; yield_qty: string | null; labor_cost: string | null; transport_cost: string | null }>(
      `SELECT id, farm_id, type, event_date, title, note, yield_qty, labor_cost, transport_cost FROM records WHERE id = $1`,
      [recordId]
    );

    if (!existing) {
      return "Record not found.";
    }

    if (!confirmed) {
      const changes: string[] = [];
      if (farmId && farmId !== existing.farm_id) changes.push(`farm_id: ${existing.farm_id} → ${farmId}`);
      if (type && type !== existing.type) changes.push(`type: ${existing.type} → ${type}`);
      if (eventDate && eventDate !== existing.event_date) changes.push(`date: ${existing.event_date} → ${eventDate}`);
      if (title !== undefined && title !== existing.title) changes.push(`title: "${existing.title}" → "${title}"`);
      if (note !== undefined && note !== existing.note) changes.push(`note: "${existing.note}" → "${note}"`);
      if (yieldQty !== undefined && yieldQty !== existing.yield_qty) changes.push(`yield: ${existing.yield_qty} → ${yieldQty}`);
      if (laborCost !== undefined && laborCost !== existing.labor_cost) changes.push(`labor cost: Rs ${existing.labor_cost} → Rs ${laborCost}`);
      if (transportCost !== undefined && transportCost !== existing.transport_cost) changes.push(`transport cost: Rs ${existing.transport_cost} → Rs ${transportCost}`);

      if (changes.length === 0) {
        return "No changes detected. Please specify what you want to update.";
      }

      return JSON.stringify({
        type: "confirmation",
        action: "update_record",
        message: `Update record ${recordId}:\n• ${changes.join("\n• ")}\n\nDo you want to apply these changes? Reply yes or no.`,
        data: { recordId, farmId, type, eventDate, title, note, yieldQty, laborCost, transportCost },
      });
    }

    const sets: string[] = [];
    const vals: (string | number)[] = [recordId];
    let idx = 2;

    if (farmId) { sets.push(`farm_id = $${idx++}`); vals.push(farmId); }
    if (type) { sets.push(`type = $${idx++}`); vals.push(type); }
    if (eventDate) { sets.push(`event_date = $${idx++}`); vals.push(eventDate); }
    if (title !== undefined) { sets.push(`title = $${idx++}`); vals.push(title); }
    if (note !== undefined) { sets.push(`note = $${idx++}`); vals.push(note); }
    if (yieldQty !== undefined) { sets.push(`yield_qty = $${idx++}`); vals.push(yieldQty); }
    if (laborCost !== undefined) { sets.push(`labor_cost = $${idx++}`); vals.push(laborCost); }
    if (transportCost !== undefined) { sets.push(`transport_cost = $${idx++}`); vals.push(transportCost); }

    if (sets.length === 0) {
      return "No fields to update.";
    }

    await query(`UPDATE records SET ${sets.join(", ")} WHERE id = $1`, vals);
    return `Record ${recordId} updated successfully.`;
  },
});
