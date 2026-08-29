# Plan: AI Crop Disease Detection (`/detect`)

> Locked decisions (from spec + Q/A):
> - AI provider: Hugging Face Inference — `plant-disease-classifier` model
> - Image storage: Cloudinary (URL saved in DB; creds already in `.env`)
> - Scan history: Separate `detection_scans` table
> - Farm sync: Full selector (0/1/many farms) + save-to-farm action
> - Advisor link: Pre-filled message with scan context

---

## Task 1 — Database migration

Create `db/migrations/0004_detection_scans.sql`:

```sql
CREATE TABLE detection_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id uuid REFERENCES farms(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  crop text NOT NULL,
  disease text NOT NULL,
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  severity text NOT NULL CHECK (severity IN ('watch','treat_now','clear')),
  causes text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  re_scan_after_days integer,
  caution text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_detection_scans_account_id ON detection_scans(account_id);
CREATE INDEX idx_detection_scans_farm_id ON detection_scans(farm_id);
CREATE INDEX idx_detection_scans_created_at ON detection_scans(created_at DESC);
```

Apply via `supabase_apply_migration` or SQL client. Update `.env.example` with `HF_API_KEY` and `CLOUDINARY_*` placeholders.

---

## Task 2 — Shared utilities

### `lib/cloudinary.ts`
- `uploadImage(buffer: Buffer, folder: string): Promise<string>` — uploads to Cloudinary, returns secure URL.
- Uses `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from env.
- Error shape: `{ error: { code, message } }` per constitution.

### `lib/detect/hf-client.ts`
- `analyzeCropDisease(imageUrl: string): Promise<DetectResult>` — calls Hugging Face Inference API.
- Model: `josecanepa/plant-disease-classification` (or equivalent PlantVillage-trained model).
- Endpoint: `https://api-inference.huggingface.co/models/<model>`
- Headers: `Authorization: Bearer ${HF_API_KEY}`
- Request: binary image bytes (from Cloudinary URL fetch)
- Response parsing: map HF output to `{ crop, disease, confidence, severity, causes, steps, re_scan_after_days, caution }`
- Fallback: if HF returns low confidence or error, return structured "could not identify" result.
- Timeout: 30s. Error shape: `{ error: { code, message } }`.

### `lib/validation/detect.ts`
- Zod schema for `/api/detect` body: `{ image: File }` — validates file is image, max 10MB.
- Response schema for structured diagnosis.

---

## Task 3 — API route: `POST /api/detect`

`app/api/detect/route.ts`:
- `requireSessionApi()` guard.
- Zod validation on body (multipart/form-data).
- Steps:
  1. Receive image file.
  2. Upload to Cloudinary via `uploadImage()`. Returns `imageUrl`.
  3. Call `analyzeCropDisease(imageUrl)`. Returns structured `DetectResult`.
  4. Save scan to `detection_scans` table with `account_id`, `farm_id` (optional), `image_url`, and all diagnosis fields.
  5. Return `{ scanId, result }` with uniform error shape on failure.
- Rate limiting: per-IP, 10 req/hour (same pattern as advisor).

---

## Task 4 — API route: `GET /api/detect/scans`

`app/api/detect/scans/route.ts`:
- `requireSessionApi()` guard.
- `SELECT * FROM detection_scans WHERE account_id = $1 ORDER BY created_at DESC LIMIT 50`
- Returns array of scans scoped to logged-in farmer.

---

## Task 5 — API route: `GET /api/detect/scans/[id]`

`app/api/detect/scans/[id]/route.ts`:
- `requireSessionApi()` guard.
- `SELECT * FROM detection_scans WHERE id = $1 AND account_id = $2`
- Returns single scan or 404.

---

## Task 6 — Frontend: Farm selector component

`app/(farmer)/(dashboard)/detect/farm-selector.tsx`:
- Server Component (no interactivity needed beyond `<select>`).
- Fetches farmer's farms via existing `query()` from `lib/db`.
- Logic:
  - 0 farms: show "Register a farm first" message + link to `/farms/new`.
  - 1 farm: hidden (pre-selected internally via prop/state).
  - 2+ farms: `<select>` dropdown with farm name + primary crop.
- Uses existing design tokens (`agro-canopy`, `agro-sprout`, etc.).

---

## Task 7 — Frontend: Update detect page

### `app/(farmer)/(dashboard)/detect/detect-upload.tsx`
- Replace demo timer with real `POST /api/detect` call.
- Remove `sampleDiagnosis` and `demoScanHistory` imports.
- Add state: `selectedFarmId`, `farms`, `error`, `analyzing`.
- Add drag-and-drop support on desktop.
- Add image compression (>10MB) using browser Canvas API before upload.
- On result:
  - Show structured `DetectResult` in result card.
  - Show "Save to farm" button (hidden if no farm selected).
  - Show "Discuss with advisor" button → navigates to `/advisor?message=<encoded scan summary>`.
  - Show "Scan another leaf" → resets to idle, keeps farm selection.
- On "Save to farm": call existing `POST /api/records` with `type: 'disease'`, linking to selected `farm_id`.

### `app/(farmer)/(dashboard)/detect/page.tsx`
- Fetch scan history from `GET /api/detect/scans` (server-side).
- Replace `demoScanHistory` with real data.
- Pass real scans to history list.
- Remove demo-only banner.

### `app/(farmer)/(dashboard)/detect/demo-data.ts`
- Delete entirely (no longer needed).

---

## Task 8 — Advisor integration

### Advisor pre-filled message
When farmer taps "Discuss with advisor":
- Navigate to `/advisor` with a new conversation.
- Pre-fill input with: *"I just scanned my [crop] leaf and detected [disease] with [confidence]% confidence. Severity: [severity]. What should I do?"*
- Advisor backend (`POST /api/advisor/chat`) receives this as the first message in a new conversation.
- Advisor's `FarmerContext` should optionally include recent detection scans (query `detection_scans` where `account_id = session.accountId` and `created_at > now() - interval '7 days'`) so it can reference them proactively.

---

## Task 9 — Environment variables

Add to `.env` (and `.env.example`):
```env
HF_API_KEY=your_huggingface_api_key
CLOUDINARY_CLOUD_NAME=zvo3skb2
CLOUDINARY_API_KEY=982665975794145
CLOUDINARY_API_SECRET=rAYptFVrXbjrTiQjsaETlZtBHgE
```

Note: Cloudinary creds already present in `.env`. HF_API_KEY needs to be added.

---

## Validation plan

| Check | How |
|---|---|
| Lint | `npm run lint` — zero errors |
| Build | `npm run build` — zero errors |
| Auth | Unauthenticated `/detect` redirects to `/login` |
| Upload | Mobile camera + file picker + drag-drop all work |
| Analysis | Clear leaf photo returns diagnosis within 5s |
| Farm sync | 0/1/many farms scenarios all render correctly |
| History | Scans persist, load on reload, newest-first |
| Save to farm | Detection creates a `disease` record in `records` table |
| Advisor link | "Discuss with advisor" opens advisor with pre-filled context |
| Error states | Non-image file, large file, API timeout all show graceful messages |
| RTL | Urdu locale renders diagnosis RTL |

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| HF model unavailable or slow | Timeout 30s + fallback "service temporarily unavailable" + retry |
| Cloudinary upload fails | Error shown, farmer can retry |
| Large images crash upload | Canvas compression before upload (max 10MB) |
| HF free tier rate limits | Cache identical image hashes; show rate-limit error if exceeded |
| Advisor context leakage | `detection_scans` scoped to `account_id`; advisor only fetches own scans |

---

## Out of scope (per spec)

- Offline analysis
- Batch upload
- Manual diagnosis edit
- Voice I/O
- Push notifications
- Dark mode
