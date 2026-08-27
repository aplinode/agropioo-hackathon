/**
 * Seeds the advisor knowledge base: reads markdown articles from
 * data/advisor-knowledge/, chunks them, embeds via OpenAI, and
 * inserts into Supabase advisor_knowledge_documents + advisor_knowledge_chunks.
 *
 * Idempotent: deletes existing advisor KB rows before re-seeding.
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 * Run: node --experimental-strip-types --env-file-if-exists=.env scripts/seed-knowledge.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { getSupabaseAdmin } from "../lib/supabase.ts";

const KB_DIR = join(import.meta.dirname, "..", "data", "advisor-knowledge");
const EMBEDDING_MODEL = process.env.ADVISOR_EMBEDDING_MODEL ?? "text-embedding-3-small";
const CHUNK_SIZE = 800; // approximate token target per chunk
const CHUNK_OVERLAP = 80; // approximate token overlap

interface Article {
  filename: string;
  title: string;
  content: string;
  cropType: string | null;
  category: "disease" | "agronomy" | "fertilizer" | "scheme" | "general";
}

function detectCategory(filename: string, content: string): Article["category"] {
  const name = filename.toLowerCase();
  if (name === "schemes" || name === "schemes.md") return "scheme";
  if (content.includes("# Government") || content.includes("# Scheme")) return "scheme";
  return "agronomy"; // default for crop guides
}

function detectCropType(filename: string): string | null {
  const name = basename(filename, extname(filename)).toLowerCase();
  const cropMap: Record<string, string> = {
    wheat: "wheat",
    cotton: "cotton",
    rice: "rice",
    sugarcane: "sugarcane",
    maize: "maize",
  };
  return cropMap[name] ?? null;
}

function splitIntoChunks(text: string): string[] {
  const sections = text.split(/\n(?=#{1,3}\s)/);
  const chunks: string[] = [];
  let current = "";

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      const overlap = current.slice(-CHUNK_OVERLAP);
      current = overlap + "\n\n" + trimmed;
    } else {
      current = current ? current + "\n\n" + trimmed : trimmed;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

async function embedChunks(chunks: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY. Add it to .env, then re-run.");
    process.exit(1);
  }

  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`  Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)...`);

    const response = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Embedding API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    for (const item of data.data) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}

async function main() {
  console.log("=== Advisor Knowledge Base Seeder ===\n");

  // 1. Read markdown files
  const files = (await readdir(KB_DIR)).filter(f => f.endsWith(".md"));
  if (files.length === 0) {
    console.error(`No .md files found in ${KB_DIR}`);
    process.exit(1);
  }
  console.log(`Found ${files.length} article(s): ${files.join(", ")}\n`);

  const articles: Article[] = [];
  for (const file of files) {
    const content = await readFile(join(KB_DIR, file), "utf-8");
    const titleMatch = content.match(/^#\s+(.+)$/m);
    articles.push({
      filename: file,
      title: titleMatch?.[1] ?? basename(file, ".md"),
      content,
      cropType: detectCropType(file),
      category: detectCategory(file, content),
    });
  }

  // 2. Chunk articles
  interface ChunkData {
    article: Article;
    content: string;
    index: number;
  }

  const allChunks: ChunkData[] = [];
  for (const article of articles) {
    const chunks = splitIntoChunks(article.content);
    console.log(`  ${article.title}: ${chunks.length} chunks`);
    chunks.forEach((chunk, i) => {
      allChunks.push({ article, content: chunk, index: i });
    });
  }
  console.log(`\nTotal: ${allChunks.length} chunks to embed\n`);

  // 3. Embed all chunks
  console.log("Generating embeddings...");
  const embeddings = await embedChunks(allChunks.map(c => c.content));
  console.log(`Done. ${embeddings.length} embeddings generated.\n`);

  // 4. Insert into Supabase
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env, then re-run.");
    process.exit(1);
  }

  // Clear existing KB data
  console.log("Clearing existing knowledge base...");
  await supabase.from("advisor_knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("advisor_knowledge_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Insert documents
  console.log("Inserting documents...");
  for (const article of articles) {
    const { error } = await supabase.from("advisor_knowledge_documents").insert({
      title: article.title,
      content: article.content,
      crop_type: article.cropType,
      category: article.category,
      source: `data/advisor-knowledge/${article.filename}`,
    });
    if (error) {
      console.error(`Error inserting document ${article.title}:`, error.message);
      process.exit(1);
    }
  }

  // Fetch document IDs for chunk insertion
  const { data: docs } = await supabase
    .from("advisor_knowledge_documents")
    .select("id, title");

  const docIdMap = new Map<string, string>();
  for (const doc of docs ?? []) {
    docIdMap.set(doc.title, doc.id);
  }

  // Insert chunks with embeddings
  console.log("Inserting chunks with embeddings...");
  const chunkRows = allChunks.map((chunk, i) => ({
    document_id: docIdMap.get(chunk.article.title),
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    chunk_index: chunk.index,
  }));

  // Insert in batches of 50
  for (let i = 0; i < chunkRows.length; i += 50) {
    const batch = chunkRows.slice(i, i + 50);
    const { error } = await supabase.from("advisor_knowledge_chunks").insert(batch);
    if (error) {
      console.error(`Error inserting chunk batch:`, error.message);
      process.exit(1);
    }
    console.log(`  Inserted ${Math.min(i + 50, chunkRows.length)}/${chunkRows.length} chunks`);
  }

  console.log("\n=== Seeding complete ===");
  console.log(`  ${articles.length} documents`);
  console.log(`  ${allChunks.length} chunks with embeddings`);
}

main().catch(err => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
