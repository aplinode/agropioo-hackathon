# Plan: AI Crop Disease Detection (`/detect`)

> Spec: `specs/ai-crop-disease-detection/spec.md`
> Current state: UI-only demo (`detect-upload.tsx`, `demo-data.ts`, `page.tsx`) with hardcoded sample data. No backend, no DB table, no AI integration.

---

## Key Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Cloudinary** for scan image storage (FR-6.8) | Explicitly required by spec. Adds `cloudinary` npm package — requires approval per constitution. |
| D2 | **`sharp`** for server-side 384×384 resize (FR-8.3) | Spec mandates server resize before HF call. `sharp` is the standard Node image lib. Requires approval. |
| D3 | **Confidence threshold = 0.5** (FR-3.4, FR-8.5) | Below 50% → "Could not identify." Covers low-quality photos and non-leaf inputs. |
| D4 | **Severity is per-disease, not per-confidence** | Spec FR-4.3 says "Watch / Treat Now / Clear" ladder. Confidence gates whether we show a result at all; severity is a property of the disease. |
| D5 | **HF Inference API via raw `fetch`** (FR-8.1–8.3) | No HF SDK needed. `POST https://api-inference.huggingface.co/models/animeshakr/plant-disease-efficientnetv2s` with image binary + bearer token. Server-side only. |
| D6 | **Advisor pre-fill via `/advisor?draft=<msg>`** (FR-5.2) | Advisor page reads `searchParams`, passes `initialDraft` to client. Farmer can edit before sending. |
| D7 | **"Save to farm" inserts into `records`** (FR-5.1) | Reuses existing `records` table with `type='disease'`. Keeps farm record history consistent. |
| D8 | **Diagnosis text uses i18n catalog keys as fallback** (FR-4.9, constitution) | Primary advice comes from LLM (D11). Static mapping file stores keys for fallback only — used when LLM fails or is unavailable. All keys added to `catalog/en.ts`; sync script populates DB for all 8 locales. Urdu translations added to `catalog/ur.ts`. |
| D9 | **Client compresses to 1024px; server resizes to 384×384** (FR-1.4, FR-8.3) | Client: Canvas API, 80% JPEG. Server: `sharp` to 384×384 before HF call. |
| D10 | **`detect_scans` table scope** (FR-6) | Every scan saved regardless of farm link. `farm_id` is NULL until "Save to farm" is tapped. |
| D11 | **LLM advice generation via advisor infrastructure** (FR-4.5, FR-4.6, FR-8.4) | After HF classification, detected disease label is sent to the same Groq/OpenAI-compatible LLM used by the advisor feature (`lib/advisor/tools/knowledge-base.ts`). LLM generates causes, treatment steps, rescan timing, and caution in the farmer's locale. Static catalog (`plantvillage-map.ts`) remains as fallback if LLM fails. Zero new dependencies. |
| D12 | **Detect chat sessions use separate tables** (FR-10) | `detect_chats` + `detect_messages` tables mirror the advisor `conversations`/`messages` pattern. Keeps disease chat history scoped and independent from advisor. |
| D13 | **Detect chat UI layout** (FR-10.1, FR-10.11) | Chat container is wider than upload flow. Image appears in messages area below composer (ChatGPT pattern). Auto-prompt pre-filled from diagnosis. Textarea auto-expands up to ~6 lines, then scrolls. Shift+Enter for line breaks; Enter submits. |
| D14 | **Detect chat LLM reuses OpenAI client** (FR-10.10) | New `lib/detect/chat.ts` uses the same `getOpenAI()` client as the advisor. No new dependencies. Streaming via SSE with the same `toSSEStream` utility. |
| D15 | **Auto-prompt generated from diagnosis** (FR-10.4) | Prompt templates select based on disease and crop. Example: "Why do my {crop} leaves have {symptom}?" The farmer can edit before sending. |

---

## Dependencies Requiring Approval

| Package | Purpose | Weight |
|---|---|---|
| `cloudinary` | Scan image upload to Cloudinary | Light — single-purpose SDK |
| `sharp` + `@types/sharp` | Server-side image resize for HF model | Medium — native module, ~3MB |

---

## Environment Variables

Add to `.env.example`:

```env
# AI Crop Detection
HUGGINGFACE_API_KEY=
# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Ordered Task List

### Task 1: Database Migration

**File:** `db/migrations/0007_detect_chats.sql`

```sql
CREATE TABLE IF NOT EXISTS public.detect_chats (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scan_id       uuid        REFERENCES public.detect_scans(id) ON DELETE SET NULL,
  title         text        NOT NULL DEFAULT 'New detection chat',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.detect_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         uuid        NOT NULL REFERENCES public.detect_chats(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('farmer', 'detect')),
  content         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS detect_chats_account_idx
  ON public.detect_chats (account_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS detect_messages_chat_idx
  ON public.detect_messages (chat_id, created_at);
```

Apply via Supabase MCP or `npm run db:push`.

---

### Task 2: Rate Limiting

**File:** `lib/auth/rate-limit.ts`

Add `detectIp: { limit: 10, windowMs: HOUR_MS }` to `RATE_RULES`.

---

### Task 3: Zod Validation

**File:** `lib/validation/detect.ts` (new)

```ts
export const detectSaveSchema = z.object({
  scanId: z.string().uuid(),
  farmId: z.string().uuid(),
});
```

No complex body schema for the main detect endpoint — it uses `FormData` with a single `image` file, validated manually.

---

### Task 4: PlantVillage Class Mapping

**File:** `lib/detect/plantvillage-map.ts` (new)

Map all 38 PlantVillage class labels to structured objects:

```ts
export interface DiseaseAdvice {
  diseaseNameKey: CatalogKey;
  cropKey: CatalogKey;
  severity: 'watch' | 'treat_now' | 'clear';
  causesKey: CatalogKey;
  stepsKeys: CatalogKey[];
  rescanKey: CatalogKey;
  cautionKey: CatalogKey;
}

const CLASS_MAP: Record<string, DiseaseAdvice> = { ... };

export function resolveClass(rawLabel: string): DiseaseAdvice | null { ... }
```

Each field is a catalog key, resolved at runtime via `getDictionary(locale)`.

---

### Task 5: i18n Catalog Additions

**File:** `catalog/en.ts`

Add ~20 detect UI keys + 228 disease-mapping keys (~38 diseases × 6 strings). Examples:

```ts
// UI chrome
"app.detect.eyebrow": "Crop doctor",
"app.detect.title": "Spot disease before it spreads",
"app.detect.uploadPrompt": "Photograph the sick leaf",
"app.detect.takePhoto": "Take or choose a photo",
"app.detect.sampleScan": "No photo handy? Run a sample scan",
"app.detect.readingLeaf": "Reading the leaf…",
"app.detect.analyzing": "Analyzing…",
"app.detect.scanAnother": "Scan another leaf",
"app.detect.discussAdvisor": "Discuss with advisor",
"app.detect.saveToFarm": "Save to farm",
"app.detect.savedToFarm": "Saved to {farm}",
"app.detect.notSaved": "Not saved",
"app.detect.confidence": "Confidence {pct}%",
"app.detect.whatToDo": "What to do now",
"app.detect.rescanTiming": "Scan again in {days} days",
"app.detect.caution": "Always confirm treatment with your local agriculture office before spraying.",
"app.detect.noFarmsTitle": "Register a farm first",
"app.detect.noFarmsBody": "Link your scans to a farm to build a full disease history.",
"app.detect.addFarm": "Add farm",
"app.detect.dismiss": "I'll do this later",
"app.detect.pastScans": "Past scans",
"app.detect.loadMore": "Load more",
"app.detect.invalidFile": "Please upload an image file.",
"app.detect.serviceUnavailable": "Service temporarily unavailable. Please try again.",
"app.detect.noDiagnosis": "Could not identify the disease — try a clearer photo of the affected area.",
"app.detect.retry": "Retry",
"app.detect.savedStatus": "Saved to {farm}",
"app.detect.unsavedStatus": "Not saved",

// Disease mapping (example subset — all 38 needed)
"app.detect.disease.Tomato___Early_blight.name": "Early blight",
"app.detect.disease.Tomato___Early_blight.crop": "Tomato",
"app.detect.disease.Tomato___Early_blight.causes": "Fungal spores spread in warm, wet conditions...",
"app.detect.disease.Tomato___Early_blight.steps.0": "Remove infected leaves...",
// ... etc for all 38 classes × 6 strings
```

**File:** `catalog/ur.ts` — add Urdu translations for all detect UI keys.

Run `npm run sync:translations` to upsert all keys into the `translations` table for all 8 locales. Non-English locales get `status='missing'` for disease content until translated.

---

### Task 6: Hugging Face API Client

**File:** `lib/detect/huggingface.ts` (new)

```ts
export async function callHuggingFace(imageBuffer: Buffer): Promise<{ label: string; score: number }[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HUGGINGFACE_API_KEY");

  const res = await fetch(
    "https://api-inference.huggingface.co/models/animeshakr/plant-disease-efficientnetv2s",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: imageBuffer,
      // HF expects raw image bytes for image-classification pipeline
    }
  );

  if (res.status === 503) throw new Error("SERVICE_UNAVAILABLE");
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`HF error ${res.status}`);

  return res.json();
}
```

---

### Task 7: Cloudinary Upload Utility

**File:** `lib/detect/cloudinary.ts` (new)

```ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadScanImage(
  buffer: Buffer,
  accountId: string,
  filename: string,
): Promise<string> {
  const upload = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `scans/user_${accountId}`,
        public_id: filename.replace(/\.[^.]+$/, ''),
        resource_type: 'image',
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result!);
      }
    ).end(buffer);
  });
  return upload.secure_url;
}
```

---

### Task 8: Image Compression Utilities

**File:** `lib/detect/compress.ts` (new)

Client-side (runs in browser, exported as a helper the client component imports):

```ts
export async function compressImageClient(file: File): Promise<{ blob: Blob; previewUrl: string }> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const MAX = 1024;
  let { width, height } = img;
  if (width > MAX || height > MAX) {
    const ratio = Math.min(MAX / width, MAX / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  const previewUrl = URL.createObjectURL(blob);
  return { blob, previewUrl };
}
```

Server-side (used in API route before HF call):

```ts
import sharp from 'sharp';

export async function resizeForModel(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(384, 384, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer();
}
```

---

### Task 9: `POST /api/detect` Handler

**File:** `app/api/detect/route.ts` (new)

Flow:

```
1. requireSessionApi() → 401 if unauthenticated
2. hitLimiter("detectIp", clientIp, 10, HOUR_MS) → 429 if exceeded
3. Parse FormData, extract `image` file
4. Validate: file must be image type (FR-1.3)
5. Client-side already compressed (FR-1.4), but re-validate size
6. Resize to 384×384 via sharp (FR-8.3)
7. Call HF Inference API (FR-8.1–8.2)
8. If low confidence (< 0.5) → return no_diagnosis shape (FR-3.4, FR-8.5)
9. Map class label → DiseaseAdvice via plantvillage-map (for severity + crop fallback)
10. Call LLM advice generator (D11) with disease label, crop, severity, locale, confidence
11. If LLM succeeds → use dynamic causes, steps, rescanTiming, caution
12. If LLM fails → fall back to static catalog keys resolved via getDictionary(locale)
13. Upload compressed image to Cloudinary (FR-6.8)
14. INSERT INTO detect_scans with Cloudinary URL
15. Return structured diagnosis
```

Response shape:

```json
{
  "scanId": "uuid",
  "diseaseName": "Early blight",
  "confidence": 87,
  "severity": "treat_now",
  "crop": "Tomato",
  "causes": "Fungal spores spread in warm, wet conditions...",
  "steps": ["Remove infected leaves...", "..."],
  "rescanTiming": "Scan again in 7 days",
  "caution": "Always confirm treatment...",
  "imageUrl": "https://res.cloudinary.com/..."
}
```

Error shape: `{ error: { code, message } }` with codes `validation_error`, `rate_limited`, `server_error`.

Abort support: accept `signal` from request, abort HF call if navigated away (FR-S22, E10).

---

### Task 9a: LLM Advice Generator Module

**File:** `lib/detect/llm-advice.ts` (new)

Reuses the existing `getOpenAI()` client from `lib/advisor/tools/knowledge-base.ts`. No new dependencies.

```ts
export interface LlmAdvice {
  causes: string;
  steps: string[];
  rescanTiming: string;
  caution: string;
}

export async function generateAdvice(params: {
  diseaseLabel: string;
  crop: string;
  severity: string;
  locale: string;
  confidence: number;
}): Promise<LlmAdvice>
```

- Calls `OPENAI_BASE_URL` / `ADVISOR_MODEL` env vars (same as advisor)
- System prompt instructs LLM to respond in `params.locale`
- User prompt includes disease label, crop, severity, confidence
- Requests JSON output with `response_format: { type: "json_object" }`
- Parses and validates JSON; throws on invalid format
- Route handler catches errors and falls back to static catalog

---

### Task 10: `GET /api/detect/history` Handler

**File:** `app/api/detect/history/route.ts` (new)

```
GET /api/detect/history?cursor=&limit=20
```

- `requireSessionApi()`
- Query `detect_scans` where `account_id = $1`, ordered `created_at DESC`
- Cursor-based pagination: if `cursor` provided, fetch `WHERE created_at < cursor`
- Return `{ scans: [...], nextCursor: string | null }`
- Each scan: `{ id, diseaseName, confidence, severity, crop, imageUrl, createdAt, farmId, saveStatus }`

---

### Task 11: `POST /api/detect/save` Handler

**File:** `app/api/detect/save/route.ts` (new)

```
POST /api/detect/save
Body: { scanId: string, farmId: string }
```

- `requireSessionApi()`
- Validate with `detectSaveSchema`
- Verify scan belongs to account
- INSERT INTO `records` with `type='disease'`, `season`/`year` from current date, `event_date = today`, `title = diseaseName`, `note = JSON.stringify({ scanId, confidence, steps, ... })`
- UPDATE `detect_scans` SET `farm_id = $1` WHERE `id = $2`
- Return `{ saved: true, recordId: string }`

---

### Task 12: Detect Page Rewrite

**File:** `app/(farmer)/(dashboard)/detect/page.tsx`

- Server Component
- Remove `lg:grid-cols-5` / `lg:col-span-3` layout constraint so `DetectUpload` can manage its own width.
- Fetch farms (`query farms WHERE account_id = $1`) and recent scans (`query detect_scans ... LIMIT 20`) server-side
- Pass as props to `DetectUpload`
- Add `getDetectBundle()` for i18n strings

**File:** `app/(farmer)/(dashboard)/detect/detect-upload.tsx`

- Rewrite from demo to real implementation
- Stages: `idle` → `analyzing` → `result` → `chat`
- Add `FarmSelector` component (client)
- Add no-farms modal (FR-2.3)
- Add drag-and-drop support (FR-1.2, E18)
- Client-side compression before API call (FR-1.4)
- AbortController for navigation-away (E10, S22)
- Debounce/disable analyze button during analysis (S21)
- Result card: severity chip, confidence, causes, steps, rescan timing, caution (FR-4)
- "Save to farm" button → calls `/api/detect/save` (FR-5.1)
- "Discuss with advisor" → `/advisor?draft=<msg>` (FR-5.2)
- "Scan another leaf" → resets to idle, keeps farm selection (FR-5.3)
- Error states: invalid file, service unavailable, no diagnosis (FR-3.4, FR-3.5, E1, E6, E7)
- **Fix type guard in `enterChatMode`**: use `"id" in scan` to distinguish `ScanHistoryItem` from `DiagnosisResult` so `scanId` is preserved when creating chat sessions.
- **Generate auto-prompt** from diagnosis (`crop`, `diseaseName`) and pass as `initialDraft` to `DetectChat`.
- **Chat width**: when `stage === "chat"`, render with wider container classes.

**New files:**
- `detect/farm-selector.tsx` — dropdown + no-farms modal
- `detect/scan-history.tsx` — paginated list, "Load more" button
- `detect/diagnosis-card.tsx` — result display component
- `detect/detect-chat.tsx` — chat UI with wider container, image in messages area, auto-expanding textarea composer

---

### Task 13: Advisor Pre-fill

**File:** `app/(farmer)/(dashboard)/advisor/page.tsx`

- Accept `searchParams: Promise<{ draft?: string }>`
- Pass `initialDraft` to `AdvisorChat`

**File:** `app/(farmer)/(dashboard)/advisor/advisor-chat.tsx`

- Add `initialDraft?: string` prop
- Use as initial `draft` state value
- On mount, if `initialDraft` exists, focus the input (don't auto-send — farmer edits first per FR-5.2)

---

### Task 14: Tests

**File:** `lib/validation/detect.test.ts` (new)

- Test `detectSaveSchema` validates valid input, rejects invalid UUIDs

**File:** `lib/auth/rate-limit.test.ts` — add detect rate limit test

**File:** `app/api/detect/route.test.ts` (new) — mock HF + DB, test:
- Unauthenticated → 401
- Non-image file → 422
- Low confidence → no_diagnosis response
- HF 503 → service_unavailable
- Valid image → scan record created, Cloudinary URL present

---

### Task 15: `.env.example` Update

Add the 4 new env vars listed in the Dependencies section above.

---

## Validation Plan

| AC | How to verify |
|---|---|
| AC-1 | Open `/detect` logged in → upload area visible |
| AC-2 | Open `/detect` logged out → redirect `/login` |
| AC-3 | Mobile camera opens on camera button tap |
| AC-4 | File picker opens on choose button tap |
| AC-5 | Upload `.pdf` → inline error, no analysis |
| AC-6 | Upload 15MB image → compresses silently, analyzes |
| AC-7 | Farmer with farms → dropdown lists all farms |
| AC-8 | Farmer with no farms → modal with "Add farm" + "I'll do this later" |
| AC-9 | Clear leaf photo → result within 5s |
| AC-10 | Result card has all 8 required fields |
| AC-11 | Severity chip shows Watch / Treat Now / Clear |
| AC-12 | "Save to farm" → scan appears in farm records |
| AC-13 | "Discuss with advisor" → `/advisor` opens with pre-filled input |
| AC-14 | Pre-filled text is editable before sending |
| AC-15 | Chat container is wider than upload flow |
| AC-16 | Uploaded image appears in chat messages area |
| AC-17 | Auto-generated prompt pre-filled in chat input |
| AC-18 | Prompt bar auto-expands with content |
| AC-19 | "Scan another leaf" resets flow, farm selection stays |
| AC-20 | 3 scans → history shows newest-first |
| AC-21 | Tap history item → full result card opens |
| AC-22 | Reload page → history persists |
| AC-23 | Simulate HF failure → "Service temporarily unavailable" + retry |
| AC-24 | 100+ scans → 20 shown, "Load more" loads next 20 |
| AC-25 | Verify Cloudinary URL in DB + correct folder |
| AC-26 | 11th request from same IP/hour → blocked |
| AC-27 | Drag image onto drop zone → accepted and previewed |
| AC-28 | `npm run lint` → zero errors |
| AC-29 | `npm run build` → zero errors |

---

## Risks

1. **HF Inference API cold starts**: Free tier models can take 10-30s on first request. Mitigation: show "Reading the leaf…" spinner; if timeout, return FR-3.5 error.
2. **Cloudinary dependency approval**: If denied, fallback is server-side base64 in DB (increases DB size, violates FR-6.8). Flag early.
3. **Sharp native module**: May fail to build on some Windows environments. Mitigation: test `npm install sharp` locally first; if it fails, use `jimp` (pure JS) instead.
4. **38-class translation volume**: ~228 keys per locale. Use sync script; start with English + Urdu, leave others as `missing`.
5. **LLM API latency adds 1-3s**: Total analysis time increases. Mitigation: LLM call runs in parallel with Cloudinary upload where possible; static fallback ensures result still appears if LLM times out.
6. **LLM may return non-JSON**: Mitigated by try/catch in `generateAdvice()` with static catalog fallback (FR-3.5 graceful degradation).
7. **LLM language adherence**: Prompt instructs LLM to respond in farmer's locale, but may occasionally mix English. Mitigation: system prompt is explicit; fallback to static English catalog if LLM output is unusable.

---

## Out of Scope (per spec §5)

- Voice I/O, offline analysis, video feed, batch upload, manual diagnosis override, social sharing, push notifications, weather/satellite prediction, dark mode, expert role.

---

## Post-Plan Questions

None — all key decisions resolved. Ready to implement.
