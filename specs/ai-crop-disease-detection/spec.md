# Detect — AI Crop Disease Detection

> `/detect` — AI-powered crop disease detection for Pakistani farmers. Farmer captures or uploads a leaf photo, optionally links it to one of their farms, and receives an instant diagnosis with treatment steps. Detection results sync with farm records and the AI advisor.

---

## 1. Goal

Give every farmer a fast, reliable way to identify crop diseases from a photo — before the damage spreads. The farmer takes or uploads a leaf photo, optionally links it to one of their farms, and gets a plain-language diagnosis with confidence, severity, and actionable treatment steps. Results persist in scan history, link to farm records, and flow into the advisor for deeper discussion.

---

## 2. User Scenarios

| # | When the farmer… | They get… |
|---|---|---|
| S1 | Opens `/detect` for the first time | A clean upload area with two clear paths: take a photo or choose from device. |
| S2 | Has registered farms | A farm selector above the upload area, pre-filled with their most recent farm if only one exists, or showing all farms if multiple. |
| S3 | Has no farms registered | A prompt to register a farm first, with a link to `/farms/new`. Upload still works but results are not linked to any farm. |
| S4 | Takes a photo on mobile | The device camera opens, they capture a leaf, and the photo appears as preview before analysis. |
| S5 | Uploads a file from desktop | A file picker opens, they select an image, and it appears as preview before analysis. |
| S6 | Submits a photo | A 1–3 second analyzing state with the photo preview and a clear "Reading the leaf…" indicator. |
| S7 | Analysis completes | A structured result card showing: disease name, confidence score, severity level, affected crop, what caused it, step-by-step treatment, when to re-scan, and a safety caution. |
| S8 | Wants to save the result | A "Save to farm" button that permanently links this detection to the selected farm's disease records. |
| S9 | Wants advice on the result | A "Discuss with advisor" button that opens `/advisor` with the scan context pre-loaded. |
| S10 | Wants to scan another leaf | A "Scan another leaf" button that resets the flow without losing the farm selection. |
| S11 | Checks past scans | A scrollable history of all previous scans, each showing crop, finding, outcome chip, and date — regardless of whether they were saved to a farm. |
| S12 | Taps a past scan | The full result card for that scan opens, with the same save/discuss actions available. |
| S13 | Is on a slow connection | A loading state with retry option if the analysis fails. |
| S14 | Uploads an invalid file (non-image) | A clear error message: "Please upload an image file." |
| S15 | Uploads a very large image (10MB+) | The image is compressed or resized before analysis, with no visible quality loss for disease detection. |

---

## 3. Functional Requirements

### FR-1: Upload Input
- **FR-1.1:** The upload area offers two entry points: a camera button (uses `capture="environment"` on mobile) and a file picker button (accepts `image/*`).
- **FR-1.2:** The farmer can also drag-and-drop an image onto the upload area on desktop.
- **FR-1.3:** Only image files are accepted. Non-image files show an inline error.
- **FR-1.4:** Images larger than 10MB are automatically resized/compressed before upload.
- **FR-1.5:** A preview of the selected photo is shown immediately, before analysis begins.

### FR-2: Farm Selection
- **FR-2.1:** If the farmer has one or more registered farms, a farm selector appears above the upload area.
- **FR-2.2:** If exactly one farm exists, it is pre-selected and the selector is hidden (no redundant choice).
- **FR-2.3:** If multiple farms exist, a dropdown lists all farms with their name and primary crop.
- **FR-2.4:** If no farms exist, a message prompts the farmer to register a farm first, with a link to `/farms/new`. The upload flow remains usable but results are unlinked.
- **FR-2.5:** The selected farm persists across scans until the farmer changes it or navigates away.

### FR-3: Analysis
- **FR-3.1:** On photo submission, the image is sent to an AI analysis service.
- **FR-3.2:** During analysis, a loading state shows the photo preview, a spinner, and "Reading the leaf…" text.
- **FR-3.3:** Analysis completes within 5 seconds under normal network conditions.
- **FR-3.4:** If the AI service returns no clear result, the farmer sees "Could not identify the disease — try a clearer photo of the affected area."
- **FR-3.5:** If the AI service fails (timeout, error), the farmer sees "Service temporarily unavailable" with a retry button.

### FR-4: Diagnosis Display
- **FR-4.1:** The result card shows the disease name as the primary heading.
- **FR-4.2:** A confidence score is displayed as a percentage (e.g., "Confidence 87%").
- **FR-4.3:** A severity chip uses the project's existing severity ladder: Watch, Treat Now, Clear.
- **FR-4.4:** The affected crop is identified and displayed.
- **FR-4.5:** Causes are explained in 1–2 plain-language sentences.
- **FR-4.6:** "What to do" shows 3–4 numbered steps in plain language.
- **FR-4.7:** A re-scan timing suggestion is shown (e.g., "Scan again in 7 days").
- **FR-4.8:** A caution note advises confirming treatment with a local agriculture office before spraying.
- **FR-4.9:** The diagnosis is in the farmer's selected language (English first, Urdu next, extending to other languages as they roll out).

### FR-5: Post-Detection Actions
- **FR-5.1:** "Save to farm" — if a farm is selected, this button saves the detection result to that farm's records. If no farm is selected, the button is hidden.
- **FR-5.2:** "Discuss with advisor" — opens `/advisor` in a new conversation with the scan result as context. The advisor can reference the detection in its response.
- **FR-5.3:** "Scan another leaf" — resets the flow to the idle state, keeping the farm selection intact.
- **FR-5.4:** All three actions are visible and tappable on mobile (minimum 44×44px touch targets).

### FR-6: Scan History
- **FR-6.1:** Every scan (whether saved to a farm or not) appears in the "Past scans" list.
- **FR-6.2:** Each history item shows: an outcome chip (Watch / Treat Now / Clear), the finding (disease name), the crop, and the date.
- **FR-6.3:** History items are sorted newest-first.
- **FR-6.4:** Tapping a history item opens that scan's full result card.
- **FR-6.5:** History persists across sessions and devices (stored in the database).
- **FR-6.6:** The farmer's full history is scoped to their account only.

### FR-7: Authentication
- **FR-7.1:** `/detect` is only accessible to authenticated farmers. Unauthenticated users are redirected to `/login`.
- **FR-7.2:** Every analysis request validates the farmer's session server-side before processing.

### FR-8: Responsive Layout
- **FR-8.1:** On desktop (≥lg), the page uses a two-column layout: scan flow on the left (3/5), history on the right (2/5).
- **FR-8.2:** On mobile, the scan flow is full-width, and history appears below.
- **FR-8.3:** The bottom tab bar is visible on mobile with `/detect` active.
- **FR-8.4:** The desktop sidebar is visible on desktop with `/detect` active.

---

## 4. Edge Cases & Rules

| # | Situation | Expected behaviour |
|---|---|---|
| E1 | Farmer uploads a non-image file | Inline error: "Please upload an image file." No analysis attempt. |
| E2 | Farmer uploads an image larger than 10MB | Image is compressed before upload. No error shown to farmer. |
| E3 | Farmer has zero farms | Farm selector is replaced with a "Register a farm first" prompt. Upload and analysis still work. Result cannot be saved to a farm. |
| E4 | Farmer has one farm | Farm is pre-selected automatically. Selector is hidden. "Save to farm" button is available. |
| E5 | Farmer has multiple farms | Dropdown shows all farms. Farmer must select one before or after upload. |
| E6 | AI service returns no clear diagnosis | Result card shows "Could not identify the disease — try a clearer photo of the affected area." with retry option. |
| E7 | AI service times out or errors | "Service temporarily unavailable" message with retry button. No partial or corrupted result. |
| E8 | Farmer taps "Save to farm" without selecting a farm | Button is hidden or disabled. Farmer is prompted to select a farm first. |
| E9 | Farmer rapidly taps "Analyze" multiple times | Only one analysis request is sent. Subsequent taps are ignored until the current analysis completes or fails. |
| E10 | Farmer navigates away during analysis | The request is aborted. No result is saved. No error shown. |
| E11 | Farmer has 100+ scans in history | The list scrolls smoothly. Pagination or virtual scroll is used if needed. |
| E12 | Farmer uploads the same image twice | Two separate scan records are created, each with its own timestamp and result. |
| E13 | Farmer is on a slow network | A loading state is shown. If the request exceeds 30 seconds, it is aborted with a retry option. |
| E14 | Farmer's session expires mid-request | The request is rejected server-side. Farmer is redirected to `/login`. |
| E15 | Two farmers upload the same image | Each gets their own scan record scoped to their account. No cross-account data leakage. |

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
| AC-7 | Farmer with one farm sees it pre-selected | Manual: log in as farmer with one farm, open `/detect`, verify farm is pre-selected |
| AC-8 | Farmer with multiple farms sees a dropdown selector | Manual: log in as farmer with 2+ farms, open `/detect`, verify dropdown lists all farms |
| AC-9 | Farmer with no farms sees a registration prompt | Manual: log in as farmer with no farms, open `/detect`, verify prompt + link to `/farms/new` |
| AC-10 | Analysis completes within 5 seconds under normal conditions | Manual: upload a clear leaf photo, verify result appears within 5 seconds |
| AC-11 | Result card shows all required fields: disease name, confidence, severity, crop, causes, steps, re-scan timing, caution | Manual: verify each field is present in the result card |
| AC-12 | Severity chip uses the project's existing severity ladder | Manual: verify chip uses Watch / Treat Now / Clear styling matching advisor |
| AC-13 | "Save to farm" saves the result to the selected farm | Manual: select a farm, scan a leaf, tap "Save to farm", verify scan appears in farm records |
| AC-14 | "Discuss with advisor" opens advisor with scan context | Manual: tap "Discuss with advisor", verify `/advisor` opens with scan result referenced |
| AC-15 | "Scan another leaf" resets the flow without losing farm selection | Manual: tap "Scan another leaf", verify upload area resets but farm selector stays |
| AC-16 | Past scans list shows all previous scans newest-first | Manual: perform 3 scans, verify history shows them in reverse chronological order |
| AC-17 | Tapping a past scan opens its full result | Manual: tap a history item, verify full result card appears |
| AC-18 | Scan history persists across page reloads | Manual: perform a scan, reload `/detect`, verify scan is still in history |
| AC-19 | Graceful error shown when AI service is unavailable | Manual: simulate API failure, verify "Service temporarily unavailable" + retry button |
| AC-20 | Diagnosis is in English by default | Manual: log in with English locale, scan a leaf, verify response is English |
| AC-21 | Diagnosis is in Urdu when locale is Urdu | Manual: log in with Urdu locale, scan a leaf, verify response is in Urdu script |
| AC-22 | `npm run lint` passes | Automated: run `npm run lint`, verify zero errors |
| AC-23 | `npm run build` passes | Automated: run `npm run build`, verify zero errors |
