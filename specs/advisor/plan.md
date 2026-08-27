# Advisor Implementation Plan

> `/advisor` — real AI chatbot replacing canned demo. OpenAI Agents SDK (TypeScript), pgvector RAG, multilingual (English + Urdu), product data integration, streaming responses.

---

## Context

The current `/advisor` page has a complete demo chat UI (message bubbles, composer, suggestion chips, auto-scroll) but uses hardcoded keyword-matched replies from `demo-data.ts`. No API route, no LLM, no database tables for conversations. All farm/weather/prices data in the product is also hardcoded demo data — no `farms` or `farm_records` tables exist yet.

The spec (specs/advisor/spec.md) requires: multi-agent query routing, RAG knowledge base, product data integration, proactive advisory, multilingual support (English/Urdu), markdown rendering, conversation management (new/delete/rename), model-agnostic architecture, streaming, and graceful degradation.

---

## Architecture Overview

```
Client (advisor-chat.tsx)
  │ POST /api/advisor/chat  (SSE streaming)
  │ GET/POST/DELETE /api/advisor/conversations
  ▼
Route Handler (requireSessionApi + Zod validation)
  │
  ▼
OpenAI Agents SDK
  ├── Triage Agent (routes by intent)
  │   ├── handoff → Crop Advisor Agent (knowledge_base tool)
  │   ├── handoff → Weather Agent (weather tool — reuses /weather demo data)
  │   ├── handoff → Farm Data Agent (get_my_farms, get_my_records tools)
  │   ├── handoff → Schemes Agent (schemes knowledge_base tool)
  │   └── handoff → Prices Agent (market prices tool)
  │
  ├── Tools (Zod-validated async functions)
  │   ├── searchKnowledgeBase → pgvector similarity search
  │   ├── getWeather → reads from weather demo data / future API
  │   ├── getMarketPrices → reads from prices demo data
  │   ├── getMyFarms → reads demo farm data (→ Supabase once farms table exists)
  │   └── getMyRecords → reads demo farm records (→ Supabase once farm_records exists)
  │
  └── Guardrails
      ├── input: farming-only topic check
      └── output: no fabricated metrics
```

---

## Database Schema (Migration 0003_advisor.sql)

```sql
-- Enable vector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversations
CREATE TABLE advisor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conv_account ON advisor_conversations(account_id, updated_at DESC);

-- Messages
CREATE TABLE advisor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES advisor_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('farmer', 'advisor', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_msg_conv ON advisor_messages(conversation_id, created_at);

-- Knowledge base documents (source articles)
CREATE TABLE advisor_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  crop_type text,
  category text NOT NULL CHECK (category IN ('disease','agronomy','fertilizer','scheme','general')),
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Knowledge base chunks (embedded for vector search)
CREATE TABLE advisor_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES advisor_knowledge_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536),
  chunk_index int NOT NULL DEFAULT 0
);
CREATE INDEX idx_chunks_embedding ON advisor_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Similarity search function
CREATE OR REPLACE FUNCTION advisor_search_similar(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.7
) RETURNS TABLE (
  chunk_id uuid,
  content text,
  document_title text,
  crop_type text,
  category text,
  similarity float
) AS $$
  SELECT
    c.id AS chunk_id,
    c.content,
    d.title AS document_title,
    d.crop_type,
    d.category,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM advisor_knowledge_chunks c
  JOIN advisor_knowledge_documents d ON d.id = c.document_id
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- RLS
ALTER TABLE advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversations" ON advisor_conversations FOR SELECT USING (true);
CREATE POLICY "Users insert own conversations" ON advisor_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own conversations" ON advisor_conversations FOR UPDATE USING (true);
CREATE POLICY "Users delete own conversations" ON advisor_conversations FOR DELETE USING (true);
CREATE POLICY "Users read own messages" ON advisor_messages FOR SELECT USING (true);
CREATE POLICY "Users insert own messages" ON advisor_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read knowledge docs" ON advisor_knowledge_documents FOR SELECT USING (true);
CREATE POLICY "Public read knowledge chunks" ON advisor_knowledge_chunks FOR SELECT USING (true);
```

---

## New Dependencies

| Package | Purpose |
|---|---|
| `@openai/agents` | Agent framework (handoffs, tools, guardrails, streaming) |
| `openai` | OpenAI SDK (for embeddings during KB seeding) |
| `react-markdown` | Markdown rendering in chat responses |

All require founder approval per AGENTS.md.

---

## File Structure

### New Files

```
lib/
  advisor/
    agents/
      triage.ts              — Triage agent definition + handoffs
      crop-advisor.ts        — Crop disease/agronomy specialist
      weather-agent.ts       — Weather specialist
      farm-data-agent.ts     — Farm records specialist
      schemes-agent.ts       — Government schemes specialist
      prices-agent.ts        — Market prices specialist
    tools/
      knowledge-base.ts      — searchKnowledgeBase tool (pgvector)
      weather.ts             — getWeather tool
      farm-data.ts           — getMyFarms, getMyRecords tools
      prices.ts              — getMarketPrices tool
    guardrails.ts            — farming-only input + no-fabrication output guardrails
    context.ts               — FarmerContext type + context builder
    streaming.ts             — SSE stream helper for Route Handlers

app/api/advisor/
  chat/route.ts              — POST: send message, get streaming response
  conversations/route.ts     — GET: list conversations
  conversations/[id]/
    route.ts                 — GET/DELETE/PATCH (rename) single conversation
  messages/[conversationId]/
    route.ts                 — GET: messages for a conversation

app/(farmer)/(dashboard)/advisor/
  advisor-sidebar.tsx        — Conversation list sidebar (new, "use client")
  markdown-render.tsx        — Markdown renderer component (new, "use client")

supabase/migrations/
  0003_advisor.sql           — All advisor tables + pgvector

data/advisor-knowledge/
  wheat.md                   — Wheat crop guide (disease, agronomy, fertilizer)
  cotton.md                  — Cotton crop guide
  rice.md                    — Rice crop guide
  sugarcane.md               — Sugarcane crop guide
  maize.md                   — Maize crop guide
  schemes.md                 — Government schemes (Kissan Card, fertilizer subsidy)

scripts/
  seed-knowledge.ts          — Parse markdown → chunk → embed → insert into Supabase
```

### Modified Files

```
app/(farmer)/(dashboard)/advisor/
  page.tsx                   — Add sidebar, pass i18n bundle, full-screen layout
  advisor-chat.tsx           — Major rewrite: API calls, streaming, markdown, sidebar toggle

lib/i18n/
  server.ts                  — Add getAdvisorBundle()

catalog/
  en.ts (+ all locale files) — Add app.advisor.* keys

package.json                 — Add @openai/agents, openai, react-markdown
.env.example                 — Add OPENAI_API_KEY, ADVISOR_MODEL
```

### Deleted Files

```
app/(farmer)/(dashboard)/advisor/
  demo-data.ts               — Remove entirely (spec: "remove completely")
```

---

## Task Breakdown

### T1: Database Migration + Knowledge Base Seeding
- Write `supabase/migrations/0003_advisor.sql` with all tables above
- Apply via Supabase MCP
- Write `data/advisor-knowledge/*.md` articles (20-30 articles from public Pakistan agri sources)
- Write `scripts/seed-knowledge.ts` to chunk markdown → embed via `text-embedding-3-small` → insert into `advisor_knowledge_chunks`
- Run seed script via Supabase MCP

### T2: Install Dependencies + Env Config
- `npm install @openai/agents openai react-markdown`
- Add `OPENAI_API_KEY` and `ADVISOR_MODEL` to `.env.example`
- Verify `npm run build` still passes

### T3: Agent Definitions + Tools
- `lib/advisor/tools/knowledge-base.ts` — pgvector similarity search tool
- `lib/advisor/tools/weather.ts` — weather data tool (reads from demo data initially, extensible to API)
- `lib/advisor/tools/farm-data.ts` — getMyFarms + getMyRecords tools (reads from demo data initially)
- `lib/advisor/tools/prices.ts` — market prices tool (reads from demo data initially)
- `lib/advisor/context.ts` — FarmerContext type with accountId, farmerName, farms, language
- `lib/advisor/guardrails.ts` — farming-only input guardrail + no-fabrication output guardrail
- `lib/advisor/agents/*.ts` — triage + 5 specialist agents with their tools and handoffs
- Dynamic system instructions that inject farmer context + language

### T4: API Routes
- `app/api/advisor/chat/route.ts` — POST with streaming SSE response
  - requireSessionApi()
  - Zod validate: { conversationId?, message }
  - Load/create conversation in DB
  - Load last 10 messages as context
  - Build FarmerContext from session + demo farm data
  - Run triage agent with streaming
  - Stream response via SSE (text deltas)
  - Save messages to DB after completion
- `app/api/advisor/conversations/route.ts` — GET list
- `app/api/advisor/conversations/[id]/route.ts` — GET/DELETE/PATCH
- `app/api/advisor/messages/[conversationId]/route.ts` — GET messages

### T5: i18n Bundle
- Create `app/(farmer)/(dashboard)/advisor/advisor-bundle.ts` (AdvisorBundle type)
- Add `app.advisor.*` keys to all 8 catalog files
- Add `getAdvisorBundle()` to `lib/i18n/server.ts`
- Keys needed: chat input placeholder, send button, new conversation, delete confirm, rename, sidebar title, errors (service unavailable, rate limited, network), thinking indicator, opening greeting template, photo redirect, non-farming redirect

### T6: UI Rewrite — advisor-chat.tsx
- Replace canned reply logic with POST to `/api/advisor/chat`
- Implement SSE streaming reader (EventSource or fetch + ReadableStream)
- Progressive text rendering as stream arrives
- Markdown rendering via `react-markdown` (bold, bullets, numbered lists, headings)
- Per-message RTL/LTR direction detection
- Sidebar toggle (hamburger button opens `advisor-sidebar.tsx`)
- Mobile full-screen: hide bottom tab bar when on `/advisor`
- Conversation switching via sidebar
- New/delete/rename conversation actions
- Thinking indicator during generation
- Suggestion chips (from advisor response)
- Error states: service unavailable, rate limited, network error with retry
- Photo attachment block with redirect message
- Empty input validation (send button disabled)
- Character limit (2000 chars)
- Remove `demo-data.ts` and all canned reply logic

### T7: New Components
- `advisor-sidebar.tsx` — Conversation list with new/delete/rename, overlay on mobile
- `markdown-render.tsx` — Styled markdown renderer using react-markdown + Tailwind prose classes

### T8: Layout Adjustment
- Modify dashboard layout to conditionally hide `BottomTabBar` when on `/advisor` path
- Or use CSS to hide it on the advisor route

### T9: Verification
- Manual test: multi-turn conversation in English
- Manual test: Urdu input → Urdu response with RTL
- Manual test: Roman Urdu input → Urdu script response
- Manual test: language switching mid-conversation
- Manual test: farm data queries ("when did I plant my cotton?")
- Manual test: weather query with proactive rain warning
- Manual test: non-farming query → polite redirect
- Manual test: conversation management (new/delete/rename/sidebar)
- Manual test: streaming progressive display
- Manual test: markdown rendering (structured advice)
- Manual test: network error → graceful degradation + retry
- Manual test: empty input blocked
- Manual test: auth guard (visit /advisor logged out → redirect)
- `npm run lint` passes
- `npm run build` passes

---

## Key Patterns to Reuse

| What | From | Import Path |
|---|---|---|
| HTTP response helpers | `lib/http.ts` | `@/lib/http` → `jsonResponse`, `errorResponse`, `readJsonBody`, `clientIp` |
| Auth guard for API | `lib/auth/guards.ts` | `@/lib/auth/guards` → `requireSessionApi()` |
| Supabase client | `lib/supabase.ts` | `@/lib/supabase` → `getSupabase()` |
| Rate limiter | `lib/auth/rate-limit.ts` | `@/lib/auth/rate-limit` → `hitLimiter`, `RATE_RULES` |
| i18n bundle pattern | `lib/i18n/server.ts` | `@/lib/i18n/server` → `getAppLocale`, `getDictionary` |
| Page header | `components/shell/page-header` | `@/components/shell/page-header` |
| Color tokens | `app/globals.css` | `--agro-*` CSS variables only |
| Zod validation pattern | `lib/validation/auth.ts` | Follow same structure for advisor schemas |
| Demo farm data | `dashboard/demo-data.ts` | `@/app/(farmer)/(dashboard)/dashboard/demo-data` (for initial tool data) |
| Demo weather data | `weather/demo-data.ts` | `@/app/(farmer)/(dashboard)/weather/demo-data` |
| Demo prices data | `prices/demo-data.ts` | `@/app/(farmer)/(dashboard)/prices/demo-data` |

---

## Implementation Order

1. **T2** — Dependencies + env config (unblocks everything)
2. **T1** — Database migration + knowledge base (applied via Supabase MCP)
3. **T3** — Agent definitions + tools (the AI brain)
4. **T4** — API routes (the backend plumbing)
5. **T5** — i18n bundle (translation keys)
6. **T7** — New UI components (sidebar, markdown)
7. **T6** — Chat UI rewrite (ties everything together)
8. **T8** — Layout adjustment (hide tab bar on advisor)
9. **T9** — Verification (manual test all acceptance criteria)

Each task is committed atomically after completion.
