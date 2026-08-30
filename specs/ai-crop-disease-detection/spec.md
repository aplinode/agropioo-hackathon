# Detect — AI Crop Disease Detection

> `/detect` — AI-powered crop disease detection for Pakistani farmers. Farmer captures or uploads a leaf photo, optionally links it to one of their farms, and receives an instant diagnosis with treatment steps. Detection results sync with farm records and the AI advisor.

---

## 1. Goal

Give every farmer a fast, reliable way to identify crop diseases from a photo — before the damage spreads. The farmer takes or uploads a leaf photo, optionally links it to one of their farms, and gets a plain-language diagnosis with confidence, severity, and actionable treatment steps. Results persist in scan history, and a one-tap path opens the advisor with the scan context pre-filled so the farmer can ask follow-up questions. The detection feature is self-contained; the advisor is a separate feature that receives context from detect but is not modified by this spec.

---

## 2. User Scenarios

| # | When the farmer… | They get… |
|---|---|---|
| S1 | Opens `/detect` for the first time | A clean upload area with two clear paths: take a photo or choose from device. |
| S2 | Has registered farms | A farm selector dropdown above the upload area, listing all farms with their name and primary crop. |
| S3 | Has no farms registered | A modal/popup prompting them to register a farm first, with an "Add farm" button (goes to `/farms/new`) and an "I'll do this later" option. Upload still works but results are not linked to any farm. |
| S4 | Takes a photo on mobile | The device camera opens, they capture a leaf, and the photo appears as preview before analysis. |
| S5 | Uploads a file from desktop | A file picker opens, they select an image, and it appears as preview before analysis. |
| S6 | Drags an image onto the upload area on desktop | The image is accepted, previewed, and ready for analysis. |
| S7 | Submits a photo | A 1–3 second analyzing state with the photo preview and a clear "Reading the leaf…" indicator. |
| S8 | Analysis completes | A structured result card showing: disease name, confidence score, severity level, affected crop, what caused it, step-by-step treatment, when to re-scan, and a safety caution. |
| S9 | Wants to save the result | A "Save to farm" button that permanently links this detection to the selected farm's disease records. |
| S10 | Wants advice on the result | A "Discuss with advisor" button that opens `/advisor` with the scan result pre-filled in the chat input. The farmer can send as-is or edit before sending. |
| S11 | Wants to scan another leaf | A "Scan another leaf" button that resets the flow without losing the farm selection. |
| S12 | Checks past scans | A scrollable history of all previous scans, each showing crop, finding, outcome chip, date, and save status — regardless of whether they were saved to a farm. |
| S13 | Taps a past scan | The full result card for that scan opens, with the same save/discuss actions available. |
| S14 | Is on a slow connection | A loading state with retry option if the analysis fails. |
| S15 | Uploads an invalid file (non-image) | A clear error message: "Please upload an image file." |
| S16 | Uploads a very large image (10MB+) | The image is compressed client-side before upload, with no visible quality loss for disease detection. |
| S17 | Has 100+ scans in history | The list uses pagination with a "Load more" button (20 per page) for smooth scrolling. |
| S18 | Has 0 farms and tries to save | The "Save to farm" button is hidden. The modal/popup from S3 appears again. |
| S19 | The AI service is unavailable | A clear error message with a retry button. No partial or corrupted result is shown. |
| S20 | The model returns no clear diagnosis | The result card shows "Could not identify the disease — try a clearer photo of the affected area." with a retry option. |
| S21 | Rapidly taps the analyze button multiple times | Only one analysis request is sent. Subsequent taps are ignored until the current analysis completes or fails. |
| S22 | Navigates away during analysis | The request is aborted. No result is saved. No error shown. |
| S23 | Two farmers upload the same image | Each gets their own scan record scoped to their account. No cross-account data leakage. |

---

## 3. Functional Requirements

### FR-1: Upload Input
- **FR-1.1:** The upload area offers two entry points: a camera button (uses `capture="environment"` on mobile) and a file picker button (accepts `image/*`).
- **FR-1.2:** On desktop, the farmer can also drag-and-drop an image onto the upload area.
- **FR-1.3:** Only image files are accepted. Non-image files show an inline error: "Please upload an image file." No analysis attempt is made.
- **FR-1.4:** Images larger than 10MB are automatically compressed client-side before upload. Compression reduces the longest side to 1024px and uses 80% JPEG quality. The farmer sees no error; compression is silent.
- **FR-1.5:** A preview of the selected photo is shown immediately, before analysis begins.

### FR-2: Farm Selection
- **FR-2.1:** If the farmer has one or more registered farms, a farm selector dropdown appears above the upload area.
- **FR-2.2:** The dropdown is always visible when farms exist (not hidden for a single farm). It lists all farms with their name and primary crop.
- **FR-2.3:** If no farms exist, a modal/popup appears prompting the farmer to register a farm first. The popup has two options: "Add farm" (navigates to `/farms/new`) and "I'll do this later" (dismisses the popup). The upload flow remains usable but results are unlinked.
- **FR-2.4:** The selected farm persists across scans until the farmer changes it or navigates away.

### FR-3: Analysis
- **FR-3.1:** On photo submission, the compressed image is sent via `POST /api/detect`.
- **FR-3.2:** During analysis, a loading state shows the photo preview, a spinner, and "Reading the leaf…" text.
- **FR-3.3:** Analysis completes within 5 seconds under normal network conditions.
- **FR-3.4:** If the AI model returns no clear diagnosis (confidence below threshold), the farmer sees "Could not identify the disease — try a clearer photo of the affected area." with a retry option.
- **FR-3.5:** If the AI service fails (timeout, error, or service unavailable), the farmer sees "Service temporarily unavailable" with a retry button. No partial or corrupted result is shown.

### FR-4: Diagnosis Display
- **FR-4.1:** The result card shows the disease name as the primary heading.
- **FR-4.2:** A confidence score is displayed as a percentage (e.g., "Confidence 87%").
- **FR-4.3:** A severity chip uses the project's severity ladder: Watch, Treat Now, Clear.
- **FR-4.4:** The affected crop is identified and displayed.
- **FR-4.5:** Causes are explained in 1–2 plain-language sentences, generated by the AI advisor LLM using the same Groq/OpenAI-compatible infrastructure as the advisor feature.
- **FR-4.6:** "What to do" shows 3–4 numbered steps generated dynamically by the AI advisor, personalized to Pakistani farming context with local chemical names and approximate PKR costs.
- **FR-4.7:** A re-scan timing suggestion is shown (e.g., "Scan again in 7 days").
- **FR-4.8:** A caution note advises confirming treatment with a local agriculture office before spraying.
- **FR-4.9:** The diagnosis is returned in the farmer's selected language. The advisor LLM receives the locale preference and generates the full diagnosis in that language. If the LLM fails, the response falls back to English.

### FR-5: Post-Detection Actions
- **FR-5.1:** "Save to farm" — if a farm is selected, this button saves the detection result to that farm's records. If no farm is selected, the button is hidden.
- **FR-5.2:** "Discuss with advisor" — opens `/advisor` in a new conversation with the scan result pre-filled in the chat input. The input contains a contextual message based on the diagnosis (e.g., "I just scanned my wheat leaf. The AI detected Leaf rust with 87% confidence. It says severity is Watch. What should I do?"). The farmer can send as-is or edit the message before sending.
- **FR-5.3:** "Scan another leaf" — resets the flow to the idle state, keeping the farm selection intact.
- **FR-5.4:** All three actions are visible and tappable on mobile (minimum 44×44px touch targets).

### FR-6: Scan History
- **FR-6.1:** Every scan (whether saved to a farm or not) appears in the "Past scans" list.
- **FR-6.2:** Each history item shows: an outcome chip (Watch / Treat Now / Clear), the finding (disease name), the crop, the date, and a save-status indicator (e.g., "Saved to Farm X" or "Not saved").
- **FR-6.3:** History items are sorted newest-first.
- **FR-6.4:** Tapping a history item opens that scan's full result card.
- **FR-6.5:** History persists across sessions and devices (stored in the database).
- **FR-6.6:** The farmer's full history is scoped to their account only.
- **FR-6.7:** History uses pagination: 20 scans per page with a "Load more" button at the bottom.
- **FR-6.8:** Scan images are stored in Cloudinary under a per-user folder (`scans/user_{id}/`). The image URL is saved in the database alongside the scan record.

### FR-7: Authentication
- **FR-7.1:** `/detect` is only accessible to authenticated farmers. Unauthenticated users are redirected to `/login`. (Already enforced by the farmer app layout's `requireSessionPage()` guard.)
- **FR-7.2:** Every analysis request validates the farmer's session server-side before processing.
- **FR-7.3:** Per-IP rate limiting protects `/api/detect`: maximum 10 requests per hour per IP address.

### FR-8: AI Model Integration
- **FR-8.1:** Disease detection uses the Hugging Face Inference API with the model `animeshakr/plant-disease-efficientnetv2s`.
- **FR-8.2:** The model is called server-side from `/api/detect`. The client never calls the Hugging Face API directly.
- **FR-8.3:** The model accepts a 384×384 RGB image input. The server resizes/compresses the image to match this requirement before sending it to the model.
- **FR-8.4:** The model returns a structured prediction with disease name, confidence score, and severity. The server maps the model's 38 PlantVillage classes to human-readable Pakistani crop names. The detected disease label is then sent to the advisor LLM (Groq/OpenAI-compatible) which generates structured treatment advice in the farmer's selected language. If the LLM fails, static catalog advice is used as fallback.
- **FR-8.5:** If the model's confidence is below a threshold (to be defined in the plan), the result is treated as "no clear diagnosis" per FR-3.4.

### FR-9: Responsive Layout
- **FR-9.1:** On desktop (≥lg), the page uses a two-column layout: scan flow on the left (3/5), history on the right (2/5).
- **FR-9.2:** On mobile, the scan flow is full-width, and history appears below.
- **FR-9.3:** The bottom tab bar is visible on mobile with `/detect` active.
- **FR-9.4:** The desktop sidebar is visible on desktop with `/detect` active.

### FR-10: Detect Chat UI
- **FR-10.1:** After image analysis completes, a chat UI opens on the same page (same route, no navigation).
- **FR-10.2:** The uploaded image appears as a small thumbnail in the chat header area. The thumbnail is clickable.
- **FR-10.3:** Clicking the thumbnail opens a popup/lightbox showing the full-size image. The popup has a close button that returns to the thumbnail view.
- **FR-10.4:** An auto-generated prompt is filled in the chat input based on the diagnosis result. Example: "Why do my {crop} leaves have {symptom}?" or "I have {disease} on my {crop}. What should I do?"
- **FR-10.5:** The farmer can edit the auto-generated prompt before sending, or send it as-is.
- **FR-10.6:** AI responses are streamed into the chat in real time, matching the ChatGPT message-bubble pattern.
- **FR-10.7:** Each detection session creates a persistent chat conversation. Chat history is listed as sessions on the right sidebar (desktop) or bottom sheet (mobile).
- **FR-10.8:** Clicking a past session in the history list loads that session's full chat on the same page.
- **FR-10.9:** A "New scan" button resets the flow back to the upload area, clearing the current chat but preserving past sessions.
- **FR-10.10:** Chat responses come from the same LLM infrastructure used by the advisor feature, scoped to the detected disease, crop, and severity context.

---

## 4. Edge Cases & Rules

| # | Situation | Expected behaviour |
|---|---|---|
| E1 | Farmer uploads a non-image file | Inline error: "Please upload an image file." No analysis attempt. |
| E2 | Farmer uploads an image larger than 10MB | Image is compressed client-side before upload. No error shown to farmer. |
| E3 | Farmer has zero farms | Farm selector is replaced with a "Register a farm first" popup/modal with "Add farm" and "I'll do this later" options. Upload and analysis still work. Result cannot be saved to a farm. |
| E4 | Farmer has one farm | Farm selector dropdown is visible, pre-selected with the single farm. "Save to farm" button is available. |
| E5 | Farmer has multiple farms | Dropdown shows all farms with name + primary crop. Farmer must select one before or after upload. |
| E6 | AI model returns no clear diagnosis | Result card shows "Could not identify the disease — try a clearer photo of the affected area." with retry option. |
| E7 | AI service times out or errors | "Service temporarily unavailable" message with retry button. No partial or corrupted result. |
| E8 | Farmer taps "Save to farm" without selecting a farm | Button is hidden when no farm is selected. Popup appears prompting farm registration. |
| E9 | Farmer rapidly taps "Analyze" multiple times | Only one analysis request is sent. Subsequent taps are ignored until the current analysis completes or fails. |
| E10 | Farmer navigates away during analysis | The request is aborted. No result is saved. No error shown. |
| E11 | Farmer has 100+ scans in history | The list shows 20 scans initially. "Load more" button loads 20 more each time. |
| E12 | Farmer uploads the same image twice | Two separate scan records are created, each with its own timestamp and result. |
| E13 | Farmer's session expires mid-request | The request is rejected server-side. Farmer is redirected to `/login`. |
| E14 | Two farmers upload the same image | Each gets their own scan record scoped to their account. No cross-account data leakage. |
| E15 | Image is not a leaf (e.g., a table photo) | The model's "Non_leaf_or_unknown" class or low-confidence threshold triggers the "Could not identify the disease" message. |
| E16 | Hugging Face API rate limits the request | "Service temporarily unavailable" with retry button. Client should wait before retrying. |
| E17 | Cloudinary upload fails | Analysis is aborted. Farmer sees an error: "Could not save image. Please try again." |
| E18 | Farmer drags a non-image file onto the drop zone | Inline error: "Please upload an image file." No analysis attempt. |

---

## 5. Out of Scope

- Voice input or voice output (text-only interaction)
- Offline analysis (requires online AI service)
- Real-time video feed analysis (single photo only)
- Batch upload / multiple photo analysis at once
- Manual diagnosis override (farmer cannot edit the AI result)
- Social sharing of scan results
- Push notifications for disease alerts
- Disease prediction from weather or satellite data (separate feature)
- Dark mode
- Languages beyond the project's rolling language policy (English first, Urdu next, then by priority)
- The advisor feature itself — it is a separate feature. This spec only covers the pre-filled context handoff.

---

## 6. Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| AC-1 | Opening `/detect` while logged in shows the upload flow | Manual: log in, navigate to `/detect`, verify upload area is visible |
| AC-2 | Unauthenticated users cannot access `/detect` | Manual: visit `/detect` while logged out, verify redirect to `/login` |
| AC-3 | Mobile camera opens on "Take photo" button tap | Manual: open `/detect` on mobile device, tap camera button, verify camera opens |
| AC-4 | File picker opens on "Choose photo" button tap | Manual: tap file picker button, verify device file browser opens |
| AC-5 | Non-image files are rejected with an error | Manual: upload a `.pdf` or `.txt`, verify inline error message |
| AC-6 | Images larger than 10MB are accepted without error | Manual: upload a 15MB image, verify it compresses and analyzes successfully |
| AC-7 | Farmer with farms sees a farm selector dropdown | Manual: log in as farmer with farms, open `/detect`, verify dropdown lists all farms |
| AC-8 | Farmer with no farms sees a registration popup | Manual: log in as farmer with no farms, open `/detect`, verify popup with "Add farm" and "I'll do this later" |
| AC-9 | Analysis completes within 5 seconds under normal conditions | Manual: upload a clear leaf photo, verify result appears within 5 seconds |
| AC-10 | Result card shows all required fields: disease name, confidence, severity, crop, causes, steps, re-scan timing, caution | Manual: verify each field is present in the result card |
| AC-11 | Severity chip uses Watch / Treat Now / Clear | Manual: verify chip uses Watch / Treat Now / Clear styling |
| AC-12 | "Save to farm" saves the result to the selected farm | Manual: select a farm, scan a leaf, tap "Save to farm", verify scan appears in farm records |
| AC-13 | "Discuss with advisor" opens advisor with scan context pre-filled | Manual: tap "Discuss with advisor", verify `/advisor` opens with scan result pre-filled in the chat input |
| AC-14 | Farmer can edit the pre-filled advisor message before sending | Manual: tap "Discuss with advisor", modify the pre-filled text, verify modified text is sent |
| AC-15 | "Scan another leaf" resets the flow without losing farm selection | Manual: tap "Scan another leaf", verify upload area resets but farm selector stays |
| AC-16 | Past scans list shows all previous scans newest-first | Manual: perform 3 scans, verify history shows them in reverse chronological order |
| AC-17 | Tapping a past scan opens its full result | Manual: tap a history item, verify full result card appears |
| AC-18 | Scan history persists across page reloads | Manual: perform a scan, reload `/detect`, verify scan is still in history |
| AC-19 | Graceful error shown when AI service is unavailable | Manual: simulate API failure, verify "Service temporarily unavailable" + retry button |
| AC-20 | 100+ scans use "Load more" pagination | Manual: verify 20 scans shown initially, "Load more" loads next 20 |
| AC-21 | Scan images are stored in Cloudinary and URLs are saved in database | Automated: verify Cloudinary folder structure and database `image_url` column |
| AC-22 | Rate limiting blocks more than 10 requests/hour per IP | Automated: send 11 requests from same IP, verify 11th is blocked |
| AC-23 | Drag-and-drop works on desktop | Manual: drag an image onto the upload area, verify it is accepted and previewed |
| AC-24 | `npm run lint` passes | Automated: run `npm run lint`, verify zero errors |
| AC-25 | `npm run build` passes | Automated: run `npm run build`, verify zero errors |
