import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";

type ConversationRow = {
  title: string;
  summary: string;
  updated_at: string;
};

export function createConversationMemoryTool(accountId: string) {
  return tool({
    name: "search_past_conversations",
    description:
      "Search the farmer's past advisor conversations by topic. Returns conversation titles, dates, and summaries. Use this when the farmer references something discussed before, or when context from a previous conversation would help.",
    parameters: z.object({
      query: z.string().describe("Topic or keyword to search for in past conversations"),
    }),
    async execute({ query: searchQuery }) {
      const rows = await query<ConversationRow>(
        `SELECT title, summary, updated_at
         FROM advisor_conversations
         WHERE account_id = $1
           AND summary IS NOT NULL
           AND summary ILIKE $2
         ORDER BY updated_at DESC
         LIMIT 5`,
        [accountId, `%${searchQuery}%`],
      );

      if (rows.length === 0) {
        return `No past conversations found matching "${searchQuery}".`;
      }

      return `Past conversations:\n${rows.map(r => {
        const date = new Date(r.updated_at).toLocaleDateString("en-PK", {
          year: "numeric", month: "short", day: "numeric",
        });
        return `• "${r.title}" (${date}): ${r.summary}`;
      }).join("\n")}`;
    },
  });
}
