/**
 * Seeds the advisor knowledge base using local TF-IDF embeddings.
 * No external API required - uses scikit-learn-style TF-IDF + truncated SVD
 * implemented in pure Node.js for 384-dim vectors.
 *
 * Reads markdown articles from data/advisor-knowledge/, chunks them,
 * embeds locally, and inserts into Neon advisor_knowledge_documents + advisor_knowledge_chunks.
 *
 * Idempotent: deletes existing advisor KB rows before re-seeding.
 *
 * Requires: DATABASE_URL
 * Run: node --experimental-strip-types --env-file-if-exists=.env scripts/seed-knowledge-local.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { query, queryOne } from "../lib/db.ts";

const KB_DIR = join(import.meta.dirname, "..", "data", "advisor-knowledge");
const EMBEDDING_DIM = 384;
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 80;

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
  if (name.includes("fertilizer") || name.includes("pesticide")) return "fertilizer";
  return "agronomy";
}

function detectCropType(filename: string): string | null {
  const name = basename(filename, extname(filename)).toLowerCase();
  const cropMap: Record<string, string> = {
    wheat: "wheat", cotton: "cotton", rice: "rice", sugarcane: "sugarcane",
    maize: "maize", potato: "potato", onion: "onion", tomato: "tomato",
    chickpea: "chickpea", gram: "chickpea", lentil: "lentil", mungbean: "mungbean",
    mung: "mungbean", soybean: "soybean", sunflower: "sunflower", groundnut: "groundnut",
    canola: "canola", rapeseed: "canola", mango: "mango", citrus: "citrus",
    kinnow: "citrus", banana: "banana", poultry: "poultry", chicken: "poultry",
    dairy: "dairy", cattle: "dairy", buffalo: "dairy", livestock: "livestock", goat: "goat",
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
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2);
}

class TFIDFVectorizer {
  private vocabulary: Map<string, number> = new Map();
  private idf: number[] = [];

  fit(corpus: string[]): void {
    const docCount = corpus.length;
    const tf = new Map<string, number>();

    for (const doc of corpus) {
      const tokens = [...new Set(tokenize(doc))];
      for (const token of tokens) {
        tf.set(token, (tf.get(token) ?? 0) + 1);
      }
    }

    let idx = 0;
    for (const [word, docFreq] of tf) {
      this.vocabulary.set(word, idx);
      this.idf[idx] = Math.log((docCount + 1) / (docFreq + 1)) + 1;
      idx++;
    }
  }

  transform(text: string): number[] {
    const tokens = tokenize(text);
    const vector = new Array(this.vocabulary.size).fill(0);
    const tf = new Map<string, number>();

    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }

    for (const [token, count] of tf) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        vector[idx] = (count / tokens.length) * this.idf[idx];
      }
    }

    return vector;
  }

  fitTransform(corpus: string[]): number[][] {
    this.fit(corpus);
    return corpus.map(doc => this.transform(doc));
  }

  get vocabSize(): number { return this.vocabulary.size; }
}

function truncatedSVD(vectors: number[][], targetDim: number): number[][] {
  const n = vectors.length;
  const m = vectors[0].length;
  const k = Math.min(targetDim, Math.min(n, m));

  // Simple random projection: project onto k random directions
  const randomMatrix: number[][] = Array.from({ length: m }, () =>
    Array.from({ length: k }, () => (Math.random() - 0.5) * 2)
  );

  // Project: result = vectors * randomMatrix
  const projected: number[][] = Array.from({ length: n }, () => new Array(k).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let p = 0; p < m; p++) sum += vectors[i][p] * randomMatrix[p][j];
      projected[i][j] = sum;
    }
  }

  // Pad to targetDim if k < targetDim (more dimensions than documents)
  const result: number[][] = projected.map(row => {
    const padded = new Array(targetDim).fill(0);
    for (let j = 0; j < k; j++) padded[j] = row[j];
    return padded;
  });

  // Normalize rows to unit length
  for (let i = 0; i < n; i++) {
    let norm = 0;
    for (let j = 0; j < targetDim; j++) norm += result[i][j] ** 2;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let j = 0; j < targetDim; j++) result[i][j] /= norm;
    }
  }

  return result;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  console.log("=== Advisor Knowledge Base Seeder (Local TF-IDF) ===\n");

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
      allChunks.push({ article, content: `# ${article.title}\n\n${chunk}`, index: i });
    });
  }
  console.log(`\nTotal: ${allChunks.length} chunks to embed\n`);

  // Generate TF-IDF embeddings
  console.log("Building vocabulary and TF-IDF matrix...");
  const corpus = allChunks.map(c => c.content);
  const vectorizer = new TFIDFVectorizer();
  const tfidfMatrix = vectorizer.fitTransform(corpus);
  console.log(`Vocabulary size: ${vectorizer.vocabSize}`);

  console.log("Running truncated SVD for dimensionality reduction...");
  const embeddings = truncatedSVD(tfidfMatrix, EMBEDDING_DIM);
  console.log(`Done. ${embeddings.length} embeddings generated (${EMBEDDING_DIM}-dim).\n`);

  // Verify embedding quality with a test query
  const testQuery = vectorizer.transform("wheat farming Pakistan");
  const testEmb = truncatedSVD([testQuery], EMBEDDING_DIM)[0];
  let bestScore = -1, bestIdx = 0;
  for (let i = 0; i < embeddings.length; i++) {
    const score = cosineSimilarity(testEmb, embeddings[i]);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  console.log(`Quality check: best match for "wheat farming Pakistan" = "${allChunks[bestIdx].article.title}" (score: ${bestScore.toFixed(3)})\n`);

  // Insert into Neon
  console.log("Clearing existing knowledge base...");
  await query(`DELETE FROM advisor_knowledge_chunks WHERE id IS NOT NULL`);
  await query(`DELETE FROM advisor_knowledge_documents WHERE id IS NOT NULL`);

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

  console.log("Inserting chunks with embeddings...");
  console.log(`Embeddings array length: ${embeddings.length}, first embedding length: ${embeddings[0].length}`);
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
      const vecStr = `[${embeddings[i + j].join(",")}]`;
      if (j === 0) console.log(`  Vector length check: ${embeddings[i + j].length} dims, string length: ${vecStr.length}`);
      values.push(documentId, chunk.content, vecStr, chunk.index);
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
  process.exit(0);
}

main().catch(err => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
