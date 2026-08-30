import OpenAI from "openai";
import { tool } from "@openai/agents";
import { z } from "zod";
import { query as dbQuery } from "@/lib/db";

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

// Query embeddings are generated locally via Ollama so they match the vectors
// stored by scripts/seed-knowledge.ts (same model + dimension as the table).
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

export const searchKnowledgeBase = tool({
  name: "search_knowledge_base",
  description:
    "Search the farming knowledge base for verified information about crop diseases, agronomy practices, fertilizer schedules, and government schemes. Use this for any farming question that needs expert-verified answers. Returns the most relevant articles and passages.",
  parameters: z.object({
    query: z.string().describe("The farming question or topic to search for, in English"),
    cropType: z.string().optional().describe("Filter by crop type (wheat, cotton, rice, sugarcane, maize)"),
    category: z.enum(["disease", "agronomy", "fertilizer", "scheme", "general"]).optional().describe("Filter by category"),
  }),
  async execute({ query, cropType, category }) {
    let queryEmbedding: number[];
    try {
      const embedRes = await fetch(`${OLLAMA_HOST}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: [query] }),
      });
      if (!embedRes.ok) throw new Error(`ollama embed ${embedRes.status}`);
      const json = (await embedRes.json()) as { embeddings: number[][] };
      queryEmbedding = json.embeddings[0];
    } catch {
      return "Knowledge base search is unavailable (local embedding model not reachable). Answer from your general farming knowledge and suggest the farmer consult a local extension officer for specific advice.";
    }

    // Search via Postgres function
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    const data = await dbQuery<{
      content: string;
      document_title: string;
      crop_type: string | null;
      category: string;
      source: string | null;
      similarity: number;
    }>(
      `SELECT * FROM advisor_search_similar($1::vector, $2, $3)`,
      [vectorLiteral, 5, 0.4]
    );

    if (data.length === 0) {
      return "No relevant information found in the knowledge base for this query. Suggest the farmer consult a local extension officer for this specific question.";
    }

    // Filter by crop type and category if specified
    let results = data as Array<{
      content: string;
      document_title: string;
      crop_type: string | null;
      category: string;
      source: string | null;
      similarity: number;
    }>;

    if (cropType) {
      const filtered = results.filter(r => r.crop_type === cropType);
      if (filtered.length > 0) results = filtered;
    }

    if (category) {
      const filtered = results.filter(r => r.category === category);
      if (filtered.length > 0) results = filtered;
    }

    const formatted = results.map(r => {
      let header = `## ${r.document_title}`;
      if (r.source) header += ` (Source: ${r.source})`;
      return `${header}\n${r.content}`;
    }).join("\n\n---\n\n");

    return `Knowledge base results (use ONLY this information for your response):\n\n${formatted}`;
  },
});
