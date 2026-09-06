# Research — App-Control Chat Agent

## 1. How this is usually done

### Conversational app control / agentic chat interfaces

Production agentic chat interfaces (e.g., ChatGPT with function calling, Claude with tool use, Microsoft Copilot) treat the chat surface as an **action layer**, not just a Q&A layer. The dominant pattern is:

- **Tool-use agents**: The model is given a schema of available actions (create_record, navigate, delete, etc.). When the model decides to act, it emits a structured tool call instead of prose. The server executes the tool and feeds the result back into the model loop. This is the pattern the OpenAI Agents SDK (`@openai/agents`) formalizes via `Agent`, `tool()`, `handoff()`, and the `run()` loop. The existing Agropioo advisor already uses this: `lib/advisor/agents/triage.ts:141` creates a `Triage` agent with `tools` and `handoffs`, and `app/api/advisor/chat/route.ts:217` runs it with `stream: true`.

- **Human-in-the-loop (HITL) for writes**: Industry consensus (and the AG-UI / agentic-design patterns) separates read actions (autonomous) from write actions (approval-gated). For consequential writes (create, update, delete), the agent describes the intended action in plain language and presents Yes/No buttons. The Agropioo spec already encodes this in FR-7, but the existing advisor has no write tools — it is read-only advisory. App-control chat is the first feature that needs HITL at scale.

- **Chat-as-UI-layer with rich responses**: Modern agentic UIs inject interactive elements directly into chat bubbles: navigation buttons, action cards, retry buttons, mini-page previews. This is sometimes called **Generative UI (GenUI)** or structured response rendering. The spec's FR-4 (navigation buttons, confirmation prompts, action cards, retry buttons, mini page previews, expandable sections) maps directly to this pattern. The existing `MarkdownRender` component (`app/(farmer)/(dashboard)/advisor/markdown-render.tsx`) only handles markdown; interactive elements would require a new renderer or extension.

- **Multi-step dialogue management**: For complex tasks (e.g., creating an expense requires amount, category, date, farm), the agent breaks the task into steps and asks one clarifying question at a time. This is implemented via **conversation state** — the agent's instructions tell it to wait for the next user turn before proceeding. The OpenAI Agents SDK's `maxTurns` parameter (`app/api/advisor/chat/route.ts:220` sets `maxTurns: 10`) limits loop depth. The spec's FR-8 and FR-18 both call for guided sequential dialogue with a 30-second timeout per confirmation.

- **Streaming progressive responses**: SSE streaming is the de facto standard for chat. The existing advisor uses `toSSEStream` (`lib/advisor/streaming.ts:92`) which wraps the agent's `RunStreamEvent` async iterator and emits `text` delta events. The client (`advisor-chat.tsx:204-243`) reads the stream with a `ReadableStreamDefaultReader`, buffers partial lines, and appends deltas to `streamingText`. This pattern is well-established and should be reused.

- **Page-aware context**: Agentic chat interfaces that control an app pass the current route/page as context with every message. The spec's FR-5 requires this. The existing advisor already receives `FarmerContext` (`lib/advisor/context.ts:13`) including `accountId`, `farms`, `district`, `currentSeason`, etc. App-control chat would extend this context object with `currentPath` and `pageState`.

- **RTL and multi-language chat**: RTL chat requires bidirectional text handling per-message, not just per-page. The existing advisor uses `textDirection()` (`advisor-chat.tsx:26-28`) which detects Arabic/Urdu script per message and sets `dir="rtl"` on individual bubbles. The spec requires full RTL layout for 7 locales. The i18n system already supports this via `LOCALE_REGISTRY` (`lib/i18n/config.ts:34-107`) and `formatNumber` (`lib/i18n/format.ts:30`) for Eastern Arabic-Indic numerals.

### What works in production

- **Separate conversation tables per feature**: The codebase already has `advisor_conversations` / `advisor_messages` and `detect_chats` / `detect_messages`. App-control chat should follow the same pattern with its own tables.
- **SSE streaming with abort/retry**: The existing client uses `AbortController` (`advisor-chat.tsx:53,175`) to cancel in-flight requests. This pattern handles concurrent requests and tab switching.
- **Dual rate limiting**: Per-IP and per-account limiting (`app/api/advisor/chat/route.ts:142-147`) prevents abuse without blocking legitimate heavy users.
- **Guardrails on input and output**: The advisor applies `inputSanitizationGuardrail`, `farmingOnlyGuardrail`, `promptInjectionGuardrail` on input and `noFabricationGuardrail`, `safetyBoundaryGuardrail`, `languageConsistencyGuardrail`, `outputLengthGuardrail` on output (`lib/advisor/guardrails.ts`). App-control chat would need similar guardrails plus action-scoping guardrails.

---

## 2. Main approaches and trade-offs

### Agent framework: OpenAI Agents SDK vs custom

**OpenAI Agents SDK (chosen in spec FR-10)**
- **Pros**: Already used by the advisor (`@openai/agents` is in `package.json:18`). Provides `Agent`, `tool()`, `handoff()`, guardrails, streaming, and the `run()` loop out of the box. The triage agent pattern (`lib/advisor/agents/triage.ts`) can be extended with app-control tools rather than rebuilt.
- **Cons**: The SDK is opinionated about orchestration. Multi-step HITL flows (ask → confirm → execute → report) require careful prompt engineering because the SDK manages the agent loop internally. The app-control agent needs to pause for user confirmation between turns, which means the frontend must send a follow-up message and the agent must remember it is mid-confirmation. This is doable but requires explicit instruction in the system prompt.
- **Trade-off**: Reusing the SDK avoids a second agent runtime, but the app-control agent will need its own `Agent` instance with a distinct tool set and instructions. The existing `createTriageAgent` function would not be shared directly; instead, a new `createAppControlAgent` would be created.

**Custom agent loop**
- **Pros**: Full control over turn management, confirmation state machines, and tool execution timing. Easier to implement explicit "waiting for confirmation" states.
- **Cons**: Reinventing orchestration, streaming, and guardrails that the SDK already provides. More code to test and maintain. The project already chose the SDK for the advisor, so consistency argues for reuse.

### Chat UI pattern: floating panel vs full page vs drawer

**Floating panel (spec FR-1, FR-17)**
- **Pros**: Persists across page navigations. The farmer can chat while viewing any page. Matches the spec's "universal remote" metaphor.
- **Cons**: Complex lifecycle management — the panel must survive client-side navigations (`next/navigation`), handle z-index stacking with existing modals, and not interfere with page content. The existing `BottomTabBar` uses `z-40` (`components/shell/bottom-tab-bar.tsx:40`) and `AppSidebar` uses `z-40` (`components/shell/app-sidebar.tsx:53`). The chat bubble and panel would need `z-50` or higher, plus careful handling on mobile where the bottom tab bar already occupies the bottom edge.
- **Trade-off**: The spec explicitly requires floating behavior. Implementation should mirror the existing `advisor-sidebar.tsx` pattern of `fixed inset-y-0 start-0 z-50` for the expanded panel and a smaller fixed bubble for the minimized state.

**Full page (current advisor pattern)**
- **Pros**: Simpler — no floating lifecycle, no overlay management, full viewport for chat.
- **Cons**: Breaks the "control the app from anywhere" use case. The farmer must navigate to `/advisor` to use the chat. The spec explicitly rejects this for app-control chat (FR-1 says "alongside the existing advisor chat").

**Drawer**
- **Pros**: Common on mobile. Can slide up from bottom.
- **Cons**: On desktop, a side drawer competes with the existing `AppSidebar`. An 80% modal overlay (spec FR-1) is closer to a centered dialog than a drawer.

### Conversation persistence strategy

**Dedicated tables per feature (current pattern)**
- The codebase uses separate tables: `advisor_conversations` / `advisor_messages` (`db/migrations/0003_advisor.sql:9-32`) and `detect_chats` / `detect_messages` (`db/migrations/0007_detect_chats.sql:3-18`).
- **Pros**: Clean separation, independent retention policies, simpler RLS/permission scoping.
- **Cons**: Duplicated schema logic. The app-control tables would need the same `id`, `account_id`, `title`, `created_at`, `updated_at` pattern.
- **Trade-off**: Follow the existing pattern. Create `app_control_conversations` and `app_control_messages` tables.

**Shared conversations table with a `type` column**
- **Pros**: Single table, easier to query cross-feature.
- **Cons**: Messier RLS, harder to add feature-specific columns later. The existing codebase does not do this — it uses per-feature tables.

### Streaming approach

**SSE with text deltas (current advisor pattern)**
- `lib/advisor/streaming.ts:92-162` converts the agent's `RunStreamEvent` stream into SSE `text` events. The client reassembles with a line buffer.
- **Pros**: Works with Next.js Route Handlers, supports backpressure via `ReadableStream`, abortable via `AbortController`.
- **Cons**: SSE is HTTP/1.1 oriented; no built-in binary support. For app-control chat, the stream may also need to carry **tool call events** (e.g., "I'm creating your expense...") so the UI can show progress. The current SSE format only emits `text`, `conversation`, `done`, and `error` events. A richer event schema (e.g., `tool_start`, `tool_result`, `action_card`) would be needed for interactive cards.

**WebSocket**
- **Pros**: Full-duplex, richer event types.
- **Cons**: Not used anywhere in the codebase. Next.js Route Handlers support WebSocket upgrades but require explicit handling. SSE is sufficient for the current scope.

### Attachment handling

**Server-side validation, no permanent storage**
- The spec FR-15 says attachments are validated for type and size (max 10 MB, JPEG/PNG/WebP) and processed server-side. They are not stored permanently unless part of a created record.
- The existing detect feature already handles image uploads via Cloudinary (`cloudinary` is in `package.json:23`). The `DetectUpload` component handles file selection and preview.
- **Trade-off**: App-control chat should reuse the same validation and upload pipeline. A new `/api/app-control/upload` endpoint (or extending the chat endpoint to accept multipart) would be needed. The existing chat route (`app/api/advisor/chat/route.ts`) only accepts JSON — it would need to be extended or a new endpoint created.

### RTL / i18n in chat

**Per-message direction detection**
- The existing advisor already does this: `textDirection()` (`advisor-chat.tsx:26-28`) detects Arabic/Urdu script per message and applies `dir="rtl"` to individual bubbles.
- The locale-level direction (`localeDir`) is applied to the composer and outer layout.
- **Trade-off**: This pattern is already proven. App-control chat should reuse it exactly.

### Multi-tab conversation management

**Sidebar + active conversation state**
- The existing advisor uses `AdvisorSidebar` (`advisor-sidebar.tsx`) with `activeId`, `onSelect`, `onNew`, `onRename`, `onDelete`. The client component (`advisor-chat.tsx:42-43`) tracks `conversations` and `activeConvId`.
- **Pros**: Works well for desktop (sidebar always visible) and mobile (drawer overlay toggled by a button).
- **Cons**: The spec requires multiple conversations open in **separate tabs** within the chat panel (FR-19). The existing advisor only supports one active conversation at a time. True multi-tab would require a tab bar inside the chat panel, with each tab maintaining its own message list and streaming state. This is a UI addition, not a backend change.

---

## 3. What in the existing project it must fit

### Existing advisor chat system

**Route handlers**
- `app/api/advisor/chat/route.ts:137-248` — POST handler that:
  1. Calls `requireSessionApi()` for auth.
  2. Applies dual rate limiting (`hitLimiter` per-IP and per-account).
  3. Validates input with Zod (`chatSchema`).
  4. Creates a conversation if `conversationId` is omitted.
  5. Loads recent messages (max 20), user profile, farms, and conversation summaries.
  6. Builds `FarmerContext` and calls `createTriageAgent(ctx)`.
  7. Runs the agent with `stream: true, maxTurns: 10`.
  8. Wraps the result in `toSSEStream` which emits `conversation`, `text`, `done`, `error` events.
  9. Persists messages and updates `updated_at` in the `onFinished` callback.
  10. Generates a conversation summary via a secondary OpenAI call.

- `app/api/advisor/conversations/route.ts` — GET list, POST create.
- `app/api/advisor/conversations/[id]/route.ts` — GET single, PATCH rename, DELETE.
- `app/api/advisor/messages/[conversationId]/route.ts` — GET messages for a conversation.

**Client components**
- `app/(farmer)/(dashboard)/advisor/advisor-chat.tsx:1-488` — Main chat client:
  - Uses `useState` for conversations, activeConvId, messages, draft, thinking, error, sidebarOpen, streamingText.
  - SSE reading with `reader.read()`, line buffering, and JSON parsing.
  - `AbortController` to cancel in-flight requests on conversation switch.
  - Per-message `dir` via `textDirection()`.
  - Empty state with suggested questions.
  - Composer with text input and send button.
  - No attachment support (text only).

- `app/(farmer)/(dashboard)/advisor/advisor-sidebar.tsx:1-191` — Sidebar with conversation list, rename inline edit, delete confirmation dialog.
- `app/(farmer)/(dashboard)/advisor/confirm-dialog.tsx:1-119` — Accessible modal with focus trap, Escape key, backdrop click.
- `app/(farmer)/(dashboard)/advisor/markdown-render.tsx:1-110` — Markdown renderer using `react-markdown` + `remark-gfm`.
- `app/(farmer)/(dashboard)/advisor/advisor-bundle.ts:1-45` — Type-safe translation bundle shape for the advisor.

### Current agent architecture

**Triage agent with handoffs**
- `lib/advisor/agents/triage.ts:16-158` creates a `Triage` agent with:
  - `instructions`: Large system prompt with farmer context, routing rules, language rules, proactive alerts, safety rules.
  - `model`: `advisorModel()` returns `gpt-4o-mini` (env override available).
  - `tools`: `searchKnowledgeBase`, `conversationMemory`.
  - `handoffs`: `cropAdvisor`, `weatherAdvisor`, `farmDataAdvisor`, `pricesAdvisor`, `schemesAdvisor`, `handoffAdvisor`, `cropRecommendationAdvisor`.
  - `inputGuardrails`: `advisorInputGuardrails` (sanitization, farming-only, prompt injection).
  - `outputGuardrails`: `advisorOutputGuardrails` (no fabrication, safety, language consistency, output length).

**Specialist agents**
- Each specialist (e.g., `createFarmDataAgent` in `lib/advisor/agents/farm-data-agent.ts`) is an `Agent` with its own tools and instructions. The farm-data agent uses `createFarmDataTools` (`lib/advisor/tools/farm-data.ts:86-416`) which returns `get_my_farms`, `get_my_records`, `get_farm_details`, `check_soil_crop_fit`, `get_my_weather_records`, `get_my_farm_weather`.

**Tool pattern**
- Tools are created with `tool({ name, description, parameters, execute })` from `@openai/agents`.
- Parameters are Zod schemas with `.describe()` for the model.
- Tools return **text** — not structured data. The model formats the tool output into prose. This is important for app-control chat: if the agent needs to return structured cards (price tables, navigation buttons), the current "return text" pattern is insufficient. The agent would need to emit a special marker or the UI would need to parse markdown-like syntax.

**Streaming**
- `lib/advisor/streaming.ts:1-168` handles:
  - SSE encoding with `TextEncoder`.
  - `output_text_delta` events from the agent stream.
  - `conversation` event to bind follow-up messages.
  - `done` event with final output.
  - `error` event.
  - Post-stream: `checkLanguageConsistency` filter, message persistence via `onFinished` callback, summary generation via secondary OpenAI call.

### UI component patterns

**Floating / fixed elements**
- `BottomTabBar` (`components/shell/bottom-tab-bar.tsx:38-40`): `fixed inset-x-0 bottom-0 z-40`.
- `AppSidebar` (`components/shell/app-sidebar.tsx:53`): `fixed inset-y-0 start-0 z-40 hidden lg:flex`.
- `AdvisorSidebar` (`app/(farmer)/(dashboard)/advisor/advisor-sidebar.tsx:63,70`): backdrop `fixed inset-0 z-40`, aside `fixed inset-y-0 start-0 z-50`.
- `ConfirmDialog` (`app/(farmer)/(dashboard)/advisor/confirm-dialog.tsx:69`): `fixed inset-0 z-[60]`.
- `profit-loss/confirm-modal.tsx:36`: `fixed inset-0 z-50`.

**Z-index hierarchy observed**
- `z-40`: backdrop, bottom tab bar, app sidebar.
- `z-50`: advisor sidebar, modals.
- `z-[60]`: confirm dialog.
- `z-[70]`: language switcher dropdown.
- `z-[9999]`: dropdowns/autocompletes (farm form, crop search).

**Implication for app-control chat**: The floating bubble should be `z-50` (above tab bar, below critical modals). The expanded panel should be `z-50` or `z-[60]` to overlay page content but stay below confirmation dialogs.

**Modals and dialogs**
- `ConfirmDialog` pattern: fixed backdrop with `bg-agro-ink/40`, centered white card, focus trap, Escape key, `aria-modal="true"`.
- `ConfirmModal` in profit-loss: similar but with variant styles (danger, warning, default).
- These should be reused for action confirmations in the app-control chat.

**Forms and validation**
- `react-hook-form` + `zodResolver` is used everywhere (`record-form.tsx:31-33`, `farm-form.tsx:708-710`).
- Validation schemas live in `lib/validation/` (e.g., `lib/validation/farms.ts`, `lib/validation/advisor.ts`).
- Server-side validation in route handlers returns uniform `{ error: { code, message } }` shape.

### Authentication / session handling

- `lib/auth/guards.ts:37-41` — `requireSessionApi()` reads the JWT from the httpOnly cookie via `readValidPass("session")`. Returns `SessionContext` (`{ accountId, email }`) or `null`.
- All protected API routes call this first and return 401 if null.
- Pages/layouts use `requireSessionPage()` which redirects to `/{locale}/login`.
- The farmer app layout (`app/(farmer)/(dashboard)/layout.tsx:13`) calls `requireSessionPage()` — this is the single choke point.

### Rate limiting

- `lib/auth/rate-limit.ts:34-49` — `hitLimiter(scope, key, limit, windowMs)` uses an in-memory `Map`. Returns `true` if allowed.
- `lib/http.ts:81-103` — Alternative `rateLimit()` function with fixed-window buckets and LRU-style cleanup (max 5000 keys).
- Advisor chat uses both: `hitLimiter("advisor-chat", clientIp(request), 30, HOUR_MS)` and `hitLimiter("advisor-chat-account", session.accountId, 50, HOUR_MS)` (`app/api/advisor/chat/route.ts:142-147`).
- `RATE_RULES` in `rate-limit.ts:15-27` defines pinned limits for auth routes. App-control chat would need new scopes (e.g., `app-control-chat`, `app-control-chat-account`).

### Database schema

**Migrations directory**: `db/migrations/` contains ordered SQL files:
- `0001_translations.sql` — `translations` table (key, locale, value, status).
- `0002_auth.sql` — `users`, `pass_states`, `verification_codes`, `sessions`.
- `0003_advisor.sql` — `advisor_conversations`, `advisor_messages`, `advisor_knowledge_documents`, `advisor_knowledge_chunks`.
- `0003_farm_records.sql` — `farms`, `records`.
- `0007_detect_chats.sql` — `detect_chats`, `detect_messages`.

**Pattern**: Each migration uses `CREATE TABLE IF NOT EXISTS`, adds indexes, and enables RLS with permissive policies for the advisor (since the app enforces `account_id` scoping in queries). The app-control chat tables should follow the same pattern.

**Existing tables relevant to app-control actions**:
- `farms` — `id`, `account_id`, `name`, `location`, `district`, `lat`, `lng`, `crops` (jsonb), `acres`, `growth_stages` (jsonb), `archived_at`.
- `records` — `id`, `farm_id`, `account_id`, `type`, `season`, `year`, `event_date`, `title`, `note`, `weather` (jsonb), `yield_qty`, `labor_cost`, `transport_cost`.
- `users` — `id`, `email`, `full_name`, `phone`, `password_hash`.
- `sessions` — `id`, `account_id`, `created_at`, `expires_at`, `revoked_at`.

**Database client**: `lib/db.ts:22-66` — single `Pool` instance, `query<T>()`, `queryOne<T>()`, `withTransaction<T>()`. All route handlers import from this module.

### Translation / i18n system

- **Catalog files**: `catalog/en.ts`, `catalog/ur.ts`, etc. — TypeScript objects with string keys and translated values. `catalog/index.ts:22-31` assembles `CATALOG`.
- **Database overlay**: `lib/i18n/server.ts:51-88` — `getDictionary(locale)` queries `translations` table with `SELECT key, locale, value FROM translations WHERE locale = ANY($1) AND status = 'translated'`. DB rows overlay the catalog; missing keys fall back to English.
- **Server bundles**: `getAdvisorBundle()`, `getFarmsBundle()`, `getDetectBundle()`, etc. — server-only functions that build flat TypeScript objects from the dictionary and pass them as props to client components.
- **Client usage**: Components receive bundles as props and never call the DB directly.
- **Direction and formatting**: `LOCALE_REGISTRY` provides `dir` per locale. `formatNumber` uses `Intl.NumberFormat` with Eastern Arabic-Indic numerals for local languages. `formatRelativeTime` uses `Intl.RelativeTimeFormat`.
- **Implication for app-control chat**: A new `getAppControlBundle()` function and a new `AppControlBundle` type would be needed. All new UI strings must have catalog keys and DB rows for all 8 locales.

### Brand / design system

- **Tokens**: Defined in `docs/brand-colors.md`. All colors are `--color-agro-*` CSS variables auto-generated as Tailwind utilities (e.g., `bg-agro-canopy`, `text-agro-forest`).
- **Green-dominant palette**: `agro-forest` (#013B1F), `agro-canopy` (#1C6428), `agro-leaf` (#3F8839), `agro-sprout` (#C1D8C1).
- **Semantic aliases**: `agro-success`, `agro-warning` (harvest gold), `agro-error`, `agro-info`.
- **Typography**: Playfair Display sparingly, DM Sans body, IBM Plex Mono/JetBrains Mono for data. The advisor uses `font-display` for headings and `font-mono` for eyebrow text.
- **Icons**: `components/icons.tsx` — shared SVG set. New icons should be added here.
- **Outdoor-mobile accessibility**: Body text ≥ 4.5:1 contrast, touch targets ≥ 44×44px, visible focus rings, `prefers-reduced-motion` respected, no horizontal scroll at 320px.
- **One gold moment rule**: `agro-wheat` is reserved for primary conversion CTAs. The app-control chat should not use it for routine buttons.

### Next.js conventions

- **App Router**: `app/` directory with route groups like `(farmer)/(dashboard)`.
- **Server Components by default**: Pages and layouts are async Server Components. Client components are marked `"use client"` at the smallest boundary.
- **Route Handlers**: `app/api/.../route.ts` files export `GET`, `POST`, `PATCH`, `DELETE`. They are the API layer — no separate Express backend.
- **No Server Actions**: Form submissions go through Route Handlers.
- **Metadata**: Pages export `metadata` objects.
- **Dynamic rendering**: `export const dynamic = "force-dynamic"` is used in layouts that need per-request data.
- **Search params**: In Next.js 16, `searchParams` is a `Promise` (see `app/(farmer)/(dashboard)/advisor/page.tsx:11`).
- **Image and font optimization**: `next/image` used for logo. Google Fonts loaded via Tailwind config.
- **Strict TypeScript**: No `any`, no non-null assertions, no `@ts-ignore`.

---

## 4. Failure modes and edge cases

### Agent hallucination

- **Risk**: The agent invents prices, weather data, or farm records that do not exist.
- **Current mitigation**: `noFabricationGuardrail` (`lib/advisor/guardrails.ts:146-172`) blocks fabricated statistics and fake citations. The advisor's tools return real data from the DB.
- **App-control gap**: If the agent is given write tools, it could hallucinate that an action succeeded when it did not. The backend must return the actual DB result (e.g., inserted row ID or error), and the UI must surface that result, not the agent's claim.
- **Mitigation**: All tool results should be passed back to the model verbatim. The agent's final response should be based on the tool output, not its prior assumption.

### Action confirmation failures

- **Risk**: The agent asks for confirmation, the user says "yes", but the action fails (validation error, DB constraint, network timeout). The user thinks it succeeded.
- **Current mitigation**: None — the advisor has no write tools.
- **Mitigation needed**: After executing a confirmed action, the route handler must return the actual outcome (success with record ID, or error with code). The UI should show a distinct "completed" or "failed" state. The spec FR-11 covers this: "When an action fails... the agent responds with a friendly explanation... and offers a retry option."

### Rate limiting under load

- **Risk**: The in-memory `hitLimiter` (`lib/auth/rate-limit.ts:34-49`) resets on redeploy. In a serverless environment with multiple instances, each instance has its own bucket, so limits are effectively multiplied.
- **Current mitigation**: The advisor applies dual limiting (IP + account) with generous windows (30/50 per hour). The `rateLimit()` function in `lib/http.ts:81-103` has a max-key cleanup.
- **App-control gap**: App-control chat will likely have higher throughput (every message triggers an agent run, which is expensive). The rate limits may need to be lower or token-based rather than request-based.
- **Mitigation**: Consider per-account token budgeting or a shared Redis limiter (noted in `rate-limit.ts:3` as the next step in ADR 0003).

### Attachment security

- **Risk**: Malicious file upload (e.g., SVG with embedded script, oversized file, wrong MIME type).
- **Current mitigation**: The detect feature uses Cloudinary for uploads, which handles MIME validation and virus scanning.
- **App-control gap**: The chat endpoint currently accepts JSON only (`app/api/advisor/chat/route.ts`). Adding multipart uploads requires a new endpoint or extending the existing one. The spec FR-15 says max 10 MB, JPEG/PNG/WebP only, server-side processing.
- **Mitigation**: Validate file type via magic bytes (not just extension), enforce size limit before reading the body, process images server-side (e.g., resize/compress with Sharp, which is already a dependency `@types/sharp` in `package.json:21`).

### RTL rendering bugs

- **Risk**: Mixed-direction text causes bidi corruption. English fallback text inside an RTL message reads backwards.
- **Current mitigation**: `textDirection()` (`advisor-chat.tsx:26-28`) applies `dir` per message. `localized()` (`lib/i18n/localized.tsx:11-19`) wraps English fallback in `<span lang="en" dir="ltr">`.
- **App-control gap**: Interactive elements (buttons, cards) inside chat bubbles need explicit `dir` attributes. Navigation buttons with English text inside an Urdu RTL bubble must not flip.
- **Mitigation**: Every interactive element inside a chat bubble should inherit `dir={textDirection(text)}`. Buttons with mixed content should use `dir="auto"` or explicit `dir="ltr"` for English-only labels.

### Conversation state corruption

- **Risk**: Two browser tabs open the same conversation. Both send messages. The `updated_at` and message history get interleaved.
- **Current mitigation**: The advisor client uses `AbortController` to cancel the previous request when switching conversations (`advisor-chat.tsx:107,175`). The backend loads the last 20 messages at request time, so late-arriving messages from another tab are included.
- **App-control gap**: Multi-tab conversations (spec FR-19) increase the risk. If the user has three conversations open and sends a message in each simultaneously, the optimistic UI updates in each tab may diverge.
- **Mitigation**: The backend should load messages fresh on each request (already done). The client should re-fetch messages after sending, rather than relying on optimistic updates. A `conversationId` is returned in the first SSE event, which binds follow-up messages.

### Session expiry mid-dialogue

- **Risk**: The farmer is in the middle of a multi-step confirmation (e.g., "yes, create the expense") and the session expires. The action is executed without a valid session, or the confirmation is lost.
- **Current mitigation**: `requireSessionApi()` returns 401 if the JWT is invalid. The advisor chat route checks this at the top (`app/api/advisor/chat/route.ts:138-139`).
- **App-control gap**: In a multi-step dialogue, the session could expire between the agent's question and the user's answer. The agent would receive a 401 on the follow-up and lose context.
- **Mitigation**: The frontend should check session validity before sending (e.g., call a lightweight `/api/auth/check` endpoint). If the session is expired, prompt the user to sign in before proceeding. The spec FR-13 says "If the session expires, the agent prompts the user to sign in."

### Partial action failures

- **Risk**: An action has multiple steps (e.g., create record + send notification). Step 1 succeeds, step 2 fails. The agent must not pretend the whole action succeeded.
- **Current mitigation**: None — no multi-step write actions exist yet.
- **Mitigation**: Route handlers should use `withTransaction` (`lib/db.ts:52-65`) for multi-step writes. If any step fails, the transaction rolls back. The agent receives a single error message and reports it honestly.

### Network interruptions during streaming

- **Risk**: The SSE stream drops mid-response. The client shows a partial message and a spinner. The user retries and gets a duplicate response.
- **Current mitigation**: The client catches `AbortError` and network errors (`advisor-chat.tsx:258-263`) and shows `bundle.errors.network`. The `onFinished` callback in `toSSEStream` saves messages only after the stream completes.
- **App-control gap**: If the stream drops after the agent executed a tool but before the final response, the action may have succeeded on the server but the client shows an error. The user may retry and create a duplicate.
- **Mitigation**: Tool execution should be idempotent where possible. For non-idempotent actions (create, delete), the confirmation flow ensures the user explicitly approves, but the client should still handle duplicate submissions by disabling the send button during streaming and re-fetching conversation state on error.

### Ambiguous intent resolution

- **Risk**: The farmer says "add it" without context. The agent guesses which farm, which record type, etc.
- **Current mitigation**: The advisor asks clarifying questions. The spec FR-21 says: "When the farmer requests an action involving a specific farm but does not specify which one, the agent auto-selects the farm if there is only one registered farm. If multiple farms exist, the agent asks which farm to use before proceeding."
- **Mitigation**: The agent's instructions must encode disambiguation rules. The context object should include the farm list so the agent can count them.

### Unauthorized action attempts

- **Risk**: The agent tries to access or modify another farmer's data.
- **Current mitigation**: Every route handler calls `requireSessionApi()` and scopes queries to `account_id`. Example: `app/api/advisor/conversations/[id]/route.ts:21-24` checks `account_id = $2`.
- **App-control gap**: App-control tools will execute route handlers that create/update/delete records. These handlers must enforce the same `account_id` scoping. The tools themselves should not trust the agent's claims about which farm/record belongs to the user.
- **Mitigation**: Every tool that queries data should include `account_id = $1` in the WHERE clause. The `createFarmDataTools` pattern (`lib/advisor/tools/farm-data.ts:96-98`) shows explicit ownership checks before returning data.

### Large attachment handling

- **Risk**: A 10 MB image causes the request to time out or the server to OOM.
- **Current mitigation**: None for chat. The detect feature streams uploads to Cloudinary.
- **Mitigation**: Enforce size limit at the client (disable send button if attachment > 10 MB) and at the server (reject before reading full body). Use streaming upload to Cloudinary or a local temp file with `sharp` for compression.

### Empty / ambiguous input

- **Risk**: Empty messages, very long messages, or messages with no actionable intent.
- **Current mitigation**: The advisor rejects messages > 2000 chars (`app/api/advisor/chat/route.ts:157-164`). Empty messages are blocked by Zod (`lib/validation/advisor.ts:3-10`).
- **App-control gap**: The spec FR-16 says empty messages should show a welcome message with suggested commands. Very long messages (> 2000 chars) should be truncated with a notice.
- **Mitigation**: Reuse the same Zod validation and token estimation (`estimateTokens` at `route.ts:131-135`). For empty messages, return a structured welcome response with suggested commands instead of an error.

### Language detection mid-conversation

- **Risk**: The farmer switches from Urdu to English mid-dialogue. The agent responds in the wrong language.
- **Current mitigation**: The advisor's triage instructions say "respond in the dominant language of their message" and "match the farmer's language per-message." The `languageConsistencyGuardrail` checks for mixing within a single response.
- **App-control gap**: The app-control agent needs the same language rules. The spec FR-11 says "Language detection works per-message — the farmer can switch languages mid-conversation."
- **Mitigation**: Include the same language rules in the app-control agent's system prompt. Reuse `checkLanguageConsistency` from `lib/advisor/streaming.ts:12-52` or the guardrail.

### Multi-tab race conditions

- **Risk**: The farmer opens two conversations in the app-control chat panel. Sends a message in tab A, then quickly switches to tab B and sends another. The responses arrive out of order.
- **Current mitigation**: The advisor client aborts the previous request when switching conversations (`advisor-chat.tsx:107,175`). App-control would need the same pattern, extended to tab-level abort controllers.
- **Mitigation**: Each tab maintains its own `AbortController`. Switching tabs aborts the in-flight request for that tab. The UI should disable the send button while `thinking` is true for the active tab.
