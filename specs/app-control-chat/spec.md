# spec.md — App-Control Chat Agent

## Goal

Give farmers a conversational interface that lets them control the entire Agropioo app through natural text chat. Instead of navigating menus and filling forms manually, a farmer types or speaks (in a separate voice layer) what they want to do — "log my irrigation expense of 2000 rupees" or "show me my tomato prices" — and the chat agent executes the action, confirms the result, and navigates them to the relevant page. The chat is a universal remote for the app.

## User Scenarios

- A farmer opens the new app-control chat and types: "Mujhe apna 2000 rupees ka irrigation kharch add karo." The agent confirms: "Main aapke liye 2000 rupees ka irrigation kharch record kar raha hoon. Kya aap chahte hain main isay default farm par add karun?" The farmer replies "haan" and the record is created. The agent announces: "Kharch record kar diya hai. Aap isay Expenses page par dekh sakte hain." and offers a button to navigate there.
- A farmer asks: "Aaj mandi mein tomato ke kya rates hain?" The agent fetches live mandi prices, responds with the top markets and rates in a formatted card, and asks: "Kya aap chahte hain main aapko prices page par le jaun?" The farmer taps the "Go to Prices" button in the chat.
- A farmer says: "Mujhe apne sab farms dekhne hain." The agent navigates the user to the /farms page and sends a chat message: "Ab aap apne farms page par hain. Yahan aap apne sab farms ki list dekh sakte hain."
- A farmer on the profit-loss page opens the app-control chat and asks: "Is season mein mera kitna profit hua?" The agent uses page context to understand which season they mean, calculates profit/loss, presents a summary card in the chat, and asks if they want to see details on the profit-loss page.
- A farmer asks: "Mujhe gehu ke liye mausam ka mashwala chahiye." The agent fetches weather advisory for their farm location, presents the advice in markdown, and includes a button: "View Full Weather Advisory" that navigates to /weather.
- A farmer tries to delete a farm record: "Mera pehla record delete kar do." The agent confirms: "Kya aap sach mein pehla record delete karna chahte hain? Yeh action wapas nahi kiya ja sakta." The farmer says "nahi" and the agent cancels. If they said "haan", the record is deleted and confirmed.
- A farmer attaches a photo of a diseased leaf and asks: "Ye disease kya hai?" The agent processes the image, runs crop disease detection, and responds with the diagnosis and treatment steps in a structured card.
- The agent encounters an API error while fetching prices. It responds: "Maaf kijiye, mandi rates load karne mein problem ho gayi. Thoda baad dobara koshish karein." with a "Retry" button.

## Functional Requirements

### FR-1: Floating App-Control Chat
A dedicated floating chat interface exists alongside the existing advisor chat. A chat icon is visible on every authenticated farmer app page, positioned in the bottom corner. Tapping it opens a chat window that can be minimized to a floating bubble or maximized to an 80% modal overlay panel. The app-control chat has its own conversation history, independent from the advisor's conversations. The voice agent has its own separate icon and window — the two do not share UI.

### FR-2: App-Wide Action Execution
The chat agent can execute any action available in the app, including but not limited to:
- Creating, viewing, updating, and deleting farm records (expenses, activities, observations)
- Fetching weather advisories for specific farms
- Checking mandi prices and setting alerts
- Running crop disease detection from uploaded images
- Getting crop recommendations
- Viewing profit/loss summaries
- Navigating between any app page
- Setting reminders and scheduling future actions
- Answering general farming questions

Actions are executed through the same server-side route handlers and tool system, ensuring consistent authorization, validation, and data scoping.

### FR-3: Chat Input with Attachments
The chat composer supports text input and image attachments. The farmer can attach a photo (e.g., of a diseased crop) and ask a question about it. The agent processes the attachment alongside the text message.

### FR-4: Interactive Response Cards
The agent can inject interactive elements into its responses:
- **Navigation buttons:** "Go to Prices Page", "View Farm Details"
- **Confirmation prompts:** "Create this expense?", with Yes/No buttons
- **Action cards:** Structured summaries (price tables, weather forecasts, P&L summaries) rendered as formatted chat bubbles
- **Retry buttons:** Appear when an action fails, allowing the farmer to retry without re-typing
- **Mini page previews:** Simplified renderings of app pages (farm lists, price tables, record summaries) embedded directly in chat bubbles
- **Expandable sections:** Long responses are truncated by default with a "Show more" button to expand full details

### FR-5: Page-Aware Context
The chat agent receives the current page path and relevant page state as context. When the farmer is on the profit-loss page and asks about expenses, the agent knows which season/farm they are viewing and tailors its response accordingly. Context is passed with every message.

### FR-6: Voice Navigation
The agent can navigate the farmer to any page in the app. When navigation occurs via a button tap or explicit request, the agent announces the destination and the current page's purpose. The chat persists as a floating panel across page navigations — it does not close when the farmer navigates.

### FR-7: Confirmation for Writes
Before executing any write action (create, update, delete, archive), the agent describes what it will do and asks the farmer to confirm. The farmer confirms via text input or by tapping a Yes/No button in the chat. The agent waits for explicit affirmative response before proceeding.

### FR-8: Guided Multi-Step Dialogue
For complex actions that require multiple pieces of information (e.g., creating an expense requires amount, category, date, and farm), the agent breaks the task into steps and guides the farmer through each one sequentially. The agent asks one clarifying question at a time, validates each response, and proceeds only when it has enough information. The farmer can also provide all details in a single message if they prefer.

### FR-9: Conversation Persistence
Every chat exchange is stored in a dedicated `app_control_conversations` and `app_control_messages` table (separate from advisor conversations). Conversations appear in a sidebar list and can be reviewed, renamed, and deleted. Message history includes both text and attachment references. Conversations are auto-named by the agent based on the topic of the first message (e.g., "Add irrigation expense", "Tomato prices in Hyderabad").

### FR-10: Agent Architecture
The app-control chat is built with the OpenAI Agents SDK (TypeScript). It extends the existing advisor agent system: the same triage agent and multi-agent routing infrastructure are reused, but with a dedicated set of app-control tools (create_record, update_record, delete_record, navigate_to_page, set_reminder, schedule_action, etc.). The agent architecture and SDK are shared; only the tool sets and routing rules differ between advisor and app-control modes. The agent has access to summaries of all previous conversations, allowing it to maintain context across sessions.

### FR-11: Error Handling
When an action fails (API error, validation error, permission denied, network issue), the agent responds with a friendly explanation in plain language, suggests an alternative if available, and offers a retry option. Raw error codes, stack traces, or technical jargon are never exposed to the farmer.

### FR-10: Agent Personality
The agent has no name or identity — it is an anonymous helper. However, it greets the farmer by name frequently in responses to personalize the experience. The tone is friendly and conversational: warm in greetings, encouraging during complex tasks, and clear/concise when delivering results or asking for confirmation. The agent uses simple, plain language — no technical jargon.

### FR-11: Language Support
The agent detects the language of the farmer's input and responds in the same language. All 8 project locales are supported. For Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, and Hindko, the chat layout renders right-to-left. Language detection works per-message — the farmer can switch languages mid-conversation.

### FR-12: Streaming Responses
Agent responses stream progressively — text appears incrementally as it is generated, matching the existing SSE streaming pattern used by the advisor chat.

### FR-13: Security and Authorization
Every chat-triggered action goes through the same `requireSessionApi()` guard. All data-accessing tools are scoped to the farmer's `accountId`. Navigation commands are validated against the app's allowed routes. The agent cannot access or modify other farmers' data.

### FR-14: Rate Limiting
Chat requests are rate-limited per IP and per account using the same fixed-window limiter as the advisor chat route.

### FR-15: Attachment Handling
Uploaded images are validated for type and size before processing. The maximum attachment size is 10 MB. Supported formats: JPEG, PNG, WebP. Attachments are processed server-side and not stored permanently unless they are part of a created record (e.g., a disease detection scan).

### FR-16: Empty / Ambiguous Input
If the farmer sends an empty message, the agent responds with a welcome message and suggested commands (e.g., "Log an expense", "Check prices", "Show my farms"). If the intent is ambiguous or information is missing, the agent asks clarifying questions via text until it has enough detail to execute the action. The empty state is only shown when there are no messages yet.

### FR-17: Floating Panel Behavior
The chat window starts as a minimized floating bubble in the bottom corner on every page. Tapping the bubble expands it to an 80% modal overlay chat panel. The panel can be minimized back to a bubble or closed entirely. The chat persists across page navigations — if the farmer navigates to another page, the floating bubble remains visible and the conversation continues. The panel does not auto-close on navigation. When the agent navigates the farmer to another page, the panel stays open over the new page.

### FR-18: Guided Multi-Step Dialogue
For complex actions that require multiple pieces of information (e.g., creating an expense requires amount, category, date, and farm), the agent breaks the task into steps and guides the farmer through each one sequentially. The agent asks one clarifying question at a time, validates each response, and proceeds only when it has enough information. The farmer can also provide all details in a single message if they prefer. The agent waits up to 30 seconds for each confirmation before timing out and asking if the farmer wants to continue or cancel.

### FR-19: Auto-Named Conversations
Conversations are auto-named by the agent based on the topic of the first message (e.g., "Add irrigation expense", "Tomato prices in Hyderabad"). The farmer can rename conversations manually from the sidebar. The farmer can have unlimited conversation tabs open simultaneously.

### FR-20: Unread Indicator
The minimized floating chat bubble shows a small dot indicator when there are unread messages in any conversation. The dot disappears when the farmer opens the chat panel.

### FR-21: Default Farm Selection
When the farmer requests an action involving a specific farm but does not specify which one, the agent auto-selects the farm if there is only one registered farm. If multiple farms exist, the agent asks which farm to use before proceeding.

### FR-22: Out-of-Scope Requests
When the farmer asks something outside the app's capabilities or data, the agent politely declines and redirects to farming topics it can help with. The agent never makes up information or pretends to know something it does not.

### FR-23: Agent Identity
The agent has no name or identity. It greets the farmer by name frequently in responses to personalize the experience, but does not refer to itself by name.

### FR-24: Time-Sensitive Actions
The agent can set reminders, schedule alerts, and create future-dated actions through the app's notification and scheduling systems. For example, "Remind me to spray pesticide on my cotton in 3 days" creates a scheduled reminder.

### FR-25: Conversation Memory
The agent retains summaries of all previous conversations, allowing it to reference past topics, preferences, and context when helping the farmer. Full message history is available in the current session; older sessions are summarized.

## Edge Cases & Rules

- **Empty message:** The agent responds with a welcome message and suggested commands in the detected language (e.g., "Kya aap kuch kehna chahte hain? Apna sawal likhein ya button use karein." or "Type a command or tap a suggestion below.").
- **Very long message:** Messages exceeding 2000 characters are truncated with a notice: "Aapka message bohot lamba hai. Main pehle 2000 characters padh raha hoon."
- **Unsupported attachment type:** The agent responds: "Maaf kijiye, main abhi sirf images samajh sakta hoon. Please ek photo attach karein."
- **No page context:** If the page context cannot be determined (e.g., the user navigated directly to the chat), the agent operates without page-specific context but can still execute all actions.
- **Multiple conversations:** The farmer can have multiple conversations open in separate tabs within the chat panel. Switching tabs preserves each conversation's state and message history.
- **Sidebar behavior:** On desktop, the conversation sidebar is always visible alongside the chat. On mobile, it is a drawer overlay that can be toggled open/closed.
- **Bubble animation:** The floating chat bubble pulses gently while the agent is processing or when there are unread messages.
- **Long response handling:** Responses exceeding the chat panel height are truncated with a "Show more" expandable button. Key data is shown in cards above the expandable text.
- **Record creation:** After confirmation, the record is created in the background and the agent announces the result in chat — no intermediate form is shown.
- **Navigation:** Agent navigates immediately when asked, no confirmation required. The agent announces the destination so the farmer is not surprised.
- **Record update:** When updating an existing record, the agent shows a diff-like card comparing the old value and proposed new value, then asks for confirmation before applying the change.
- **Deletion confirmation:** Deleting a conversation requires a confirmation dialog — the farmer must explicitly confirm before the conversation is removed.
- **Concurrent requests:** A new chat request cancels any in-progress previous request on the same conversation.
- **Session expiry:** If the session expires, the agent prompts the user to sign in and does not process the message.
- **Navigation failure:** If the target page does not exist or the user lacks access, the agent explains and offers an alternative.
- **Partial action failure:** If an action partially succeeds (e.g., record created but notification failed), the agent reports what succeeded and what didn't, never pretending the entire action succeeded.
- **RTL locales:** All chat UI elements (composer, buttons, cards, error messages) render in right-to-left layout for Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, and Hindko.

## Out of Scope

- Voice input/output within the chat (voice is a completely separate feature with its own icon and window).
- Always-on agent suggestions or proactive notifications outside of explicit user messages.
- Multi-user or shared conversations (each farmer's conversations are private).
- Offline mode for the chat (requires network for agent processing).
- Agent customization or personality settings.
- Bulk actions or batch processing (one action per message).
- Integration with external apps or services beyond the existing Agropioo route handlers.

## Acceptance Criteria

- [ ] A floating chat icon is visible in the bottom corner on every authenticated farmer app page. Tapping opens a chat panel that can be minimized or maximized to an 80% overlay.
- [ ] The chat icon pulses gently when the agent is processing or when there are unread messages.
- [ ] The chat persists as a floating panel across page navigations.
- [ ] The farmer can have multiple conversations open in separate tabs within the chat panel.
- [ ] On desktop, the conversation sidebar is always visible; on mobile, it is a toggleable drawer.
- [ ] The agent can create, view, update, and delete farm records via chat commands.
- [ ] The agent can navigate the farmer to any app page via chat commands or navigation buttons — navigation happens immediately with an announcement.
- [ ] The agent receives the current page as context and uses it to tailor responses.
- [ ] The agent confirms all write actions (create, update, delete) via chat before executing, showing a diff for updates.
- [ ] The chat composer supports text input and image attachments with thumbnail preview before sending.
- [ ] The agent can process attached images (e.g., crop disease detection).
- [ ] Agent responses can include interactive elements: navigation buttons, confirmation prompts, action cards, retry buttons, mini page previews, and expandable sections.
- [ ] The agent explains failures in plain language and offers a retry button within the failed message bubble.
- [ ] The agent detects input language and responds in the same language across all 8 locales, using a friendly conversational tone.
- [ ] RTL locales render the chat UI in right-to-left layout.
- [ ] Agent responses are short by default with expandable "Show more" sections for long content.
- [ ] Agent responses stream progressively.
- [ ] Conversations are persisted server-side and appear in a sidebar list with rename/delete (delete requires confirmation dialog).
- [ ] Conversations are auto-named by the agent based on the first message topic.
- [ ] Chat requests are rate-limited per IP and per account.
- [ ] All agent actions respect accountId scoping and cannot access other farmers' data.
- [ ] The agent extends the existing advisor agent system with dedicated app-control tools.
- [ ] The agent handles multi-step tasks through guided sequential dialogue, suggesting next actions on completion or when ambiguous.
- [ ] The empty state shows a welcome message with suggested commands.
- [ ] All new visible strings introduced by this feature have translation keys inserted for all 8 locales in the Neon `translations` table before merge.
- [ ] `npm run lint` and `npm run build` pass.
