import { tool } from "@openai/agents";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";

export function createDeleteRecordTool(accountId: string) {
  return tool({
    name: "delete_record",
    description:
      "Delete a farm activity record permanently. ALWAYS confirm with the farmer before deleting. Wait for the user to reply 'yes' or 'no'.",
    parameters: z.object({
      recordId: z.string().describe("Record ID to delete"),
      confirmed: z.boolean().optional().describe("Set to true only after the user confirms with 'yes'"),
    }),
    async execute({ recordId, confirmed }) {
      const existing = await queryOne<{ id: string; type: string; event_date: string }>(
        `SELECT id, type, event_date FROM records WHERE id = $1 AND account_id = $2`,
        [recordId, accountId]
      );

      if (!existing) {
        return "Record not found or does not belong to you. Please check your records.";
      }

      if (!confirmed) {
        return JSON.stringify({
          type: "confirmation",
          action: "delete_record",
          message: `Delete this record permanently?\n• Type: ${existing.type}\n• Date: ${existing.event_date}\n• ID: ${recordId}\n\nThis cannot be undone. Reply yes or no.`,
          data: { recordId },
        });
      }

      await query(`DELETE FROM records WHERE id = $1 AND account_id = $2`, [recordId, accountId]);
      return `Record ${recordId} has been deleted.`;
    },
  });
}