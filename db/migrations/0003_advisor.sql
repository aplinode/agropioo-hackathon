-- Migration 0003: Advisor chatbot tables
-- Conversations, messages, knowledge base with pgvector embeddings

-- Enable vector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Conversations ───────────────────────────────────────────────────────────

CREATE TABLE advisor_conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'New conversation',
  language    text        NOT NULL DEFAULT 'en',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_account_updated
  ON advisor_conversations(account_id, updated_at DESC);

-- ─── Messages ────────────────────────────────────────────────────────────────

CREATE TABLE advisor_messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid        NOT NULL REFERENCES advisor_conversations(id) ON DELETE CASCADE,
  role             text        NOT NULL CHECK (role IN ('farmer', 'advisor', 'system')),
  content          text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_conv_created
  ON advisor_messages(conversation_id, created_at);

-- ─── Knowledge Base Documents ────────────────────────────────────────────────

CREATE TABLE advisor_knowledge_documents (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL,
  content    text        NOT NULL,
  crop_type  text,
  category   text        NOT NULL CHECK (category IN ('disease', 'agronomy', 'fertilizer', 'scheme', 'general')),
  source     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_category ON advisor_knowledge_documents(category);
CREATE INDEX idx_docs_crop ON advisor_knowledge_documents(crop_type);

-- ─── Knowledge Base Chunks (vector-embedded) ────────────────────────────────

CREATE TABLE advisor_knowledge_chunks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid        NOT NULL REFERENCES advisor_knowledge_documents(id) ON DELETE CASCADE,
  content      text        NOT NULL,
  embedding    vector(1536),
  chunk_index  int         NOT NULL DEFAULT 0
);

-- IVFFlat index for cosine similarity search
-- lists = 100 is a reasonable starting point for small-to-medium datasets
CREATE INDEX idx_chunks_embedding
  ON advisor_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── Similarity Search Function ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION advisor_search_similar(
  query_embedding  vector(1536),
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

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Conversations: users manage their own
CREATE POLICY "conv_select_own"
  ON advisor_conversations FOR SELECT USING (true);
CREATE POLICY "conv_insert_own"
  ON advisor_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conv_update_own"
  ON advisor_conversations FOR UPDATE USING (true);
CREATE POLICY "conv_delete_own"
  ON advisor_conversations FOR DELETE USING (true);

-- Messages: users read/write within any conversation
CREATE POLICY "msg_select"
  ON advisor_messages FOR SELECT USING (true);
CREATE POLICY "msg_insert"
  ON advisor_messages FOR INSERT WITH CHECK (true);

-- Knowledge base: publicly readable
CREATE POLICY "kb_docs_read"
  ON advisor_knowledge_documents FOR SELECT USING (true);
CREATE POLICY "kb_chunks_read"
  ON advisor_knowledge_chunks FOR SELECT USING (true);
