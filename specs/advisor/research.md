# Advisor Chatbot Research

> Phase 1 — Research findings for the multilingual farming advisory chatbot. Sources gathered 2026-08. Covers RAG patterns, multilingual LLM support, Pakistan agriculture data, OpenAI Agents SDK (TypeScript), architecture patterns, and existing solutions.

---

## 1. RAG Patterns for Domain-Specific Farming Chatbots

### 1.1 Knowledge Base Structure

The most successful agricultural RAG systems combine multiple content types into a unified vector store:

- **Expert-vetted advisory content**: crop-specific guides, pest/disease manuals, fertilizer schedules
- **Government extension publications**: official crop calendars, scheme documentation, subsidy guides
- **Video transcripts**: peer-to-peer farming videos (Digital Green's 15-year library of vernacular videos is the gold standard)
- **Call center logs**: real farmer questions and verified answers
- **Research papers and fact sheets**: from agricultural universities and research institutes
- **Real-time data feeds**: weather forecasts, mandi prices, pest outbreak alerts

Digital Green's approach — reviewed by India's Ministry of Agriculture for accuracy — is the clearest model: all content is expert-verified before ingestion, and the system initially operated as a backend tool for human advisors before facing farmers directly ([OpenAI case study](https://openai.com/index/digital-green/)).

**Key principle**: trust hinges on expert-endorsed data. Failed-query analysis consistently shows that missing database content — not model error — is the primary cause of unanswered prompts.

### 1.2 Chunking Strategies for Agricultural Content

| Strategy | When to Use | Recommended Size |
|---|---|---|
| **Fixed-size** (baseline) | Most content; start here | 256–512 tokens with 10–15% overlap |
| **Semantic** | Mixed-topic documents where topic shifts matter | Varies; split on semantic distance thresholds |
| **Structure-based** | Markdown, FAQs, structured guides | Split on headings, Q&A pairs, list items |
| **Contextual chunking** | When chunks lack context when retrieved alone | LLM summarizes each chunk, appends summary before embedding |

For agricultural content specifically:
- **Crop disease entries**: chunk per disease (symptoms + causes + treatment in one chunk)
- **Crop calendars**: chunk per crop per season
- **Scheme/government program docs**: chunk per scheme (eligibility + benefits + how to apply)
- **Frequently asked questions**: each Q&A pair is its own chunk

Post-retrieval chunk expansion (fetching neighboring chunks) is valuable for farming content where adjacent context matters (e.g., a pest treatment that references the preceding identification section) ([Pinecone chunking guide](https://www.pinecone.io/learn/chunking-strategies/)).

### 1.3 Vector Database Selection

For the Agropioo stack (Supabase = PostgreSQL), **pgvector is the natural fit**:

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **pgvector** (Supabase) | Already in the stack; no new infra; Supabase has native vector support + RPC for similarity search | Less optimized at massive scale vs. dedicated vector DBs | **Recommended** — simplest path, no new dependency |
| **Pinecone** | Purpose-built; excellent at scale; managed service | New dependency; added cost; separate from existing DB | Overkill for demo scope |
| **Weaviate/Qdrant** | Open source; good multilingual support | New dependency; self-hosted or managed cost | Consider if pgvector proves insufficient |

Supabase provides a [documented Next.js + pgvector RAG pattern](https://supabase.com/docs/guides/ai/examples/nextjs-vector-search): enable the `vector` extension, create document/chunk tables, write a SQL similarity-matching function, and call it via RPC from a Route Handler. This aligns perfectly with the project's architecture (Route Handlers as the API layer, Supabase as DB only).

### 1.4 Keeping Responses Grounded in Factual Data

Best practices from production agricultural RAG systems:

1. **Strict retrieval-only system prompt**: "Answer ONLY using the provided context. If the context does not contain enough information, say so clearly and suggest the farmer consult a local extension officer."
2. **Dual-model approach** (from Digital Green's scaling paper): one model filters/reranks retrieved context for relevance; a second model generates the final answer from only the filtered context.
3. **Citation/source attribution**: include the source of each piece of advice in the response (e.g., "According to Punjab Agriculture Department advisory...").
4. **Confidence thresholds**: if retrieval similarity scores are below threshold, do not generate from parametric knowledge — instead return a graceful fallback ("I don't have reliable information on this. Please contact your local extension officer at...").
5. **Guard rails on dangerous advice**: pesticide dosage, chemical mixing, and financial decisions require extra verification. Never let the model hallucinate quantities.
6. **Human-in-the-loop initially**: Digital Green launched the system as an advisor-to-advisors tool first, not farmer-facing. For a hackathon demo, a similar "advisor mode" is lower risk.

---

## 2. Multilingual Support with OpenAI Models

### 2.1 GPT-4o Language Coverage for Pakistani Languages

| Language | GPT-4o Quality | Notes |
|---|---|---|
| **Urdu** | Good | Largest training corpus among Pakistani languages; decent comprehension and generation. Some grammatical errors in complex sentences. |
| **Punjabi** (Shahmukhi) | Moderate | Limited training data; code-mixing with Urdu/English common. Shahmukhi script (Arabic-based) better supported than Gurmukhi. |
| **Pashto** | Moderate-to-Low | Arabic-script support exists but quality degrades for complex agricultural terminology. |
| **Sindhi** | Low-to-Moderate | Very limited training data; modified Arabic script handling is inconsistent. |
| **Saraiki** | Low | Extremely limited training data; often confused with Punjabi. |
| **Balochi** | Very Low | Minimal representation in training data. |
| **Hindko** | Very Low | Often not distinguished from Punjabi/Pahari. |

**Key finding from research**: GPT-4o handles Urdu reasonably well for comprehension (understanding farmer queries) but generation quality varies. For regional languages, comprehension is significantly better than generation ([Qalb Urdu LLM paper](https://arxiv.org/html/2601.08141v1), [ChipsAl benchmark](https://aclanthology.org/2025.chipsal-1.3/)).

**The Qalb model** (trained on 1.97B Urdu tokens) is a specialized Urdu LLM but is not yet production-ready for chatbot use and doesn't cover other Pakistani languages.

### 2.2 The Translate-RAG Pattern (Recommended for Demo)

Production agricultural systems consistently use this approach rather than direct native-language generation:

```
User query (Urdu/Pashto/etc.)
    ↓
Language detection
    ↓
Translate to English (for retrieval + reasoning)
    ↓
Retrieve from English knowledge base
    ↓
Generate answer in English
    ↓
Translate response back to user's language
    ↓
Display in native script with RTL layout
```

**Why this works**: embedding models and LLMs perform significantly better in English. Translating at the boundary lets you maintain one high-quality English knowledge base while serving multiple languages. Digital Green and similar platforms all use this pattern ([Scaling AI-Powered Agricultural Services](https://arxiv.org/html/2409.08916v2)).

**For the hackathon demo**: start with English + Urdu. Use GPT-4o's built-in translation capabilities (via system prompt instructions) rather than a separate translation API. Add languages incrementally.

### 2.3 Embedding Models for Multilingual RAG

OpenAI's `text-embedding-3-large` (or `text-embedding-3-small`) processes tokens from UTF-8 and is "relatively language agnostic." However:
- Non-English embeddings are lower quality than English equivalents
- Best practice: embed the **English translation** of documents (not native-script originals) so retrieval quality stays high
- For user queries: translate to English first, then embed for similarity search
- This means the knowledge base stores English embeddings; the translation happens at the query boundary

### 2.4 Roman Urdu vs. Native Script

| Factor | Roman Urdu | Native Script (Urdu/Pashto/etc.) |
|---|---|---|
| **Farmer familiarity** | Common in texting/social media among younger, urban-adjacent farmers | Standard for official communication; older farmers more comfortable |
| **NLP quality** | No standardized spelling; phonetic variation makes processing unreliable | Established tokenization; better LLM support |
| **Code-mixing** | Heavy English mixing ("meri wheat mein rust lag gaya") | Less code-mixing; cleaner input |
| **UI rendering** | Simple LTR; no special CSS needed | Requires RTL layout, mirrored UI, `dir="rtl"` |
| **Recommendation** | Accept as input (farmers will type it anyway) but always respond in native script | **Primary output format**; required per AGENTS.md language policy |

**Practical approach**: accept Roman Urdu input (detect and transliterate/translate), but always respond in the proper script. The system prompt should instruct: "If the user writes in Roman Urdu, respond in Urdu script."

### 2.5 RTL Text Handling in Chat UI

Required implementation for Urdu and Pashto:

- Set `dir="rtl"` on the chat container — this cascades to all child elements
- CSS: `direction: rtl`, `text-align: right`, `unicode-bidi: embed`
- **Mirrored layout**: user messages appear on the left (reversed from LTR convention), bot messages on the right; send button moves to the left of the input field
- **Mixed script handling**: the Unicode Bidirectional Algorithm handles inline English terms within RTL text (e.g., crop names, chemical names)
- **Input field**: cursor starts on the right side in RTL mode
- **Font stack**: use a proper Urdu/Nastaliq font (e.g., Noto Nastaliq Urdu) for Urdu; Noto Sans Arabic for Pashto/Sindhi
- English responses remain LTR within the same interface — detect language per message and apply direction accordingly

---

## 3. Farming Knowledge Base for Pakistan

### 3.1 Pakistan Agriculture Overview

- Agriculture contributes ~24% of GDP and employs ~50% of the workforce
- Two growing seasons: **Kharif** (April–October: rice, cotton, sugarcane, maize) and **Rabi** (October–April: wheat, barley, gram, mustard)
- Major crops: wheat, cotton, rice, sugarcane, maize
- High-value crops: potatoes, tomatoes, citrus, mangoes
- Extension ratio: approximately 1 extension officer per 9,500 farm families — a massive gap that digital advisory can address

### 3.2 Data Sources for Pakistani Agriculture

| Source | Data Type | URL/Access |
|---|---|---|
| **Pakistan Bureau of Statistics** | Crop area, production, yield statistics | [pbs.gov.pk](https://www.pbs.gov.pk/agriculture-sector-of-pakistan-importance-role-key-statistics/) |
| **Pakistan Meteorological Department** | Weather forecasts, alerts | [pmd.gov.pk](https://pmd.gov.pk/) / [weather.gov.pk](https://weather.gov.pk/) |
| **AMIS Punjab** | Daily mandi prices for commodities | [amis.pk](http://www.amis.pk/ViewPrices.aspx?searchType=1&commodityId=1) |
| **Zarai Mandi** | Commodity price platform | [zaraimandi.com](https://www.zaraimandi.com/) |
| **AgriPunjab** | Ongoing schemes, subsidies, projects | [agripunjab.gov.pk](https://agripunjab.gov.pk/ongoing_projects) |
| **PAR (Pakistan Agriculture Research)** | REST API for agricultural data | [par.com.pk/services/rest-api](https://www.par.com.pk/services/rest-api) |
| **FEWS NET** | Food security data, crop assessments | [fews.net](https://help.fews.net/fde/v3/pakistan-data-book) |
| **FAO FAPDA** | Food and agriculture policy data | [fao.org](https://openknowledge.fao.org/) |
| **ICIMOD** | Climate services dashboard | [icimod.org](https://www.icimod.org/pakistan-launches-online-climate-services-dashboard-to-support-agricultural-production/) |

### 3.3 Common Query Categories (for Knowledge Base Structure)

Based on farmer advisory patterns across South Asia:

1. **Crop disease & pest management**
   - Wheat: rust (yellow/brown/black), loose smut, aphids, termites
   - Cotton: bollworm, whitefly, jassid, cotton leaf curl virus (CLCV)
   - Rice: blast, bacterial blight, stem borer, brown plant hopper
   - Sugarcane: red rot, smut, top borer, pyrilla
   - Vegetables: various fungal, bacterial, viral diseases

2. **Crop calendar & agronomy**
   - When to sow/harvest specific crops
   - Seed rates, spacing, land preparation
   - Irrigation scheduling
   - Fertilizer application schedules (basal + top dressing)

3. **Weather & climate**
   - Local forecast for the next 3–7 days
   - Rainfall alerts, frost warnings
   - Seasonal advisories (monsoon preparedness, heatwave protection)

4. **Market prices**
   - Current mandi prices for their crop
   - Price trends and best time to sell
   - Nearby market comparison

5. **Government schemes & subsidies**
   - Kissan Card program (Rs. 84 billion loan program for Kharif 2025)
   - Fertilizer subsidies
   - Crop insurance schemes
   - Tube well / solar subsidies
   - Seed certification and distribution programs

6. **Input recommendations**
   - Which seed variety for their zone/season
   - Fertilizer type and quantity
   - Pesticide selection and safe usage
   - Equipment recommendations

7. **Livestock** (secondary but commonly asked)
   - Animal health, vaccination schedules
   - Feed management
   - Breeding advice

### 3.4 Structuring Responses for Low-Literacy Farmers

Lessons from deployed systems:

- **Short sentences**: maximum 15–20 words per sentence
- **Step-by-step format**: "Step 1: Check the leaves for yellow spots. Step 2: If spots are present..."
- **Avoid technical jargon**: use "fertilizer" not "NPK 20-20-0"; use local names for chemicals
- **Use local measurements**: maunds, kanals, marlas — not just hectares/tonnes
- **Clickable follow-up suggestions**: help farmers who struggle to articulate precise questions. "Do you want to know: (a) how to identify this disease, (b) what spray to use, or (c) when to apply it?"
- **Structured response template**:
  ```
  Problem: [what's happening]
  Cause: [why it's happening]
  What to do: [numbered steps]
  When: [timing]
  Caution: [safety warnings]
  ```

---

## 4. Architecture Patterns

### 4.1 Query Routing with Function Calling

The recommended pattern uses OpenAI's function calling (tool use) to route different query types:

```
User message → Route Handler
    ↓
LLM with tool definitions:
    - search_knowledge_base(query, category?)
    - get_weather(location, days?)
    - get_market_prices(crop, market?)
    - get_scheme_info(scheme_name?)
    - detect_disease(image_url)  [future: /detect feature]
    ↓
LLM decides which tool(s) to call
    ↓
Route Handler executes the tool(s)
    ↓
Tool results fed back to LLM
    ↓
LLM generates final response using tool results + system prompt
```

This approach naturally handles multi-tool queries (e.g., "What should I spray for cotton bollworm and what's the weather this week?") because the LLM can call multiple tools in sequence.

**Implementation in Next.js Route Handlers**: define tool schemas as JSON Schema objects, pass them in the `tools` parameter of the OpenAI chat completion request, parse the `tool_calls` from the response, execute them server-side, and send results back in a follow-up request.

### 4.2 Combining Static Knowledge Base with Real-Time Data

```
┌─────────────────────────────────────┐
│           Knowledge Base             │
│  (pgvector — expert-vetted content) │
│  - Crop disease guides              │
│  - Agronomy practices               │
│  - Scheme documentation             │
│  - Fertilizer/pesticide manuals      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Route Handler                │
│   (Orchestrator + OpenAI tools)     │
│                                      │
│  1. Parse intent from user message   │
│  2. Call appropriate tool(s):        │
│     → vector search for KB queries   │
│     → weather API for forecasts      │
│     → market price API for rates     │
│  3. Combine results into context     │
│  4. Generate grounded response       │
└──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        External Data Sources         │
│  - PMD weather API                   │
│  - AMIS mandi prices                 │
│  - Government scheme portals         │
└─────────────────────────────────────┘
```

**Knowledge base refresh**: re-embed documents when source content changes (nightly batch or on-demand). Real-time data (weather, prices) is fetched per-query, not stored in the vector DB.

### 4.3 Conversation Memory / Context Management

For a farming advisory chat, conversations are typically short (3–8 turns). Recommended pattern:

**Short-term memory (within session)**:
- Store the full conversation history in the database (or Redis for faster access)
- Send the last N messages as context to each LLM call
- For longer conversations: summarize older messages, keep recent messages verbatim
- Token budget: ~4000 tokens for conversation history, leaving room for system prompt + retrieved context + response

**Session storage pattern**:
```
conversation_sessions table:
  - id (UUID)
  - user_id (FK to users)
  - language (selected language)
  - farmer_context (JSON: location, crops, farm_size — from onboarding)
  - messages (JSON array of {role, content, timestamp})
  - summary (text — compressed older messages)
  - created_at, updated_at
```

**Context injection**: prepend farmer profile data (from onboarding) to the system prompt:
```
You are advising a farmer in [district], Punjab, Pakistan.
They grow [wheat, cotton] on [5 acres].
Current season: Rabi.
Language: Urdu.
```

### 4.4 Session Management

- Each chat session has a unique ID stored in the database
- Messages are appended to the session on each exchange
- Sessions can be resumed (farmer comes back to an earlier conversation)
- Session list shown in a sidebar ("Your conversations")
- Rate limiting: per-user rate limit on advisor requests (e.g., 20 messages/hour) to control API costs

---

## 5. OpenAI Agents SDK (TypeScript)

### 5.1 Overview

**Package:** `@openai/agents` (npm)
**Latest version:** v0.17.0 (August 2026)
**Weekly downloads:** ~1.55 million
**Repository:** [github.com/openai/openai-agents-js](https://github.com/openai/openai-agents-js)
**Maturity:** Active, rapid release cadence. Pre-1.0 but production-usable. Mirrors the Python Agents SDK architecture with API parity.

**Installation:**
```bash
npm install @openai/agents zod
```

The SDK is provider-agnostic at its core (`@openai/agents-core`) with an OpenAI-specific layer (`@openai/agents-openai`). Extensions (`@openai/agents-extensions`) provide Vercel AI SDK adapter support for non-OpenAI models.

**Runtime:** Node.js 22+, Deno, Bun.

### 5.2 Core Concepts

**Agent:** wraps an LLM with instructions, tools, handoffs, and guardrails.

```typescript
import { Agent, tool } from '@openai/agents';
import z from 'zod';

const getWeather = tool({
  name: 'getWeather',
  description: 'Get weather for a city',
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => `The weather in ${city} is sunny.`,
});

const advisor = new Agent({
  name: 'Farming Advisor',
  instructions: 'You are a helpful farming advisor for Pakistani farmers.',
  tools: [getWeather],
});
```

**Runner:** executes agents, manages tool-calling loop, handoff switching, and streaming.

```typescript
import { Runner } from '@openai/agents';

const runner = new Runner({ groupId: conversationId });
const result = await runner.run(agent, messages);
console.log(result.finalOutput);
```

**Key result properties:**
- `result.finalOutput` — final text response
- `result.history` — full conversation history including tool calls
- `result.interruptions` — pending approval items
- `result.state` — serializable `RunState` for resuming interrupted runs
- `result.currentAgent` — which agent ended up handling the request (after handoffs)

**RunConfig:** global overrides (model, tracing, guardrails, tool execution) passed to `runner.run()` without modifying agent definitions.

### 5.3 Handoffs (Multi-Agent Routing)

Handoffs let agents delegate to specialized peers. The SDK exposes them as LLM-callable tools:

```typescript
import { Agent, handoff } from '@openai/agents';

const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: 'You handle weather queries for Pakistan.',
  tools: [getWeatherTool],
});

const cropAgent = new Agent({
  name: 'Crop Advisor',
  instructions: 'You handle crop disease and planting advice.',
  tools: [cropDatabaseTool],
});

const schemesAgent = new Agent({
  name: 'Schemes Agent',
  instructions: 'You handle government agricultural scheme queries.',
  tools: [schemesLookupTool],
});

const triage = new Agent({
  name: 'Triage',
  instructions: 'Route queries to the right specialist.',
  handoffs: [handoff(weatherAgent), handoff(cropAgent), handoff(schemesAgent)],
});
```

**Key handoff features:**
- Receiving agent inherits the entire conversation history by default
- `handoff()` accepts: `toolName`, `toolDescription`, `onHandoff` callback, `inputType` (Zod schema for structured metadata)
- `inputFilter` can modify forwarded context (e.g., `removeAllTools` to strip tools from history)
- Handoffs are one-directional — no automatic hand-back. Track `result.currentAgent` and re-run to return.

**Two multi-agent patterns:**
1. **Manager pattern:** a primary agent invokes sub-agents as tools (via `agentAsTool()`), retaining overall control
2. **Handoff pattern:** peer agents transfer control directly to specialists

### 5.4 Custom Tools (External API + Product Data Integration)

Any external API, database query, or file operation can be wrapped as a `tool()`. Critically, **the advisor can query the farmer's own product data** (farm records, crop history, activity logs) from Supabase:

```typescript
// Tool that retrieves the farmer's own farm records
const getMyFarmRecords = tool({
  name: 'get_my_farm_records',
  description: 'Retrieve the farmer\'s own farm records — crops planted, harvest dates, yields, inputs used. Use this when the farmer asks about their own farming history or current crops.',
  parameters: z.object({
    farmId: z.string().optional().describe('Specific farm ID, or omit for all farms'),
    cropType: z.string().optional().describe('Filter by crop type'),
  }),
  async execute({ farmId, cropType }, context) {
    let query = supabase
      .from('farm_records')
      .select('*')
      .eq('account_id', context.accountId);
    if (farmId) query = query.eq('farm_id', farmId);
    if (cropType) query = query.ilike('crop_type', `%${cropType}%`);
    const { data } = await query;
    return JSON.stringify(data);
  },
});

// Tool that retrieves the farmer's own farms
const getMyFarms = tool({
  name: 'get_my_farms',
  description: 'Get the farmer\'s registered farms with location, size, and crop info. Use when the farmer asks about their farms, land, or fields.',
  parameters: z.object({}),
  async execute(_, context) {
    const { data } = await supabase
      .from('farms')
      .select('*')
      .eq('account_id', context.accountId);
    return JSON.stringify(data);
  },
});
```

**Other tool types that wrap external APIs:**

```typescript
const lookupCropDisease = tool({
  name: 'lookup_crop_disease',
  description: 'Look up crop disease information by symptom',
  parameters: z.object({
    symptoms: z.string().describe('Description of observed symptoms'),
    cropType: z.string().describe('Type of crop (wheat, rice, cotton)'),
  }),
  async execute({ symptoms, cropType }) {
    const results = await supabase
      .from('crop_diseases')
      .select('*')
      .ilike('symptoms', `%${symptoms}%`);
    return JSON.stringify(results.data);
  },
});
```

**Built-in (hosted) tool types** that execute on OpenAI servers:
- `web_search` — live internet browsing
- `file_search` — vector search over uploaded documents
- `code_interpreter` — Python code execution
- `image_generation` — DALL-E
- `mcp` — Model Context Protocol servers

**Agents as tools:** convert an agent into a callable tool for another agent via `agentAsTool()`.

**Product data tools are extensible:** as new features land in the product (e.g., `/detect` results, `/prices` data, `/schemes` bookmarks), new tools can be added to the agent without changing the architecture. Each feature's database tables become a tool the advisor can query on behalf of the farmer.

### 5.5 Streaming

```typescript
import { run, StreamedRunResult } from '@openai/agents';

const result = await run(agent, messages, { stream: true });

// Pipe text stream
const textStream = result.toTextStream({ compatibleWithNodeStreams: true });

// Or iterate events for fine-grained control
for await (const event of result.toStream()) {
  if (event.type === 'text_delta') {
    // stream partial text to client
  }
}

await result.completed;
console.log(result.finalOutput);
```

**Stream event types:** `text_delta`, `response_started`, `response_completed`, tool call events, handoff events, raw model events, agent-update events.

### 5.6 Next.js Route Handler Integration

The official SDK pattern aligns with AGENTS.md's Route Handler architecture:

```typescript
// app/api/advisor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Runner } from '@openai/agents';
import { triageAgent } from '@/agents/triage';

export async function POST(req: NextRequest) {
  const { messages, conversationId } = await req.json();
  const runner = new Runner({ groupId: conversationId });
  const result = await runner.run(triageAgent, messages);

  return NextResponse.json({
    response: result.finalOutput,
    history: result.history,
    conversationId,
  });
}
```

For streaming in a Route Handler:
```typescript
export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const runner = new Runner();
  const result = await runner.run(agent, messages, { stream: true });
  const textStream = result.toTextStream();
  return new Response(textStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### 5.7 Guardrails

**Input guardrails** — run before/alongside the agent:

```typescript
import { defineInputGuardrail } from '@openai/agents';

const farmingOnlyGuardrail = defineInputGuardrail({
  name: 'farming_only',
  async execute(ctx, agent, input) {
    const checker = new Agent({
      name: 'Topic Checker',
      instructions: 'Is this about farming? Return JSON: { isOnTopic: boolean }',
      outputType: z.object({ isOnTopic: z.boolean() }),
    });
    const result = await Runner.run(checker, input);
    return {
      outputInfo: result.finalOutput,
      tripwireTriggered: !result.finalOutput.isOnTopic,
    };
  },
});
```

**Output guardrails** — run on the final response:
```typescript
const noFabricatedMetrics = defineOutputGuardrail({
  name: 'no_fabricated_metrics',
  async execute(ctx, agent, output) {
    const containsFabrication = /research shows.*%|studies prove/i.test(output);
    return { tripwireTriggered: containsFabrication };
  },
});
```

**Two execution modes for input guardrails:**
- **Parallel (default):** runs alongside agent (lower latency but may consume tokens before blocking)
- **Blocking:** finishes check before agent starts (zero token waste if rejected)

### 5.8 Tracing & Debugging

Tracing is on by default: captures model generations, tool calls, agent spans, handoffs, and guardrail checks.

```typescript
import { setTracingDisabled, addTraceProcessor, ConsoleSpanExporter } from '@openai/agents';

// Disable tracing
setTracingDisabled(true);

// Local debugging
addTraceProcessor(new ConsoleSpanExporter());
```

**Sensitive data controls:** set `trace_include_sensitive_data: false` in RunConfig. Hosted tracing dashboard requires an OpenAI account; self-hosted tracing via OpenTelemetry.

### 5.9 Key Limitations & Gotchas

1. **Pre-1.0 (v0.17.0):** breaking changes between minor versions; pin the version
2. **OpenAI-centric defaults:** default model is `gpt-5.4-mini`; non-OpenAI models require `@openai/agents-extensions`
3. **No automatic hand-back:** after a handoff, control does not return automatically
4. **Guardrail timing:** parallel mode may consume tokens before blocking; use blocking mode for cost-sensitive apps
5. **Set `maxTurns`:** always — the SDK loops indefinitely if the agent keeps calling tools
6. **No built-in long-term memory:** must implement conversation persistence via Supabase
7. **No native i18n:** multi-language handling must be implemented at the application level (dynamic instructions based on selected locale)
8. **No workflow engine:** no built-in support for long-running tasks that survive server restarts

### 5.10 OpenAI Agents SDK vs LangChain

| Aspect | OpenAI Agents SDK | LangChain / LangGraph |
|---|---|---|
| **Complexity** | Minimal, few primitives | Large ecosystem, steep learning curve |
| **Multi-agent** | Native handoffs and agent-as-tool | LangGraph: directed state machine |
| **Tools** | Simple `tool()` with Zod | Extensive but more boilerplate |
| **Streaming** | Built-in `StreamedRunResult` | Supported but more configuration |
| **Guardrails** | Native input/output/tool guardrails | Via moderation chains or custom |
| **Tracing** | Built-in, zero-config | Requires LangSmith (paid) |
| **Token efficiency** | Handoffs use LLM to decide routing | LangGraph deterministic routing (cheaper) |
| **TypeScript maturity** | Rapidly maturing, well-maintained | Mature but complex |
| **Suitability for Agropioo** | **Excellent** — lightweight, fast to build | Overkill for the use case |

**Verdict:** The OpenAI Agents SDK is the right choice. It is lightweight enough for the project's "reuse before adding" principle, handoffs naturally handle query routing, tool integration with Zod is type-safe, and the Next.js Route Handler pattern is officially supported. LangChain adds complexity without proportional benefit for this use case.

### 5.11 Recommended Architecture for Agropioo Advisor

```
┌──────────────────────────────────────────────────────┐
│  Triage Agent (cheap model, multilingual)             │
│  instructions: detect query language + type,          │
│  route to specialist, inject farmer profile context   │
│                                                        │
│  handoffs:                                            │
│  ├── Weather Agent     → get_weather tool             │
│  ├── Crop Advisor      → crop_db, disease tools       │
│  ├── Schemes Agent     → schemes_db tool              │
│  ├── Farm Data Agent   → get_my_farms, get_my_records │
│  │                       get_my_crop_history tools     │
│  └── General Advisor   → knowledge_base tool          │
│                                                        │
│  guardrails:                                          │
│  ├── input: farming_only topic check                  │
│  └── output: no_fabricated_metrics check              │
└──────────────────────────────────────────────────────┘
```

**Product data integration:** The Farm Data Agent (or tools on the general advisor) queries the farmer's own Supabase data — farms table, farm_records, and future feature tables (detect results, price bookmarks, scheme subscriptions). All product data tools are scoped to the authenticated user via `context.accountId`. As new product features ship, new tools are added without architectural changes.

Each agent's instructions include the farmer's context (language, province, crops) injected dynamically. The triage agent uses `gpt-4o-mini` for cost efficiency; specialist agents can use the same or a higher-tier model for quality.

---

## 6. Existing Solutions — Lessons Learned

### 6.1 Digital Green / Farmer.Chat (India, Africa)

**Architecture**: RAG pipeline with GPT-4, expert-verified knowledge base (15+ years of content), WhatsApp/Telegram delivery.

**Key findings**:
- Cost per farmer advisory dropped from $35 to $0.35 (100x reduction)
- Initially deployed as a tool for human advisors, not farmer-facing — reduced risk while iterating
- Image input for crop disease detection significantly increased engagement
- Average response time of ~9 seconds is acceptable to farmers (they prioritize accuracy over speed)
- NPS of 60+ among users; women reported even higher satisfaction
- **Failure mode**: users lacked physical inputs (seeds, chemicals) to act on advice — advice must be locally actionable
- **Gap**: market price data was missing, which farmers needed most

Sources: [OpenAI case study](https://openai.com/index/digital-green/), [BMZ Digital](https://www.bmz-digital.global/en/how-ai-is-transforming-farming-advice/), [Scaling paper](https://arxiv.org/html/2409.08916v2)

### 6.2 Krishi Saathi (India)

**Architecture**: LLM-based conversational assistant connected to government agricultural knowledge base, supporting 11 Indic languages.

**Key findings**:
- Dramatically reduced advisor response times at call centers
- Human advisors use it to look up and send climate forecasts + advice in regional languages
- Future iterations need live market rates and plant disease data
- Centered on government-verified content for trust

Sources: [SPIE paper](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/14183/1418315/Krishi-Saathi--a-farmer-centric-conversational-assistant-for-scalable/10.1117/12.3109424.full)

### 6.3 AgriSage / AgriBot (Pakistan-focused research)

**Architecture**: Android app with crop disease prediction + chatbot for farmer advisory.

**Key findings**:
- Disease detection via image classification is a high-value feature
- Farmers need location-specific advice (same crop, different zones = different advice)
- Local language support is non-negotiable for adoption

Source: [Wiley](https://onlinelibrary.wiley.com/doi/full/10.1002/eng2.70342)

### 6.4 Common Patterns Across All Successful Deployments

1. **Start with verified content**: no system launched with auto-generated knowledge bases
2. **Human-in-the-loop first**: deploy to advisors before farmers
3. **Translate-RAG over native generation**: translate at the boundary, reason in English
4. **Multimodal input**: text + image + voice covers varying literacy levels
5. **Familiar delivery channels**: WhatsApp/Telegram integration outperforms standalone apps
6. **Follow-up suggestions**: clickable options help farmers who can't articulate precise questions
7. **Local measurements and crop names**: using standard metric units confuses farmers
8. **Graceful degradation**: when the system doesn't know, it says so and points to a human resource
9. **Continuous content expansion**: analyze failed queries to identify knowledge gaps

---

## 7. Recommendations for Agropioo Advisor (Demo Scope)

### 7.1 Minimum Viable Advisor

Given the hackathon build order (`/advisor` is #4, text chat only), the demo should include:

1. **Knowledge base**: curated content for Pakistan's top 5 crops (wheat, cotton, rice, sugarcane, maize) covering:
   - Crop calendar (sowing/harvesting windows)
   - Top 5 diseases per crop (identification + treatment)
   - Fertilizer schedules
   - 2–3 major government schemes (Kissan Card, fertilizer subsidy)

2. **RAG pipeline**:
   - pgvector for embeddings (no new dependency)
   - `text-embedding-3-small` for cost efficiency at demo scale
   - Semantic chunking for crop guides; fixed-size with overlap for general content
   - Similarity search via Supabase RPC

3. **Multilingual (English + Urdu for demo)**:
   - Accept input in English, Urdu (native script), and Roman Urdu
   - Respond in the same language/script as the input
   - RTL layout for Urdu responses
   - Translate-RAG pattern: translate query to English for retrieval, generate response, translate back

4. **Query routing via OpenAI Agents SDK handoffs**:
   - Triage agent routes to specialist agents via handoffs
   - Weather Agent → weather API tool
   - Crop Advisor → crop disease database tool
   - Farm Data Agent → get_my_farms, get_my_records tools (queries farmer's own Supabase data)
   - Schemes Agent → government schemes tool
   - General Advisor → knowledge base RAG tool
   - Fallback: "I don't have information on this. Please contact your nearest agriculture office."

5. **Product data integration** (extensible as features ship):
   - Farmer's farms: list, details, location, crop types
   - Farm records: planting history, harvest dates, inputs used, yields
   - Future: `/detect` results, `/prices` bookmarks, `/schemes` subscriptions, notification history
   - All tools scoped to authenticated user via `context.accountId`
   - New product features = new advisor tools, no architectural changes needed

6. **Conversation context**:
   - Store conversation history in database
   - Inject farmer profile (location, crops) from onboarding into system prompt
   - Keep last 10 messages as context

7. **Response formatting**:
   - Structured template: Problem → Cause → What to do → When → Caution
   - Short sentences, local measurements
   - Follow-up suggestion buttons
   - Source attribution where possible

### 7.2 Technical Decisions to Make (for Plan Phase)

| Decision | Recommendation | Rationale |
|---|---|---|
| Agent framework | `@openai/agents` SDK (TypeScript) | Lightweight, native handoffs, built-in guardrails/tracing, official Next.js pattern. LangChain is overkill. |
| Vector DB | pgvector via Supabase | Already in stack; no new dependency per AGENTS.md |
| Embedding model | `text-embedding-3-small` | Cost-effective; sufficient for demo; upgrade to `-large` for production |
| LLM | `gpt-4o-mini` for demo; `gpt-4o` for production | Cost control during development; quality adequate for demo |
| Knowledge base format | Markdown files → chunked → embedded at build time | Simple to manage; can be admin-editable later |
| Translation approach | In-prompt translation via system instructions | Avoids separate translation API; GPT-4o handles translation well for Urdu |
| Chat storage | New `conversations` + `messages` tables in Supabase | Persistent; queryable; aligns with existing schema approach |
| Response streaming | Server-Sent Events from Route Handler | Progressive display; better perceived latency |

### 7.3 Out of Scope for Demo

- Voice input/output (text chat only per AGENTS.md)
- Image-based disease detection (lives in `/detect` feature)
- Languages beyond English + Urdu
- Expert/agronomist role (out of scope per AGENTS.md)
- IVR phone mode, SMS alerts
- WhatsApp/Telegram integration (web chat only for demo)
- Real-time mandi price feeds (use static/stub data)

---

## Sources

### RAG & Agriculture
- [Empowering farmers with AI: RAG-based LLM advisory framework (ResearchGate)](https://www.researchgate.net/publication/400128255_Empowering_farmers_with_artificial_intelligence_a_retrieval-augmented_generation_based_large_language_model_advisory_framework)
- [AgroLLM: Connecting Farmers and Agricultural Practices (MDPI)](https://www.mdpi.com/2624-7402/8/1/38)
- [Enhancing AI-Driven Farming Advisory in Kenya with RAG (ACL)](https://aclanthology.org/2025.africanlp-1.5/)
- [From chatbots to grounded systems (GenAI Food Industry)](https://genai-food-industry.com/en/agrifood-genai-rag-grounded-systems)
- [Scaling AI-Powered Agricultural Services for Smallholder Farmers (arXiv)](https://arxiv.org/html/2409.08916v2)

### Chunking & Vector DBs
- [Chunking Strategies for LLM Applications (Pinecone)](https://www.pinecone.io/learn/chunking-strategies/)
- [Vector Chunking 2026: Strategies, Sizes, Wins (Future AGI)](https://futureagi.com/blog/vector-chunking-2025/)
- [RAG Pipelines: Vector DB Benchmarks & Chunking (Dev.to)](https://dev.to/pooyagolchian/rag-pipelines-in-production-vector-database-benchmarks-chunking-strategies-and-hybrid-search-data-gbl)
- [Vector search with Next.js and OpenAI (Supabase)](https://supabase.com/docs/guides/ai/examples/nextjs-vector-search)

### Multilingual & Low-Resource Languages
- [Building and evaluating multilingual RAG systems (Microsoft/Medium)](https://medium.com/data-science-at-microsoft/building-and-evaluating-multilingual-rag-systems-943c290ab711)
- [Investigating Language Preference of Multilingual RAG Systems (arXiv)](https://arxiv.org/html/2502.11175v3)
- [Qalb: Urdu Large Language Model for 230M speakers (arXiv)](https://arxiv.org/html/2601.08141v1)
- [Benchmarking LLMs across Urdu (ACL)](https://aclanthology.org/2025.chipsal-1.3/)
- [ERUPD: English to Roman Urdu Parallel Dataset (arXiv)](https://arxiv.org/html/2412.17562v1)
- [Framing Political Bias in Multilingual LLMs — Pakistani Languages (arXiv)](https://arxiv.org/html/2506.00068v3)
- [Stanford HAI: LLM Challenges in Low-Resource Language Contexts](https://hai.stanford.edu/policy/mind-the-language-gap-mapping-the-challenges-of-llm-development-in-low-resource-language-contexts)
- [OpenAI Embedding Models and API Updates](https://openai.com/index/new-embedding-models-and-api-updates/)
- [Languages supported by text-embedding-3-large (OpenAI Community)](https://community.openai.com/t/languages-supported-by-text-embedding-3-large/673406)

### RTL & UI
- [RTL Language Support in Chatbots (MoochaAI)](https://www.moochatai.com/blog/rtl-language-support-chatbot)
- [Working with Arabic in UX (Substack)](https://hlockeux.substack.com/p/working-with-arabic-in-ux-2c74383fc463)
- [Quick guideline for RTL UI (Medium)](https://medium.com/techradiant/quick-guideline-for-rtl-ui-2da60615b655)

### Existing Solutions
- [Digital Green: AI for Farmers, by Farmers](https://www.digitalgreen.org/)
- [OpenAI: Digital Green — Building agricultural database for farmers](https://openai.com/index/digital-green/)
- [BMZ Digital: How AI is transforming farming advice](https://www.bmz-digital.global/en/how-ai-is-transforming-farming-advice/)
- [Krishi Saathi: farmer-centric conversational assistant (SPIE)](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/14183/1418315/Krishi-Saathi--a-farmer-centric-conversational-assistant-for-scalable/10.1117/12.3109424.full)
- [IFPRI: GenAI voice technology in agricultural advisory (India)](https://www.ifpri.org/blog/generative-ai-powered-voice-technology-in-agricultural-advisory-services-lessons-from-india/)

### Pakistan Agriculture Data
- [Pakistan Bureau of Statistics: Agriculture Sector](https://www.pbs.gov.pk/agriculture-sector-of-pakistan-importance-role-key-statistics/)
- [Agriculture Extension in Pakistan: Challenges and Ways Forward (AESA)](https://aesanetwork.org/agriculture-extension-in-pakistan-challenges-and-ways-forward/)
- [Pakistan Meteorological Department](https://pmd.gov.pk/)
- [LMKT: Weather API for PMD](https://lmkt.com/lmkt-develop-weather-api-mobile-application-pakistan-meteorological-department/)
- [AMIS Punjab: Agricultural Commodity Prices](http://www.amis.pk/ViewPrices.aspx?searchType=1&commodityId=1)
- [Zarai Mandi: Pakistan Commodity Price Platform](https://www.zaraimandi.com/)
- [AgriPunjab: Ongoing Projects and Schemes](https://agripunjab.gov.pk/ongoing_projects)
- [PAR: REST API for Agricultural Data](https://www.par.com.pk/services/rest-api)
- [FEWS NET: Pakistan Data Book](https://help.fews.net/fde/v3/pakistan-data-book)
- [ICIMOD: Pakistan Climate Services Dashboard](https://www.icimod.org/pakistan-launches-online-climate-services-dashboard-to-support-agricultural-production/)
- [Wheat diseases and pests in Pakistan: nationwide assessment (CABI)](https://www.cabidigitallibrary.org/doi/10.31220/agriRxiv.2025.00366)
- [AgriSage: Android App for Farmers (Wiley)](https://onlinelibrary.wiley.com/doi/full/10.1002/eng2.70342)
- [AIM Innovation Package: Digital Advisory Services for Agriculture](https://aimforscale.org/wp-content/uploads/2025/10/AIM-for-Scale-Innovation-Package-Digital-Advisory-Services-for-Agriculture-August-2025.pdf)
- [AI in Agriculture across South Asia (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2666188825011803)

### Conversation Architecture
- [Building Conversational AI: Memory Patterns & Context Management (Dev.to)](https://dev.to/bspann/building-conversational-ai-memory-patterns-context-management-and-conversation-design-2i58)
- [Best practices for context management in long AI chats (OpenAI Community)](https://community.openai.com/t/best-practices-for-cost-efficient-high-quality-context-management-in-long-ai-chats/1373996)
- [Building AI Chatbot With Persistent Memory (Mem0)](https://mem0.ai/blog/ai-chatbot-development-with-persistent-memory)
- [OpenAI Function Calling Guide](https://developers.openai.com/api/docs/guides/function-calling)

### OpenAI Agents SDK
- [OpenAI Agents SDK TypeScript — GitHub](https://github.com/openai/openai-agents-js)
- [OpenAI Agents SDK TypeScript — Documentation](https://openai.github.io/openai-agents-js/)
- [@openai/agents NPM Package](https://www.npmjs.com/package/@openai/agents)
- [Agents SDK Guide — OpenAI Developers](https://developers.openai.com/api/docs/guides/agents)
- [Building Agents — OpenAI Developers](https://developers.openai.com/tracks/building-agents)
- [OpenAI Agents SDK Handoffs, Guardrails, and Tracing](https://masterprompting.net/blog/openai-agents-sdk-handoffs-guardrails-tracing)
- [OpenAI Agents SDK Production Guide 2026](https://niteagent.com/blog/openai-agents-sdk-production-guide-2026/)
- [Best AI Agent SDKs Compared 2026](https://www.requesty.ai/blog/best-ai-sdks-compared-2026-langchain-crewai-openai-anthropic-google)
- [Building AI Agents with OpenAI Agents SDK (Zach Codes)](https://zach.codes/p/the-new-agents-sdk-from-openai)
- [OpenAI Agents SDK Review (Mem0)](https://mem0.ai/blog/openai-agents-sdk-review)
- [TypeScript AI Agent Frameworks for Next.js 2026](https://www.arcade.dev/blog/typescript-ai-agent-frameworks/)
