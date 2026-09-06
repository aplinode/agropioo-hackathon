# Plan — App-Control Chat

## Goal

Build a floating, multi-tab conversational interface that lets farmers control the entire Agropioo app through natural text chat with image attachments, interactive response cards, and human-in-the-loop confirmation for write actions.

## Key Decisions (locked)

- **Agent**: Hybrid — OpenAI Agents SDK handles routing and read actions; a custom confirmation/multi-step layer manages HITL flows.
- **Streaming**: New SSE event types (`tool_start`, `tool_result`, `action_card`, `navigation_button`, `retry`) alongside existing `text`/`done`/`error`.
- **Attachments**: Single `/api/app-control/chat` multipart endpoint (max 10 MB, JPEG/PNG/WebP).
- **Navigation**: Explicit allowlist of farmer-app routes; agent cannot navigate outside it.
- **Page context**: React context provider at layout level; pages push rich state (farmId, season, etc.) into it.
- **Conversations**: Dedicated tables (`app_control_conversations`, `app_control_messages`) with per-feature summaries.
- **Multi-tab**: Sidebar list of past conversations inside the panel; active conversation loads into a single chat box with its own streaming state and abort controller.
- **Memory**: App-control summaries only; advisor summaries are not shared.
- **Reminders**: Deferred — agent suggests but does not directly create scheduled reminders.
- **Accessibility**: `prefers-reduced-motion` respected for bubble pulse; 44×44px touch targets; RTL per-message.

## Architecture

```
app/(farmer)/(dashboard)/layout.tsx  →  PageContext provider + AppControlFloatingChat
app/(farmer)/(dashboard)/app-control/  →  Chat panel route (optional full-page entry)
components/app-control/  →  Shared UI pieces
app/api/app-control/  →  Route handlers
lib/app-control/  →  Agent, tools, streaming, context
```

**Note**: The panel UI was simplified to a single conversation view with an inline sidebar for past conversations, instead of true multi-tab.

## Database

### Migration: `app_control_conversations`

```sql
CREATE TABLE app_control_conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'New conversation',
  language    text        NOT NULL DEFAULT 'en',
  summary     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_control_conv_account_updated
  ON app_control_conversations(account_id, updated_at DESC);
ALTER TABLE app_control_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_control_conv_select_own"
  ON app_control_conversations FOR SELECT USING (true);
CREATE POLICY "app_control_conv_insert_own"
  ON app_control_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "app_control_conv_update_own"
  ON app_control_conversations FOR UPDATE USING (true);
CREATE POLICY "app_control_conv_delete_own"
  ON app_control_conversations FOR DELETE USING (true);
```

### Migration: `app_control_messages`

```sql
CREATE TABLE app_control_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES app_control_conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('farmer', 'agent', 'system')),
  content         text        NOT NULL,
  attachments     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_control_msg_conv_created
  ON app_control_messages(conversation_id, created_at);
ALTER TABLE app_control_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_control_msg_select"
  ON app_control_messages FOR SELECT USING (true);
CREATE POLICY "app_control_msg_insert"
  ON app_control_messages FOR INSERT WITH CHECK (true);
```

Notes:
- `attachments` is jsonb — stores `[{type, url, name, size}]` for image references.
- RLS policies match the advisor pattern: permissive INSERT/UPDATE because the app enforces `account_id` scoping in queries.
- Summary generation follows the same secondary-call pattern as advisor (`lib/advisor/streaming.ts:60-90`).

## API Routes

### `POST /api/app-control/chat` (multipart)

Replaces the advisor's JSON-only pattern. Accepts `multipart/form-data`:
- `message` (text, required)
- `conversationId` (text, optional)
- `attachments` (files, optional, max 10 MB each, JPEG/PNG/WebP)

Flow:
1. `requireSessionApi()` — 401 if no session.
2. Dual rate limit: `app-control-chat` (IP) and `app-control-chat-account` (account).
3. Zod validation: message 1–2000 chars; attachments validated for type/size.
4. Create conversation if `conversationId` omitted.
5. Load last 20 messages + page context from React context provider (sent as header or derived from route).
6. Build `AppControlContext` (extends `FarmerContext` with `currentPath`, `pageState`, `attachments`).
7. Create app-control agent with tools + guardrails.
8. Run with streaming + new event schema.
9. Persist messages + update `updated_at` in `onFinished`.
10. Generate summary via secondary call.

**Client-side note**: The existing advisor client uses `fetch` with JSON. For multipart, use `FormData`. The SSE reader logic stays identical — only the request body changes.

### `GET /api/app-control/conversations`

List conversations for the account. Same shape as advisor: `{ conversations: ConversationMeta[] }`.

### `POST /api/app-control/conversations`

Create conversation. Returns `{ id, title }`.

### `GET /api/app-control/conversations/[id]`

Single conversation metadata.

### `PATCH /api/app-control/conversations/[id]`

Rename. Body: `{ title }`.

### `DELETE /api/app-control/conversations/[id]`

Delete with confirmation on client (same ConfirmDialog pattern as advisor sidebar).

### `GET /api/app-control/messages/[conversationId]`

List messages for a conversation. Returns `{ messages: AppControlMessage[] }`.

## Agent & Tools

### `lib/app-control/agent.ts`

Creates the app-control agent. Hybrid architecture:

```ts
export function createAppControlAgent(ctx: AppControlContext) {
  // SDK Agent handles read actions and routing
  const agent = new Agent({
    name: "AppControl",
    instructions: APP_CONTROL_INSTRUCTIONS,
    model: appControlModel(),
    tools: [
      // Read/navigation tools (SDK-managed)
      navigateToPage,
      getFarmSummary,
      getRecordDetails,
      getPriceSummary,
      getWeatherSummary,
      // Advisor handoff
      handoffToAdvisor,
    ],
    handoffs: [],
    inputGuardrails: appControlInputGuardrails,
    outputGuardrails: appControlOutputGuardrails,
  });

  // Custom HITL layer wraps write tools
  // The frontend sends follow-up messages; the agent tracks confirmation state via prompt instructions
  return agent;
}
```

### `lib/app-control/tools/`

- `navigate-to-page.ts` — validates target against allowlist, returns navigation event.
- `get-farm-summary.ts` — read-only farm data.
- `get-record-details.ts` — read-only record data.
- `create-record.ts` — write tool; returns confirmation card, waits for user Yes/No.
- `update-record.ts` — write tool; shows diff card, waits for confirmation.
- `delete-record.ts` — write tool; confirms before deleting.
- `handoff-to-advisor.ts` — emits navigation event to `/advisor`.

**Confirmation pattern**: Write tools return a structured `action_card` event with the proposed action. The UI renders Yes/No buttons. When the user taps Yes, the frontend sends a follow-up message like "Confirm: yes" and the agent's instructions tell it to execute the pending action. If No, the agent cancels.

### `lib/app-control/context.ts`

`AppControlContext` extends `FarmerContext`:
- `currentPath: string`
- `pageState: Record<string, unknown>` — e.g., `{ selectedFarmId, selectedSeason, selectedCrop }`
- `attachments: Attachment[]` — processed image references

## Streaming

### `lib/app-control/streaming.ts`

Extends `toSSEStream` with new event types:

| Event | When emitted | UI action |
|-------|-------------|-----------|
| `conversation` | Start of stream | Bind follow-up to conversation ID |
| `text` | Text delta | Append to streaming bubble |
| `tool_start` | Agent begins a tool call | Show progress indicator |
| `tool_result` | Tool returns data | Render action card or update state |
| `action_card` | Structured data (price table, P&L summary) | Render formatted card |
| `navigation_button` | Agent offers navigation | Render "Go to X" button |
| `retry` | Action failed | Render retry button |
| `done` | Stream complete | Finalize message, persist |
| `error` | Stream error | Show error state |

The `toSSEStream` function signature changes to accept a richer event emitter. The client (`app-control-chat.tsx`) parses all event types and routes them to the appropriate UI state.

## UI Components

### `components/app-control/app-control-floating-chat.tsx`

The outer shell that exists on every farmer page. Manages:
- Floating bubble (minimized state) with pulse animation + unread dot.
- Expanded 85vh modal overlay panel.
- Persistence across navigations (Next.js `usePathname` change does not unmount because this lives in the Server layout).
- Z-index: bubble `z-50`, panel `z-50` (below `ConfirmDialog` at `z-[60]`).

### `components/app-control/app-control-panel.tsx`

The expanded chat panel. Contains:
- Single conversation view with inline sidebar for past conversations.
- Chat area + composer.
- Minimize/close buttons.

### `components/app-control/app-control-chat.tsx`

The main chat client. Extends `advisor-chat.tsx` with:
- Single conversation state (`messages`, `streamingText`, `thinking`, `error`, `abortController`).
- Inline sidebar toggle for past conversations list.
- New conversation creation.
- Conversation deletion via `ConfirmDialog`.
- Attachment support: file input + thumbnail preview in composer.
- Structured event rendering: `action_card`, `navigation_button`, `retry` events render as interactive elements.
- `Show more` expandable sections for long responses.
- Per-message `dir` via `textDirection()`.
- Per-step 30-second timeout for confirmations (client-side timer + agent prompt instruction).

### `components/app-control/action-card.tsx`

Renders structured cards inside chat bubbles:
- Price tables (market, variety, rate).
- P&L summaries (income, expenses, net).
- Weather forecasts (day, condition, temperature).
- Record diffs (old vs new values).
- Navigation buttons (primary action).
- Retry buttons (error recovery).

### `components/app-control/chat-composer.tsx`

Extends advisor composer with:
- File attachment button + thumbnail preview.
- Multipart `FormData` submission.
- Image validation feedback (type, size).

### `components/app-control/chat-bubble.tsx`

Renders a single message bubble. Handles:
- Farmer vs agent styling.
- RTL per-message.
- Interactive elements (buttons, cards) embedded in agent bubbles.
- Expandable sections.

## Page Context Provider

### `lib/app-control/page-context.tsx`

```tsx
"use client";
import { createContext, useContext } from "react";

type PageContext = {
  currentPath: string;
  pageState: Record<string, unknown>;
};

const PageContext = createContext<PageContext>({ currentPath: "", pageState: {} });

export function PageContextProvider({ children, currentPath, pageState }: { children: ReactNode; currentPath: string; pageState: Record<string, unknown> }) {
  return <PageContext.Provider value={{ currentPath, pageState }}>{children}</PageContext.Provider>;
}

export function usePageContext() { return useContext(PageContext); }
```

### Integration in layout

`app/(farmer)/(dashboard)/layout.tsx` wraps children with `PageContextProvider`. Each page pushes its state:

```tsx
// Example: app/(farmer)/(dashboard)/profit-loss/page.tsx
<PageContextProvider currentPath="/profit-loss" pageState={{ selectedSeason: "Rabi 2025-26" }}>
  {children}
</PageContextProvider>
```

The app-control chat reads this context via `usePageContext()` and sends it with every message to the API.

## i18n

### New bundle: `lib/i18n/app-control-bundle.ts`

Follows the existing pattern (`getAdvisorBundle`, `getFarmsBundle`). Returns `AppControlBundle` type with all chat UI strings.

### Catalog keys needed

All strings visible in the app-control chat UI. Must be added to:
- `catalog/en.ts`, `catalog/ur.ts`, etc.
- `translations` table in Neon (all 8 locales) before merge.

Key groups:
- Floating bubble: aria labels, pulse state.
- Panel: minimize, maximize, close, new tab.
- Tabs: tab titles, close confirmation.
- Sidebar: new conversation, rename, delete, empty state.
- Chat: empty welcome, suggested commands, composer placeholder, send button, thinking indicator, error messages, retry, show more.
- Action cards: navigation button labels, confirmation prompts, diff labels.
- Composer: attachment button, file too large, unsupported type.

## Validation

### `lib/validation/app-control.ts`

```ts
export const appControlChatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
});

export const attachmentSchema = z.object({
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().max(10 * 1024 * 1024), // 10 MB
  url: z.string().url(),
});
```

## Migration Steps

1. Create `db/migrations/0008_app_control.sql` with `app_control_conversations` and `app_control_messages`.
2. Apply migration via Neon MCP or `scripts/sync-translations.mts` equivalent for DB changes.
3. Add catalog keys for all 8 locales.
4. Insert DB rows in `translations` table for all new keys.

## Task Breakdown

1. **Database**: Create migration `0008_app_control.sql` with conversations + messages tables + RLS.
2. **Validation**: Add `lib/validation/app-control.ts` with chat + attachment schemas.
3. **Rate limiting**: Add `app-control-chat` and `app-control-chat-account` scopes to `lib/auth/rate-limit.ts` `RATE_RULES`.
4. **Context**: Build `lib/app-control/page-context.tsx` provider; wire into `app/(farmer)/(dashboard)/layout.tsx`.
5. **Streaming**: Extend `lib/app-control/streaming.ts` with new SSE event types (`tool_start`, `tool_result`, `action_card`, `navigation_button`, `retry`).
6. **Agent**: Build `lib/app-control/agent.ts` with hybrid SDK + custom HITL layer; add tools in `lib/app-control/tools/`.
7. **Route handlers**: Build `app/api/app-control/chat/route.ts` (multipart), conversations routes, messages route.
8. **i18n**: Create `lib/i18n/app-control-bundle.ts`; add catalog keys for all 8 locales.
 9. **UI shell**: Build `components/app-control/app-control-floating-chat.tsx` (bubble + panel).
 10. **Chat client**: Build `components/app-control/app-control-chat.tsx` with single conversation state, inline sidebar for past conversations, structured events, attachments.
 11. **Composer**: Build `components/app-control/chat-composer.tsx` with file attachment + preview.
 12. **Action cards**: Build `components/app-control/action-card.tsx` for price tables, P&L, diffs, nav buttons, retry.
 13. **Bubbles**: Build `components/app-control/chat-bubble.tsx` with RTL per-message, expandable sections, interactive elements.
 14. **Page integration**: Mount `AppControlFloatingChat` in layout; add `PageContextProvider` to key pages (dashboard, farms, records, prices, profit-loss, detect).
 15. **Translations**: Insert all new keys into Neon `translations` table for all 8 locales.
 16. **Verify**: `npm run lint`, `npm run build`, manual run-through of acceptance criteria.

## Open Questions (resolved)

- Hybrid agent approach ✅
- Single conversation with sidebar history ✅
- New SSE event types for structured responses ✅
- Single multipart endpoint for attachments ✅
- Explicit navigation allowlist ✅
- Per-step 30-second timeout for confirmations ✅
- Navigation handoff for advisor redirect ✅
- App-control-only conversation memory ✅
- Defer reminders to existing/future system ✅
- All authenticated pages + `prefers-reduced-motion` + unlimited tabs ✅
- React context provider for page state ✅

## Risks

- **Multipart + SSE**: Next.js Route Handlers can stream multipart uploads, but the interaction between `request.formData()` and `Response(body = readableStream)` needs verification. If problematic, split into a separate upload endpoint returning a reference ID.
- **Z-index conflicts**: The floating panel must layer correctly above `BottomTabBar` (`z-40`) and `AppSidebar` (`z-40`) but below `ConfirmDialog` (`z-[60]`). Test on mobile where the tab bar occupies the bottom edge.
- **Multi-tab state divergence**: Each tab's optimistic UI must stay in sync with server state. Re-fetch messages after send, don't rely on local-only updates.
- **Agent confirmation state**: The hybrid layer must reliably track which action is pending confirmation. If the agent loses track, the user taps "Yes" and nothing happens. Prompt engineering + explicit state markers in tool outputs mitigate this.
- **RTL interactive elements**: Buttons and cards inside RTL bubbles must not flip. Test with Urdu text containing English labels (e.g., "Go to Prices").
