-- 0006 — Switch advisor knowledge-base embeddings to a local, free Ollama model.
-- The column was originally sized for OpenAI text-embedding-3-small
-- (vector(1536)). The chosen local model, nomic-embed-text, emits
-- 768-dimensional vectors, so we retype the column, the similarity-search
-- function, and rebuild the IVFFlat index.
--
-- No data is lost at apply time: the chunks table is empty (it is seeded by
-- scripts/seed-knowledge.ts afterwards, which now embeds via Ollama locally).

DROP INDEX IF EXISTS idx_chunks_embedding;

ALTER TABLE advisor_knowledge_chunks
  ALTER COLUMN embedding TYPE vector(768)
  USING NULL::vector(768);

CREATE INDEX idx_chunks_embedding
  ON advisor_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION advisor_search_similar(
  query_embedding  vector(768),
  match_count      int     DEFAULT 5,
  match_threshold  float   DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id       uuid,
  content        text,
  document_title text,
  crop_type      text,
  category       text,
  source         text,
  similarity     float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id           AS chunk_id,
    c.content,
    d.title        AS document_title,
    d.crop_type,
    d.category,
    d.source,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM advisor_knowledge_chunks c
  JOIN advisor_knowledge_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
