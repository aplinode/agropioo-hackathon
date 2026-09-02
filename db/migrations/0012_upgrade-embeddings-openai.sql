-- Migration 0012: Upgrade knowledge base embeddings to Jina AI (1024-dim)
-- This migration updates the vector column, index, and search function to support
-- Jina Embeddings v3 (1024 dimensions) for better search quality.

-- 1. Drop existing index and column constraints
DROP INDEX IF EXISTS idx_chunks_embedding;
ALTER TABLE advisor_knowledge_chunks DROP COLUMN IF EXISTS embedding;

-- 2. Add new 1024-dimension embedding column
ALTER TABLE advisor_knowledge_chunks ADD COLUMN embedding vector(1024);

-- 3. Recreate IVFFlat index for cosine similarity search
-- lists = 100 is reasonable for small-to-medium datasets
CREATE INDEX idx_chunks_embedding
  ON advisor_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Update the search function to use 1024-dim vectors
CREATE OR REPLACE FUNCTION advisor_search_similar(
  query_embedding  vector(1024),
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
