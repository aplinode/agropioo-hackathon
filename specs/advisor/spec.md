# Advisor — Spec

> `/advisor` — conversational AI farming advisor for Pakistani farmers. Text chat only. Multilingual (English + Urdu for launch, extensible to all constitution languages). Retrieves both general farming knowledge and the farmer's own product data. Government scheme information is delivered through the advisor (no standalone `/schemes` page).

---

## 1. Goal

Give every farmer a knowledgeable advisor they can talk to in their own language — one that understands their question, looks up the right information (from a verified farming knowledge base, real-time data sources, and the farmer's own records), and gives a clear, actionable answer. The advisor has a professional-but-warm tone: friendly in greetings and encouragement, direct and actionable when delivering advice. It proactively cross-references data to surface risks the farmer may not have noticed. The advisor replaces the current demo's canned keyword-matched replies with a real AI that can reason about farming problems.

---

## 2. User Scenarios

| # | When the farmer… | They get… |
|---|---|---|
| S1 | Opens `/advisor` for the first time | A warm greeting that acknowledges their name, their farms, and the current season — establishing that the advisor already knows them. |
| S2 | Asks a crop disease question (e.g. "my wheat leaves have yellow stripes") | A structured answer in markdown: what the disease likely is, what causes it, step-by-step treatment, timing, and safety cautions — sourced from the verified knowledge base, not invented. |
| S3 | Asks about weather ("will it rain this week?") | A forecast for their farm's location (same data source as `/weather`), with practical cross-referenced advice (e.g. "don't spray today — rain is expected tomorrow"). |
| S4 | Asks about their own farm data ("when did I plant my cotton?") | A smart answer pulled from their actual farm records — with analysis and advice layered on top (e.g. "You planted cotton on April 12. It's now 65 days old — flowering stage. Check for bollworm this week."). |
| S5 | Asks "how are my farms doing?" | A summary of all farms with current crop stage, cross-referenced with weather and seasonal advisories, flagging any upcoming actions or risks. |
| S6 | Asks about government schemes ("is there a subsidy for fertilizer?") | Information about relevant schemes they may be eligible for, with eligibility criteria and how to apply — answered inline, no separate page. |
| S7 | Asks about market prices ("what's wheat selling for at the mandi?") | Current or recent mandi prices for the crop and market they're interested in. |
| S8 | Asks something outside farming (e.g. "tell me a joke", "who won the match") | A polite decline that redirects to farming topics — the advisor stays on-topic. |
| S9 | Asks something the advisor doesn't know | An honest "I don't have information on this" with a suggestion to contact their local extension officer — never fabricated answers. |
| S10 | Types in Urdu script | A reply in Urdu script, with the chat layout rendered right-to-left. |
| S11 | Types in Roman Urdu ("meri gandum mein zang lag gaya") | A reply in proper Urdu script (not Roman), with the layout rendered right-to-left. |
| S12 | Types in English | A reply in English, with the layout rendered left-to-right. |
| S13 | Taps a suggested follow-up question | That question is sent as if they typed it — same response flow. |
| S14 | Returns to a previous conversation | Their message history is intact and they can continue where they left off. |
| S15 | Starts a new conversation | A fresh session, but the advisor still knows their farm profile from onboarding. |
| S16 | Has a long conversation (15+ messages) | The advisor maintains context of recent messages and doesn't lose the thread. |
| S17 | Sees the advisor's response | It streams progressively — text appears as it generates, not after a long blank wait. |
| S18 | Asks about weather, then disease, then their own records — all in Urdu | The multi-agent routing handles each query seamlessly, maintaining conversation flow and language consistency throughout. |
| S19 | Tries to send a photo in the chat | A message explaining that photo detection is available at `/detect`, with a link to navigate there. |
| S20 | Wants to clean up old conversations | They can delete or rename individual conversations from the sidebar. |
| S21 | The AI service is temporarily unavailable | A clear "service temporarily unavailable" message — not a crash, not a blank screen. |

---

## 3. Functional Requirements

### FR-1: Conversation Interface
- **FR-1.1:** The advisor page shows a scrollable message transcript with the farmer's messages on one side and the advisor's replies on the other.
- **FR-1.2:** A text input field at the bottom of the screen lets the farmer type a message and send it.
- **FR-1.3:** A "thinking" indicator shows while the advisor is generating a response.
- **FR-1.4:** Responses stream progressively — text appears incrementally as it is generated, not after the full response is ready.
- **FR-1.5:** The transcript auto-scrolls to the newest message.
- **FR-1.6:** Suggested follow-up questions appear below the advisor's response as tappable buttons. Tapping one sends it as the farmer's next message.
- **FR-1.7:** Advisor responses render markdown formatting — bold text, bullet points, numbered lists, and headings — to make structured advice scannable.
- **FR-1.8:** On mobile, the chat occupies the full screen (no bottom tab bar visible). A back button or toggle returns to the dashboard.
- **FR-1.9:** Image/photo uploads are blocked in the chat. If the farmer attempts to attach an image, the advisor responds with a message directing them to `/detect` for crop disease photo detection.

### FR-2: Opening Message
- **FR-2.1:** When a new conversation starts, the advisor sends a warm opening message that includes: the farmer's name, a summary of their registered farms (count and crop types), and the current growing season (Kharif or Rabi).
- **FR-2.2:** The opening message is accompanied by 3–4 suggested starter questions relevant to their farms and the current season.
- **FR-2.3:** If the farmer has no registered farms, the opening message acknowledges this and suggests registering a farm, while still offering general farming questions.

### FR-3: Multilingual Support
- **FR-3.1:** The advisor detects the language of the farmer's input and responds in the same language.
- **FR-3.2:** When the input is in Urdu script, the response is in Urdu script and the entire chat UI renders right-to-left (mirrored layout).
- **FR-3.3:** When the input is in Roman Urdu, the response is in proper Urdu script (not Roman), with RTL layout.
- **FR-3.4:** When the input is in English, the response is in English with LTR layout.
- **FR-3.5:** Language detection works per-message — a farmer can switch languages mid-conversation and the advisor follows.
- **FR-3.6:** The chat layout direction (RTL/LTR) applies per-message based on the script of that message's content, so a mixed-language conversation renders correctly.

### FR-4: Query Routing (Multi-Agent)
- **FR-4.1:** The advisor routes queries to the appropriate specialist based on intent: crop disease/pest, weather, farm records, government schemes, market prices, or general farming advice.
- **FR-4.2:** Routing is automatic — the farmer does not choose a category; they just ask their question in natural language.
- **FR-4.3:** Multi-intent queries (e.g. "what's the weather and when should I spray my cotton?") are handled by invoking multiple specialists and combining the results into one coherent answer.

### FR-5: Farming Knowledge Base (RAG)
- **FR-5.1:** The advisor retrieves answers from a curated, expert-verified knowledge base covering Pakistan's major crops (wheat, cotton, rice, sugarcane, maize).
- **FR-5.2:** Knowledge base content includes: crop calendars (sowing/harvesting windows), top diseases per crop (identification + treatment), fertilizer schedules, and government scheme information (eligibility, benefits, how to apply).
- **FR-5.3:** Retrieved context is used to ground the response — the advisor does not invent facts, statistics, or treatment recommendations not found in the knowledge base.
- **FR-5.4:** When retrieval confidence is low (no relevant content found), the advisor states clearly that it does not have information and suggests consulting a local extension officer.
- **FR-5.5:** Knowledge base content is written from public Pakistan agriculture sources (Punjab Agriculture Department advisories, PAR publications, extension guides). Approximately 20–30 articles covering the major crops and common issues.

### FR-6: Product Data Integration
- **FR-6.1:** The advisor can retrieve the farmer's own registered farms (name, location, size, crop types) when answering questions about their land or fields.
- **FR-6.2:** The advisor can retrieve the farmer's farm records (planting dates, harvest dates, inputs used, yields, crop stage) when answering questions about their farming history or current crop status.
- **FR-6.3:** When returning farm data, the advisor provides a smart summary with analysis and advice — not a raw data dump. For example: "Your wheat on Farm A was sown Nov 15. It's now 45 days old — first irrigation is due. Recommended: 60mm."
- **FR-6.4:** The advisor uses the farmer's profile data (location, crops, farm size) from onboarding to provide location-specific and crop-specific advice without the farmer having to repeat it.
- **FR-6.5:** All product data retrieval is scoped to the authenticated farmer — the advisor can only access the logged-in farmer's own data, never another farmer's.
- **FR-6.6:** Product data tools are extensible: as new product features ship (detect results, price bookmarks), corresponding advisor tools can be added without changing the architecture.

### FR-7: Real-Time Data
- **FR-7.1:** The advisor's weather tool uses the same data source as the `/weather` page — ensuring consistent weather information across the product.
- **FR-7.2:** The advisor can fetch market price data when asked about mandi prices (using available price data; stub data is acceptable for launch).

### FR-8: Proactive Advisory
- **FR-8.1:** The advisor cross-references available data to proactively surface risks and recommendations. For example: if the farmer asks about spraying pesticide and the weather forecast shows rain tomorrow, the advisor volunteers a warning.
- **FR-8.2:** When the farmer asks about a specific crop, the advisor checks farm records for planting dates and crop stage to tailor advice (e.g. "Your cotton is at flowering stage — check for bollworm").
- **FR-8.3:** Proactive advisories are relevant and concise — not generic warnings appended to every response.

### FR-9: Response Formatting
- **FR-9.1:** Farming advice responses follow a structured template where applicable: **Problem** → **Cause** → **What to do** (numbered steps) → **When** → **Caution**.
- **FR-9.2:** Responses use short sentences (maximum 15–20 words per sentence), plain language, and local measurements (maunds, kanals, marlas) instead of only metric units.
- **FR-9.3:** Responses never contain fabricated statistics, invented research citations, or made-up testimonials.
- **FR-9.4:** Where the knowledge base provides source attribution, the response includes it (e.g. "According to Punjab Agriculture Department advisory…").
- **FR-9.5:** Responses render markdown formatting (bold, italics, bullet points, numbered lists, headings) for readability.

### FR-10: Conversation Persistence & Management
- **FR-10.1:** Each conversation session is stored in the database with its messages, timestamps, and language.
- **FR-10.2:** The farmer can see a list of their past conversations in a sidebar within the `/advisor` page. The sidebar is toggleable (collapsed by default on mobile, visible on desktop).
- **FR-10.3:** The farmer can start a new conversation at any time via a "New Conversation" button.
- **FR-10.4:** The farmer can delete individual conversations from the sidebar.
- **FR-10.5:** The farmer can rename individual conversations for easy reference.
- **FR-10.6:** The last 10 messages from the current conversation are included as context in each advisor request, so the advisor maintains continuity.

### FR-11: Safety & Boundaries
- **FR-11.1:** The advisor refuses non-farming queries politely (e.g. politics, sports, personal advice) and redirects to farming topics.
- **FR-11.2:** The advisor never provides specific financial advice (invest, loans beyond scheme information) or medical advice.
- **FR-11.3:** The advisor never recommends pesticide dosages or chemical quantities that are not sourced from the verified knowledge base.
- **FR-11.4:** Rate limiting applies to advisor messages to protect limited API credits (specific limits defined in the plan).
- **FR-11.5:** The advisor has a professional-but-warm tone: friendly and encouraging in greetings and follow-ups, direct and factual when delivering advice.

### FR-12: Model Flexibility
- **FR-12.1:** The advisor architecture supports any LLM provider and model — not hardcoded to a specific model or API provider. The model and API key are configured via environment variables.
- **FR-12.2:** Switching models (e.g. from GPT-4o to Gemini to an open-source model) does not require code changes — only configuration changes.

### FR-13: Authentication
- **FR-13.1:** The advisor is only available to authenticated farmers — unauthenticated users are redirected to login.
- **FR-13.2:** Every advisor API request validates the farmer's session before processing.

### FR-14: Graceful Degradation
- **FR-14.1:** When the AI service is unavailable, the advisor shows a clear "service temporarily unavailable" message — not a crash or blank screen.
- **FR-14.2:** The message includes a retry option so the farmer can try again without reloading the page.

---

## 4. Edge Cases & Rules

| # | Situation | Expected behaviour |
|---|---|---|
| E1 | Empty message (farmer sends whitespace or nothing) | The message is not sent; the send button is disabled when the input is empty or whitespace-only. |
| E2 | Extremely long message (10,000+ characters) | The message is truncated or rejected with a character limit indicator (max 2,000 characters). |
| E3 | Rapid-fire messages (farmer sends 5 messages in 2 seconds) | Messages are queued or rate-limited; the advisor processes them in order without crashing or producing garbled responses. |
| E4 | Network failure mid-stream | The partial response is shown with an error indicator. A "retry" option lets the farmer resend the message. |
| E5 | Advisor API timeout (>30 seconds) | The request is aborted, an error message is shown, and the farmer can retry. |
| E6 | Farmer has no farms registered | The opening message acknowledges this and suggests registering a farm first. Product data tools return an empty result gracefully with a friendly explanation. |
| E7 | Farmer has no farm records | The advisor says it doesn't have records for that query yet and suggests adding farm records. |
| E8 | Query in an unsupported language (e.g. Chinese) | The advisor responds in English with a note that it currently supports English and Urdu. |
| E9 | Mixed-language input ("my gandum mein rust lag gaya hai") | The advisor detects the dominant script/language intent and responds appropriately (Urdu script response for Roman Urdu words, or English response for English-dominant input). |
| E10 | Offensive or abusive input | The advisor responds neutrally, does not engage with the abuse, and redirects to farming. |
| E11 | Duplicate conversation (farmer opens advisor in two browser tabs) | Each tab operates independently; messages from both tabs are stored in the same conversation session. |
| E12 | Conversation with 100+ messages | Older messages beyond the context window are summarized; recent messages are kept verbatim. The UI scrolls smoothly regardless of message count. |
| E13 | Knowledge base is empty or unavailable | The advisor can still answer using product data tools and general farming knowledge from the model, but clearly indicates when advice is not from the verified knowledge base. |
| E14 | Farmer asks the same question twice | The advisor recognizes the repeat (from conversation context) and either references its earlier answer or provides additional detail. |
| E15 | Farmer tries to attach/upload a photo | The upload is blocked. The advisor responds with a message directing the farmer to `/detect` for crop disease photo detection. |
| E16 | AI service is down or API key is invalid | A clear "service temporarily unavailable" message is shown with a retry button. No partial or garbled responses. |
| E17 | Rate limit exceeded | A message informs the farmer they've reached the limit and can try again later. No silent failures. |
| E18 | Farmer deletes a conversation | The conversation and all its messages are removed from the sidebar and database. Cannot be undone. |
| E19 | Farmer renames a conversation to an empty string | The rename is rejected; the original name is preserved. |
| E20 | Sidebar is opened on mobile | The sidebar overlays the chat (drawer style) with a backdrop. Tapping outside closes it. |

---

## 5. Out of Scope

- Voice input or output (text chat only — voice is a separate future feature)
- Image upload or photo analysis in the chat (crop disease photos go through `/detect`)
- Languages beyond English and Urdu for launch (Punjabi, Pashto, Sindhi, Saraiki, Balochi, Hindko added incrementally after Urdu ships)
- Standalone `/schemes` page (government scheme information is delivered through the advisor)
- Expert/agronomist role or advisor-to-advisor mode
- Community forum or peer-to-peer chat
- IVR phone mode or SMS alerts
- WhatsApp/Telegram delivery (web chat only for now)
- Real-time mandi price feeds from live APIs (stub data acceptable for launch)
- Scheduled push notifications or proactive push alerts from the advisor (proactive advisories only appear within active conversations, not as push notifications)
- Dark mode
- Existing canned demo data (`demo-data.ts`) — removed entirely when the real advisor ships

---

## 6. Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| AC-1 | Opening a new conversation shows a warm greeting with the farmer's name, farm summary, and current season | Manual: log in as a farmer with farms, open `/advisor`, verify greeting content |
| AC-2 | Opening a new conversation shows 3–4 relevant suggested questions | Manual: verify suggestion chips appear and are relevant to the farmer's crops/season |
| AC-3 | Sending a crop disease question returns a structured markdown response (Problem/Cause/What to do/When/Caution) | Manual: ask "my wheat leaves have yellow stripes", verify structured format with markdown rendering |
| AC-4 | Sending a weather question returns a location-specific forecast from the same data source as `/weather` | Manual: ask about weather, verify the response references the farmer's farm location and matches `/weather` data |
| AC-5 | Asking about the farmer's own farm data returns a smart summary with advice, not a raw data dump | Manual: ask "when did I plant my cotton?", verify response includes planting date + analysis + recommendation |
| AC-6 | Asking "how are my farms doing?" returns a cross-referenced summary of all farms | Manual: verify response covers all farms, current crop stages, and any weather/action advisories |
| AC-7 | Typing in Urdu produces an Urdu response with RTL layout | Manual: type an Urdu question, verify response is Urdu and layout is mirrored |
| AC-8 | Typing in Roman Urdu produces an Urdu-script response with RTL layout | Manual: type "meri gandum mein zang lag gaya", verify response is in Urdu script |
| AC-9 | Typing in English produces an English response with LTR layout | Manual: type an English question, verify response is English and LTR |
| AC-10 | Switching languages mid-conversation works | Manual: send an English message, then an Urdu message, verify both responses match the input language |
| AC-11 | Non-farming queries get a polite redirect | Manual: ask "who won the cricket match", verify the advisor declines and redirects to farming |
| AC-12 | Questions the advisor cannot answer get an honest "I don't know" | Manual: ask an obscure question, verify no fabricated answer and extension officer suggestion |
| AC-13 | Responses stream progressively (not after a full wait) | Manual: observe that text appears incrementally during response generation |
| AC-14 | Suggested follow-up questions appear and are tappable | Manual: verify chips render after a response and tapping one sends it as a message |
| AC-15 | Conversation history persists across page reloads | Manual: send messages, reload the page, verify all messages are still visible |
| AC-16 | The sidebar shows past conversations and can be toggled on mobile | Manual: open multiple conversations, verify sidebar lists them and toggle works |
| AC-17 | Starting a new conversation creates a fresh session | Manual: click "new conversation", verify empty transcript with fresh opening message |
| AC-18 | Deleting a conversation removes it from the sidebar | Manual: delete a conversation, verify it disappears from the list |
| AC-19 | Renaming a conversation updates its label in the sidebar | Manual: rename a conversation, verify the new name appears |
| AC-20 | Empty input cannot be sent | Manual: try to send an empty or whitespace-only message, verify send is blocked |
| AC-21 | Unauthenticated users cannot access the advisor | Manual: visit `/advisor` while logged out, verify redirect to login |
| AC-22 | The advisor never invents statistics or citations | Manual: ask 10 different farming questions, verify no fabricated numbers or fake source names |
| AC-23 | Proactive warnings appear when cross-referencing data reveals a risk | Manual: ask about spraying when rain is forecast, verify the advisor volunteers a weather warning |
| AC-24 | Rate limiting prevents runaway API usage | Manual: send messages rapidly beyond the limit, verify rate limit message is shown |
| AC-25 | Network errors show a graceful degradation message with retry | Manual: disconnect network mid-request, verify "service unavailable" message and retry button appear |
| AC-26 | Photo attachment attempts get a redirect to `/detect` | Manual: try to attach an image, verify redirect message appears |
| AC-27 | Government scheme questions are answered inline (no redirect to a separate page) | Manual: ask about fertilizer subsidies, verify full inline answer |
| AC-28 | The model/provider can be changed via environment variables without code changes | Manual: switch model in .env, restart, verify advisor works with new model |
| AC-29 | `npm run lint` and `npm run build` pass | Automated: run both commands, verify zero errors |
