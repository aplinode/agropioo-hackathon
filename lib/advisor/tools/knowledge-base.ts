import { tool } from "@openai/agents";
import { z } from "zod";
import { query as dbQuery } from "@/lib/db";

// Local TF-IDF embedding for query vectors (384-dim)
// Matches the vectors stored by scripts/seed-knowledge-local.ts
const EMBEDDING_DIM = 384;

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2);
}

// Simplified TF-IDF: uses a basic hash-based projection instead of full vocabulary
// This is approximate but sufficient for RAG retrieval
function textToVector(text: string): number[] {
  const tokens = tokenize(text);
  const vector = new Array(EMBEDDING_DIM).fill(0);

  for (const token of tokens) {
    // Hash token to a position in the vector
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIM;
    vector[idx] += 1;
    // Also add to neighboring positions for smoother similarity
    vector[(idx + 1) % EMBEDDING_DIM] += 0.5;
    vector[(idx + EMBEDDING_DIM - 1) % EMBEDDING_DIM] += 0.5;
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += vector[i] ** 2;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) vector[i] /= norm;
  }

  return vector;
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
    let queryEmbedding: number[];
    try {
      queryEmbedding = textToVector(query);
    } catch {
      return "Knowledge base search is unavailable. Answer from your general farming knowledge and suggest the farmer consult a local extension officer for specific advice.";
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
