# spec.md — Voice-Enabled UI by Voice Agents

## Goal

Give farmers complete hands-free, eyes-free control of the Agropioo app. A farmer speaks naturally in their regional language from any page; the app listens, understands intent, performs the requested action anywhere in the app (fetching data, creating records, navigating, or answering questions), and speaks the answer back. No reading, no tapping, no literacy barrier.

## User Scenarios

- A wheat farmer in Punjab opens the advisor and taps the mic button. They say in Roman Urdu: "Aaj meri gehu ke liye mausam ka mashwala kya hai?" The app transcribes the speech, routes it through the advisor agent, fetches the weather advisory for their farm, and speaks the answer back in Urdu.
- A farmer in Sindh, holding a bag of fertilizer in one hand and a phone in the other, taps the global mic from the dashboard and says: "Mujhe apna 2000 rupees ka irrigation kharch add karo." The voice agent understands the intent, navigates to the profit-loss expense flow, creates an expense record attached to their default farm, and confirms in Sindhi: "Kharch record kar diya hai."
- A farmer with low vision is on the prices page and asks: "What are today's tomato prices in Hyderabad?" The agent searches mandi prices, finds the closest relevant market, reads the prices aloud, and offers to set a price alert — all without the farmer touching the screen beyond the initial mic tap.
- A Pashto-speaking farmer on the farm records page says: "Mujhe apne sab farms dekhne hain." The agent navigates to the farms list, reads out the farm names and their current crop status, and asks if they want details on any specific farm.
- A farmer on the dashboard says: "Take me to crop detection." The agent navigates to the /detect page and announces: "Ab aap crop detection page par hain. Image select karein ya photo lein."
- The farmer's phone has poor signal. They speak a question, the transcription fails, and the app apologizes in their language: "Maaf kijiye, main sun nahi paayi. Dobara koshish karein." A retry option is available.

## Functional Requirements

### FR-1 Global Voice Control
A floating microphone button is visible on every page of the authenticated farmer app. Tapping it activates voice input regardless of which feature the farmer is currently using. The voice agent has access to the entire app's capabilities: reading data, creating records, navigating between pages, and answering questions.

### FR-2 Voice Input (Speech-to-Text)
The global mic button captures audio and sends it to a server-side speech-to-text API (Whisper, Gemini, or equivalent). The API auto-detects the spoken language across all 8 project locales: English, Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, Hindko. Recording starts on mic tap and auto-stops when silence is detected; there is no hard duration limit.

### FR-3 Voice Output (Text-to-Speech)
When the agent produces a response, the app reads it aloud in the detected spoken language using text-to-speech. TTS uses browser-native Web Speech API when a voice exists for the detected language, and falls back to a server-side TTS API (Coqui, ElevenLabs, Gemini, or equivalent) when no suitable browser voice is available. The farmer can stop playback at any time by tapping the mic button or a dedicated stop button.

### FR-4 Push-to-Talk Activation
Voice mode is activated only by explicit user action: the floating mic button. Tap starts recording; auto-stop on silence sends the audio for transcription. The app never listens continuously in the background.

### FR-5 Page-Aware Context
The voice agent receives the current page path and relevant page state as context. This allows the agent to tailor responses and actions to what the farmer is currently viewing. For example, on the prices page the agent prioritizes price-related actions; on the farm records page it prioritizes record-creation actions.

### FR-6 App-Wide Actions
The voice agent can perform any action available in the app, including but not limited to:
- Creating and viewing farm records (expenses, activities, observations)
- Fetching weather advisories for specific farms
- Checking mandi prices and setting alerts
- Running crop disease detection
- Getting crop recommendations
- Viewing profit/loss summaries
- Navigating between any app page
- Answering general farming questions via the advisor agent

Actions are executed through the same server-side route handlers and tool system used by the text-based UI, ensuring consistent authorization, validation, and data scoping.

### FR-7 Voice Navigation
The voice agent can navigate the farmer to any page in the app. When navigation occurs, the agent announces the destination and the current page's purpose. Navigation commands include natural variations like "take me to...", "show me...", "open...", "go to...".

### FR-8 Conversation Persistence
Every voice exchange is stored as an advisor message (role: `farmer` for the transcript, role: `advisor` for the text response) in the same `advisor_messages` table used by text chat. Voice conversations appear in the advisor sidebar and can be reviewed, renamed, and deleted like any other conversation. The conversation context carries across page navigations.

### FR-9 Permission Handling
The app requests microphone permission only when the farmer first taps the mic button. If permission is denied, the app shows a clear message explaining why microphone access is needed and how to enable it in device settings. The mic button remains visible on all pages but enters an inactive state.

### FR-10 Fallback on Failure
If speech-to-text fails, returns empty text, the LLM is unreachable, or the agent cannot fulfill the request, the app apologizes in the farmer's detected language and offers a retry. The fallback never exposes raw error codes or stack traces to the farmer. On failure, the agent may optionally offer to switch to text input.

### FR-11 Rate Limiting
Voice requests are rate-limited per IP and per account using the same fixed-window limiter used by the advisor chat route. Excess requests receive a polite localized message asking the farmer to wait.

### FR-12 RTL and Localization
All voice-mode UI strings (permission prompts, error messages, status labels, confirmation messages) are translated for all 8 locales. For Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, and Hindko, voice UI elements render in right-to-left layout with appropriate fonts. Agent responses respect the detected spoken language and are checked for language consistency.

### FR-13 Offline Behavior
When the farmer is offline, the floating mic button remains visible but enters an inactive state. The farmer can still interact with the app via text input. Voice requests are not queued for later; the farmer must retry when connectivity returns.

### FR-14 Audio Recording
Audio is captured using the browser MediaRecorder API in WebM/Opus format (or the browser's default supported format). Recorded audio is POSTed to a server-side route handler for transcription. The recording auto-stops when silence is detected. There is no hard duration limit, but practical constraints of the STT API's max file size apply.

### FR-15 Security and Authorization
Every voice-triggered action goes through the same `requireSessionApi()` guard as the existing route handlers. All data-accessing tools are scoped to the farmer's `accountId`. The voice agent cannot access or modify other farmers' data. Navigation commands are validated against the app's allowed routes.

### FR-16 Destructive Action Confirmation
Before executing any destructive action (delete, archive, permanent removal), the voice agent asks the farmer to confirm via voice. The agent waits for an explicit affirmative response before proceeding. If the farmer does not confirm, the action is cancelled and the agent explains what happened.

### FR-17 Processing Feedback
While the agent is processing a request, it provides spoken status updates at key milestones: acknowledging the request, indicating it is fetching data or creating a record, and confirming completion. Visual feedback (loading indicator, status text) is shown alongside the spoken updates.

### FR-18 Emergency Stop
Tapping the mic button while the agent is speaking immediately stops all audio playback and cancels any in-progress agent action. The app returns to idle state, ready for a new voice command.

### FR-19 Follow-Up Dialogue
If the farmer's voice command is missing required information or ambiguous, the agent asks one or more clarifying questions via voice. The conversation continues in voice until the agent has enough information to execute the action, or until the farmer explicitly cancels.

## Edge Cases & Rules

- **Empty speech:** If the farmer speaks but the transcription returns empty or whitespace-only text, the app prompts once to try again, then offers to switch to text input.
- **Very long speech:** If the transcription exceeds 2000 characters, it is truncated to the first 2000 characters before sending to the agent.
- **Malformed transcription:** If the transcription contains only noise or gibberish, the agent replies with a generic "I didn't catch that" message in the detected language and invites a retry.
- **No microphone hardware:** On devices without a microphone, the floating mic button is hidden.
- **Concurrent requests:** A new voice request cancels any in-progress previous request.
- **Session expiry:** If the farmer's session expires while they are speaking, the app stops recording, prompts them to sign in, and does not send the partial audio to the server.
- **RTL locales:** For Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, and Hindko, the mic button tooltip, status messages, and agent responses render in right-to-left layout.
- **Low bandwidth:** Transcription and agent responses stream progressively where possible.
- **Page navigation during voice:** If the farmer navigates manually while the agent is processing a voice request, the agent completes the action and announces the result. If the agent was about to navigate, it waits for the current page to settle before navigating.
- **Ambiguous intent:** If the agent cannot determine the farmer's intent with reasonable confidence, it asks a clarifying question in the detected language before taking any action.
- **Auto-detected language mismatch:** If the detected language differs significantly from the farmer's app locale, the agent responds in the detected language and notes the switch (e.g., "Main ne Punjabi suna, isliye main Punjabi mein jawab de rahi hoon.").
- **Emergency stop:** Tapping the mic while the agent is speaking or processing immediately cancels the current operation and returns to idle. No partial actions are committed without confirmation after an emergency stop.
- **Follow-up dialogue timeout:** If the farmer does not respond to a clarifying question within 10 seconds, the agent cancels the operation and prompts the farmer to try again.
- **Destructive action cancellation:** If the farmer says "no", "cancel", or equivalent to a destructive-action confirmation, the agent aborts and confirms the cancellation.

## Out of Scope

- Voice input/output for the marketing site (public pages, signup, login).
- Always-on listening or wake-word activation.
- Phone-call mode, IVR, or SMS-based voice.
- Offline/on-device STT or TTS (server-side APIs require network).
- Voice biometrics or voice-profile personalization beyond the existing farmer account context.
- Photo upload triggered by voice (requires camera UI that is out of scope for the voice layer itself).
- Agronomist voice mode or expert escalation via voice.
- Multi-language conversations within a single session (the app responds in the detected language of each request).

## Acceptance Criteria

- [ ] A floating microphone button is visible on every authenticated farmer app page.
- [ ] Tapping the mic starts recording; auto-stop on silence sends audio for transcription.
- [ ] Transcription auto-detects the spoken language across all 8 locales.
- [ ] The agent's text response is displayed in the chat and read aloud via TTS.
- [ ] The agent can perform app-wide actions: create records, fetch data, navigate pages, answer questions.
- [ ] The agent navigates the farmer to different pages when requested.
- [ ] The agent receives the current page as context and tailors responses accordingly.
- [ ] The farmer can stop TTS playback by tapping the mic button or a stop button.
- [ ] Voice exchanges are persisted as advisor messages and appear in the advisor sidebar.
- [ ] Microphone permission is requested only on first mic tap; if denied, the button becomes inactive and a clear message is shown.
- [ ] When STT fails or returns empty text, the farmer sees a localized apology and retry option — no raw errors.
- [ ] Voice requests are rate-limited per the same limits as text chat.
- [ ] All agent actions respect accountId scoping and cannot access other farmers' data.
- [ ] RTL locales render voice UI strings in right-to-left layout.
- [ ] When offline, the mic button is visible but inactive.
- [ ] All new visible strings introduced by this feature have translation keys inserted for all 8 locales in the Neon `translations` table before merge.
- [ ] Before deleting or archiving any data, the agent asks for voice confirmation and waits for explicit approval.
- [ ] While processing, the agent provides spoken status updates (e.g., "Record bana raha hoon...", "Ho gaya") and a visual loading indicator.
- [ ] Tapping the mic while the agent is speaking immediately stops all audio and cancels the current operation.
- [ ] When information is missing or intent is ambiguous, the agent asks voice follow-up questions until it has enough detail or the farmer cancels.
- [ ] `npm run lint` and `npm run build` pass.
