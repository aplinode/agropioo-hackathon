import { tool } from "@openai/agents";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

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
    const supabase = getSupabase();
    const openai = getOpenAI();
    const embeddingModel = process.env.ADVISOR_EMBEDDING_MODEL ?? "text-embedding-3-small";

    // Generate embedding for the query
    const embedResponse = await openai.embeddings.create({
      model: embeddingModel,
      input: query,
    });

    const queryEmbedding = embedResponse.data[0].embedding;

    // Search via Supabase RPC
    const { data, error } = await supabase.rpc("advisor_search_similar", {
      query_embedding: queryEmbedding,
      match_count: 5,
      match_threshold: 0.4,
    });

    if (error) {
      return `Knowledge base search error: ${error.message}. Falling back to general farming knowledge.`;
    }

    if (!data || data.length === 0) {
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
