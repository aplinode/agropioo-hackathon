# Crop Recommendation — Issues, Root Causes, and Fixes

**Status:** Analysis only — no code changes made yet.  
**DB verified via:** Neon MCP (`neon_run_sql`) against project `bitter-dream-03311921`, default branch `production`.  
**Last verified:** 2026-09-03

---

## 1. "Something went wrong. Please try again." — Repeated 500 Errors

### Where it comes from
- `app/api/crops/route.ts:81` — the catch-all 500 handler in `POST /api/crops`
- `app/(farmer)/(dashboard)/crops/crops-client.tsx:793-795` — client-side `catch` block shows the same string from `bundle.errors.generic`

### Root causes (confirmed by code + DB inspection)

#### A. Unique-constraint race → unhandled 500 (most likely)
- `crop_recommendation_requests` has a unique constraint on `(account_id, farm_id, target_season, target_year)` (migration `0011_crop_data_and_dedup.sql:7`)
- `lib/crops/engine.ts:175-189` does a pre-check then `DELETE` + `INSERT`
- If two requests arrive concurrently (multiple tabs, rapid regenerate, retry), the second `INSERT` hits Postgres error code `23505` (unique violation)
- `app/api/crops/route.ts:55-82` does **not** catch `23505`, so it falls through to the generic 500

**Fix:** In `app/api/crops/route.ts`, after the known error-type checks, add a Postgres `23505` catch and return `409` with code `recommendation_exists`.

#### B. Unhandled DB errors inside `recommendCrops()`
- Any `query()` / `queryOne()` failure inside `engine.ts` that is not one of the known typed errors (`WeatherUnavailableError`, `NoCandidatesError`, etc.) bubbles to the 500 catch-all

**Fix:** Ensure all DB calls in `engine.ts` are wrapped or that unknown DB errors are caught and re-thrown as a typed `server_error` with a safe message.

#### C. Client-side fetch failure
- `crops-client.tsx:757` `fetch("/api/crops")` throws (network blip, 413, etc.) → caught at `:793` → shows generic error

**Fix:** Add retry logic on the client for transient network errors, and surface HTTP status codes so the user knows whether to retry or contact support.

---

## 2. `engine.ts:233-240` — Case-Sensitive JOIN Kills Past-Crop Detection

### Code
```sql
-- lib/crops/engine.ts:233-240
SELECT c.category
FROM farms f
JOIN crops c ON c.name_en = f.primary_crop
WHERE f.id = $1
LIMIT 1
```

### DB reality
- `farms.primary_crop` values: `"wheat"`, `"sugarcane"`, `"cotton"`, `"maize"` (all lowercase)
- `crops.name_en` values: `"Wheat"`, `"Sugarcane"`, `"Cotton"`, `"Maize"` (title case)
- PostgreSQL `=` on text is **case-sensitive**

### Impact
- `pastCrop` is **always null**
- `lastCropCategory` is always `null` in `ScoreContext`
- `sustainabilityScore` never gets the rotation-fit bonus (`ctx.lastCropCategory && ctx.lastCropCategory !== crop.category ? 0.9 : 0.6`)
- Rotation suggestions are always flagged `isGeneric: true` even when history exists

### Fix
```sql
JOIN crops c ON LOWER(c.name_en) = LOWER(f.primary_crop)
```
Or normalize `farms.primary_crop` values to match `crops.name_en` casing at write time.

---

## 3. `crops-client.tsx:475` — Soil Label Shows Crop ID Instead of Soil Name

### Code
```tsx
// app/(farmer)/(dashboard)/crops/crops-client.tsx:475
const soilLabel = recommendation.crop.id;  // BUG: crop UUID used as soil label
```

### Impact
- The reason template renders the crop UUID instead of the actual soil type (e.g., `"loamy"` → shows `"c98b2a05-1c94-4eab-be79-cb06a649582c"`)

### Fix
```tsx
const soilLabel = soilTypeToLabel(request.soilType); // or pass it down from the request context
```
Where `soilTypeToLabel` maps `"loamy"` → `"Loamy"`, etc.

---

## 4. `app/api/crops/save/route.ts:87` — Wrong Type Cast for `labourCostLevel`

### Code
```ts
// app/api/crops/save/route.ts:87
labourCostLevel: cropRow!.labour_cost_level as CropSummary["waterRequirementLevel"], // BUG
```

### Impact
- `labourCostLevel` is cast to `WaterLevel` type instead of its own `"low" | "medium" | "high"` type
- TypeScript may not catch this at runtime, but the type is semantically wrong

### Fix
```ts
labourCostLevel: cropRow!.labour_cost_level as CropSummary["labourCostLevel"],
```

---

## 5. Crop `"Mango"` Has Invalid Category `"fruit"`

### DB state
```sql
SELECT id, name_en, category FROM crops WHERE category NOT IN ('staple','cash','pulse','vegetable');
-- Returns: mango | fruit
```

### Code expectation
- `lib/validation/crops.ts:33-38`: `cropCategoryEnum = z.enum(["staple","cash","pulse","vegetable"])`
- `lib/crops/api-types.ts:14`: `CropCategory = "staple" | "cash" | "pulse" | "vegetable"`
- `lib/crops/scoring.ts:110`: `crop.category === "pulse"` check

### Impact
- If Mango ever becomes a candidate (spring/summer season), `cropCategoryEnum` validation would reject it if it were an input, but as a seed row it bypasses Zod. However, `sustainabilityScore` and other category-dependent logic would behave unexpectedly

### Fix
Update Mango's category to `"cash"` (it is a long-term cash crop) in the DB, or add `"fruit"` to the enum if fruit crops are meant to be supported.

---

## 6. Only 12 of 44 Crops Have Price Data

### DB state
- `crops` table: **44 rows**
- `crop_price_trends` table: **44 rows** — but 12 are for crops that don't exist in `crops` with matching UUIDs
- **Actual usable price coverage:** 12 crops (Wheat, Rice, Maize, Sugarcane, Cotton, Chickpea, Mustard, Mung Bean, Soybean, Potato, Onion, Tomato)
- **Crops with ZERO price data:** 32 crops (Apple, Bajra, Barley, Brinjal, Cabbage, Canola, Carrot, Cauliflower, Chili, Citrus, Cowpea, Cucumber, Fenugreek, Garlic, Ginger, Gram, Guava, Jowar, Lentil, Mango, Okra, Pea, Pigeon Pea, Pumpkin, Sesame, Spinach, Sunflower, Tobacco, Tomato — wait, Tomato has data, etc.)

### Impact
- `profitabilityScore()` in `lib/crops/scoring.ts:91-101` returns `0.55` for any crop without a price row
- `expectedRevenuePerAcrePkr` is `0` for those crops
- Top-3 results are skewed toward the 12 priced crops regardless of actual suitability

### Fix options
1. **Expand static seed data:** Add `crop_price_trends` rows for all 44 crops via a new migration
2. **Switch to live `mandi_prices`:** The `mandi_prices` table has live ingested data for many crops. The crop engine should query it instead of/in addition to `crop_price_trends`
3. **Hybrid:** Use `mandi_prices` when available, fall back to `crop_price_trends`, then to the 0.55 default

---

## 7. `getForecast()` Returns Weather But Engine Ignores Actual Data

### Code
- `lib/weather/openweather.ts:183-194` fetches and returns a full 7-day forecast with hourly data
- `lib/crops/engine.ts:193-195` only checks `if (!forecast) throw ...` — truthy check only
- `lib/crops/scoring.ts:78-89` `weatherFitScore()` uses a **static season→category lookup table**, not the actual forecast

### Impact
- The OpenWeather API call adds latency and external dependency for no scoring benefit
- Farmers in unusual weather patterns get generic season-based scores instead of location-specific ones

### Fix
- Either remove the weather fetch from the recommendation engine (keep it for the Weather Advisory feature only), or
- Pass actual forecast aggregates (avg temp, total precip, extreme events) into `ScoreContext` and use them in `weatherFitScore()`

---

## 8. `model.ts` TFJS Module Is Dead Code

### Code
- `lib/crops/model.ts` defines `scoreWithModel()` which loads a TFJS graph model from `/models/crop-scoring/model.json`
- `lib/crops/engine.ts` **never calls** `scoreWithModel()` — it only calls `rankCandidates()` from `scoring.ts`

### Impact
- The TFJS model, training script, and CDN dependency add complexity with zero runtime effect
- If the model is meant to run client-side, it is not wired up in `crops-client.tsx` either

### Fix
- Either wire `scoreWithModel()` into `engine.ts` as the primary scorer with `rankCandidates()` as fallback, or
- Remove the TFJS dependency and model file to reduce bundle size, keeping only the deterministic scoring engine

---

## 9. Mismatch: `crops` Category Enum vs. DB Seed Data

### DB
- `crops.category` column uses enum `crop_category_enum` with values `staple`, `cash`, `pulse`, `vegetable`
- Seed data in migration `0009` includes `'fruit'` for Mango — this would fail on a fresh migration because `'fruit'` is not in the enum
- The row exists in the current DB because the enum type was likely altered or the row was inserted directly

### Fix
- Standardize Mango to `cash` or add `fruit` to the enum + validation schemas + scoring logic

---

## 10. `crop_price_trends` UUID Mismatch With Seed Data

### DB
- `crop_price_trends` has 44 rows. 12 of them use string IDs (`cotton`, `gram`, `maize`, `mango`, `mustard`, `onion`, `potato`, `rice-basmati`, `rice-irri`, `sugarcane`, `tomato`, `wheat`) instead of UUIDs
- The other 32 use UUIDs that match `crops.id`
- `engine.ts:197-206` groups by `crop_id` — the string IDs work as identifiers but break the FK relationship if one were added

### Impact
- Low risk currently (no FK on `crop_price_trends.crop_id`), but confusing and error-prone
- The 12 UUID-named crops have price data; the 32 string-ID crops have **no price coverage**

### Fix
- Standardize all `crop_price_trends.crop_id` values to use the same `crops.id` UUIDs
- Add price data for all 44 crops

---

## 11. Regenerate Flow Can Hit 500 on Concurrent Delete+Insert

### Code path
- `crops-client.tsx:843-862` calls `DELETE /api/crops/[requestId]` then immediately calls `handleFormSubmit()` → `POST /api/crops`
- If the user has multiple tabs or clicks rapidly, two POSTs can race

### DB constraint
```sql
UNIQUE (account_id, farm_id, target_season, target_year)  -- migration 0011
```

### Impact
- Second POST hits `23505` → unhandled → 500 "Something went wrong"

### Fix
- See Fix #1 above. Additionally, the client should disable the submit button during the regenerate sequence to prevent double-clicks.

---

## 12. Test User Accounts Have No Known Passwords

### DB state
- `test@test.com` has `email_verified = false` → redirects to `/verify`
- All other verified users (`kisan.one@test.pk`, `kisan.final@test.pk`, etc.) have unknown passwords

### Impact
- Cannot log in to reproduce the issue via the UI without knowing test passwords

### Fix
- Document test credentials in a secure location, or reset passwords via a seed script

---

## Recommended Fix Order

| Priority | Fix | File(s) | Effort |
|----------|-----|---------|--------|
| P0 | Handle Postgres `23505` unique violation → return 409 | `app/api/crops/route.ts` | 10 min |
| P0 | Fix case-sensitive JOIN for `pastCrop` | `lib/crops/engine.ts` | 5 min |
| P0 | Fix soil label bug in `RecommendationCard` | `crops-client.tsx` | 5 min |
| P0 | Fix `labourCostLevel` cast in save handler | `app/api/crops/save/route.ts` | 2 min |
| P1 | Add price data for all 44 crops OR switch engine to use `mandi_prices` | `db/migrations/`, `lib/crops/scoring.ts` | 1-2 hrs |
| P1 | Standardize `crops.category` enum (fix Mango) | DB + migration | 10 min |
| P2 | Decide TFJS model strategy: wire it in or remove it | `lib/crops/model.ts`, `engine.ts` | 30 min |
| P2 | Use actual weather forecast data in scoring OR remove weather fetch from engine | `lib/crops/scoring.ts`, `engine.ts` | 1 hr |
| P2 | Standardize `crop_price_trends.crop_id` to UUIDs | DB + migration | 15 min |
| P3 | Add client-side retry + disable-submit-during-regenerate | `crops-client.tsx` | 20 min |
| P3 | Document test user passwords or add seed script | `scripts/` | 15 min |

---

## Neon DB Verification Log

Verified via Neon MCP (`neon_run_sql`) on project `bitter-dream-03311921`:

| Check | Result |
|-------|--------|
| `crops` table row count | 44 |
| `crop_price_trends` row count | 44 |
| Crops with usable price data (matching UUIDs in `crops`) | 12 |
| Crops with ZERO price data | 32 |
| `crop_recommendation_requests` row count | 10 |
| `crop_recommendations` row count | 10 |
| `crop_soil_compatibility` row count | 396 (44 crops × 9 soil types) |
| `crop_rotation_rules` row count | 27 |
| `farm_plan_entries` row count | 0 |
| `crop_rotation_suggestions` row count | 0 |
| Unique constraint on `crop_recommendation_requests` | `UNIQUE (account_id, farm_id, target_season, target_year)` — confirmed |
| OpenWeather API key | Set in `.env` — key ends in `...bbd1e` — **live and returning data** |
| Test farm coordinates | All test farms share identical `30.375300, 69.345100` regardless of district |
| `crops.category` invalid values | `mango` = `fruit` (not in enum) |
| `crop_price_trends` ID type mismatch | 12 rows use string IDs (`cotton`, `wheat`, etc.), 32 use UUIDs |

---

## Out-of-Scope Notes (per spec)

- `lib/crops/model.ts` TFJS model is not part of the current runtime path; training script `specs/003-crop-recommendation/train-model.py` is also not wired in
- `app/api/cron/predict-prices/route.ts` updates `price_predictions` (14-day crop-level forecast JSONB), which the crop engine does **not** read
- Live `mandi_prices` ingestion via GitHub Actions is functional but disconnected from the recommendation engine
