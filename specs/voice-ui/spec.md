# spec.md — Voice-Enabled UI by Voice Agents

## Goal

Give farmers hands-free, eyes-free access to Agropioo. A farmer speaks naturally in their regional language; the app listens, understands intent, performs the requested action (fetching data, creating records, or navigating), and speaks the answer back. No reading, no tapping, no literacy barrier.

## User Scenarios

- A wheat farmer in Punjab opens the advisor and taps the mic button. They say in Roman Urdu: "Aaj meri gehu ke liye mausam ka mashwala kya hai?" The app transcribes the speech, routes it through the advisor agent, fetches the weather advisory for their farm, and speaks the answer back in Urdu.
- A farmer in Sindh, holding a bag of fertilizer in one hand and a phone in the other, says: "Mujhe apna 2000 rupees ka irrigation kharch add karo." The voice agent understands the intent, creates an expense record attached to their default farm, and confirms in Sindhi: "Kharch record kar diya hai."
- A farmer with low vision opens the app and asks: "What are today's tomato prices in Hyderabad?" The agent searches mandi prices, finds the closest relevant market, reads the prices aloud, and offers to set a price alert — all without the farmer touching the screen beyond the initial mic tap.
- A Pashto-speaking farmer asks a follow-up: "And what about last week?" The agent retrieves historical prices from the previous conversation context and answers without the farmer re-typing or re-navigating.
- The farmer's phone has poor signal. They speak a question, the transcription fails, and the app apologizes in their language: "Maaf kijiye, main sun nahi paayi. Dobara koshish karein." A retry button appears.

## Functional Requirements

### FR-1 Voice Input (Speech-to-Text)
The advisor page provides a push-to-talk button. When the farmer presses and holds it (or taps to toggle recording), the app captures audio and transcribes it to text in the farmer's current app locale. Transcription must support all 8 project locales: English, Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, Hindko.

### FR-2 Agent Processing
Transcribed text is sent to the existing advisor agent pipeline (the same multi-agent router and tool system used for text chat). The agent receives the farmer's account context (accountId, farm list, recent history) and may invoke tools to fetch data or create records.

### FR-3 Voice Output (Text-to-Speech)
When the agent produces a response, the app reads it aloud in the farmer's locale using text-to-speech. TTS must support all 8 locales. The farmer can stop the playback at any time by pressing the mic button again or a dedicated stop button.

### FR-4 Push-to-Talk Activation
Voice mode is activated only by explicit user action: a persistent microphone button in the advisor composer. Holding the button records; releasing it sends. Tapping toggles recording on/off. The app never listens continuously in the background.

### FR-5 Conversation Persistence
Every voice exchange is stored as an advisor message (role: `farmer` for the transcript, role: `advisor` for the text response) in the same `advisor_messages` table used by text chat. Voice conversations appear in the advisor sidebar and can be reviewed, renamed, and deleted like any other conversation.

### FR-6 Permission Handling
The app requests microphone permission only when the farmer first taps the mic button. If permission is denied, the app shows a clear message explaining why microphone access is needed and how to enable it in device settings. The advisor remains usable in text mode.

### FR-7 Fallback on Failure
If speech-to-text fails, the transcription returns no text, the LLM is unreachable, or the agent cannot fulfill the request, the app apologizes in the farmer's language and offers a retry. The fallback never exposes raw error codes or stack traces to the farmer.

### FR-8 Rate Limiting
Voice requests are rate-limited using the same per-IP and per-account limits as the existing advisor chat route. A farmer who exceeds the limit sees a message in their locale explaining the limit and when they can try again.

### FR-9 Cross-App Tool Execution
When the voice agent determines the farmer's request requires an action (for example, creating an expense record, fetching weather, or checking prices), it invokes the same scoped tools available to the text agent. Every tool execution is bounded by `accountId`; the voice agent cannot access or modify another farmer's data.

### FR-10 Language Consistency
Agent responses are filtered for language consistency: if the farmer speaks in Urdu, the agent responds in Urdu (not a mix of Urdu and English), matching the existing `languageConsistencyGuardrail` used by the text agent.

## Edge Cases & Rules

- **Empty speech:** If the farmer speaks but the transcription returns empty or whitespace-only text, the app prompts once to try again, then falls back to text input.
- **Very long speech:** If the transcription exceeds 2000 characters, it is truncated to the first 2000 characters before sending to the agent, matching the existing advisor message length limit.
- **Malformed transcription:** If the transcription contains only noise or gibberish, the agent replies with a generic "I didn't catch that" message in the farmer's locale and invites a retry.
- **No microphone hardware:** On devices without a microphone, the mic button is hidden and the advisor operates in text-only mode.
- **Concurrent requests:** A new voice request cancels any in-progress previous request on the same conversation.
- **Session expiry:** If the farmer's session expires while they are speaking, the app stops recording, prompts them to sign in, and does not send the partial transcript to the agent.
- **RTL locales:** For Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, and Hindko, the voice UI elements (permission prompts, error messages, status labels) render in right-to-left layout with appropriate fonts.
- **Low bandwidth:** Transcription and agent responses stream progressively where possible. Partial transcripts and partial agent text are shown in the chat UI as they arrive, matching the existing SSE streaming pattern.

## Out of Scope

- Voice input/output for any page other than the advisor chat.
- Always-on listening or wake-word activation.
- Phone-call mode, IVR, or SMS-based voice.
- Offline/on-device STT or TTS (browser-native Web Speech API requires network for most languages; on-device Whisper is not required at launch).
- Voice biometrics or voice-profile personalization beyond the existing farmer account context.
- Photo upload triggered by voice (the feature description mentions this, but it requires camera UI that is out of scope for the voice layer itself).
- Agronomist voice mode or expert escalation via voice.

## Acceptance Criteria

- [ ] A farmer can tap the mic button in the advisor, speak in any of the 8 locales, and see their speech transcribed into the chat input.
- [ ] The transcribed speech is sent to the advisor agent and receives a text response, identical to typing the same text manually.
- [ ] The agent's text response is read aloud in the farmer's locale via TTS.
- [ ] The farmer can stop TTS playback by tapping the mic button or a stop button.
- [ ] Voice conversations appear in the advisor sidebar with the same create/rename/delete behavior as text conversations.
- [ ] Microphone permission is requested only on first mic tap; if denied, a clear permission message is shown and text mode remains usable.
- [ ] When STT fails, returns empty text, or the LLM is unreachable, the farmer sees a localized apology and retry option — no raw errors.
- [ ] Voice requests are rate-limited per the same limits as text chat.
- [ ] Cross-app tool calls from voice (creating records, fetching weather/prices) respect `accountId` scoping and cannot access other farmers' data.
- [ ] RTL locales render voice UI strings (permissions, errors, status labels) in right-to-left layout.
- [ ] All new visible strings introduced by this feature have translation keys inserted for all 8 locales in the Neon `translations` table before merge.
- [ ] `npm run lint` and `npm run build` pass.
