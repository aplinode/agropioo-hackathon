/**
 * Seeds the advisor knowledge base: reads markdown articles from
 * data/advisor-knowledge/, chunks them, embeds locally via Ollama (free,
 * on-device — no API key), and inserts into Neon
 * advisor_knowledge_documents + advisor_knowledge_chunks.
 *
 * Idempotent: deletes existing advisor KB rows before re-seeding.
 *
 * Requires: DATABASE_URL + a running Ollama daemon with the embed model pulled.
 * Config: OLLAMA_HOST (default http://localhost:11434),
 *         OLLAMA_EMBED_MODEL (default nomic-embed-text, 768-dim),
 *         OLLAMA_EMBED_DIM (default 768 — must match db/migrations/0006).
 * Run: node --experimental-strip-types --env-file-if-exists=.env scripts/seed-knowledge.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { query, queryOne } from "../lib/db.ts";

const KB_DIR = join(import.meta.dirname, "..", "data", "advisor-knowledge");
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
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
  const batchSize = 50;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`  Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks) via ${EMBEDDING_MODEL} @ ${OLLAMA_HOST}...`);

    const response = await fetch(`${OLLAMA_HOST}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama embed error (${response.status}): ${errText}`);
    }

    const data = await response.json() as { embeddings: number[][] };
    if (!Array.isArray(data.embeddings) || data.embeddings.length !== batch.length) {
      throw new Error(`Ollama returned ${data.embeddings?.length} embeddings for ${batch.length} inputs`);
    }
    for (const emb of data.embeddings) allEmbeddings.push(emb);
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

  // 4. Insert into Neon
  // Clear existing KB data
  console.log("Clearing existing knowledge base...");
  await query(`DELETE FROM advisor_knowledge_chunks WHERE id IS NOT NULL`);
  await query(`DELETE FROM advisor_knowledge_documents WHERE id IS NOT NULL`);

  // Insert documents
  console.log("Inserting documents...");
  const docIdMap = new Map<string, string>();
  for (const article of articles) {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO advisor_knowledge_documents (title, content, crop_type, category, source)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [article.title, article.content, article.cropType, article.category, `data/advisor-knowledge/${article.filename}`]
    );
    if (!row) {
      console.error(`Error inserting document ${article.title}`);
      process.exit(1);
    }
    docIdMap.set(article.title, row.id);
  }

  // Insert chunks with embeddings
  console.log("Inserting chunks with embeddings...");
  for (let i = 0; i < allChunks.length; i += 50) {
    const batch = allChunks.slice(i, i + 50);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const documentId = docIdMap.get(chunk.article.title);
      if (!documentId) {
        console.error(`Missing document id for ${chunk.article.title}`);
        process.exit(1);
      }
      placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}::vector, $${idx + 3})`);
      values.push(documentId, chunk.content, `[${embeddings[i + j].join(",")}]`, chunk.index);
      idx += 4;
    }

    try {
      await query(
        `INSERT INTO advisor_knowledge_chunks (document_id, content, embedding, chunk_index)
         VALUES ${placeholders.join(", ")}`,
        values
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error inserting chunk batch:`, message);
      process.exit(1);
    }
    console.log(`  Inserted ${Math.min(i + 50, allChunks.length)}/${allChunks.length} chunks`);
  }

  console.log("\n=== Seeding complete ===");
  console.log(`  ${articles.length} documents`);
  console.log(`  ${allChunks.length} chunks with embeddings`);
}

main().catch(err => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
