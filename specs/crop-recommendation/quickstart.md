# Quickstart: Crop Recommendation Engine

**Feature**: 003-crop-recommendation
**Audience**: Developer picking up this feature for the first time.

## Prerequisites

- Node.js (version in `.nvmrc`), Postgres (Neon Lakebase), environment variables from `.env.example`.
- `lib/db.ts` working; `npm run db:push` applies migrations cleanly.
- A farmer account with at least one farm record in the `farms` table.
- (Optional but recommended) OpenWeatherMap API key in env — same one used by `001-weather-advisory`.

## 1. Apply the migration

```bash
npm run db:push
# or run directly:
# psql $DATABASE_URL -f db/migrations/0009_crop_recommendation.sql
```

The migration:
- Creates 5 enum types (season, soil_type, budget_bracket, irrigation_type, crop_category).
- Creates 8 tables (crops, crop_soil_compatibility, crop_rotation_rules, soil_profiles, crop_price_trends, crop_recommendation_requests, crop_recommendations, farm_plan_entries, crop_rotation_suggestions).
- Seeds ~12 commercial Pakistani crops, ~15 district soil profiles, and a starter set of rotation rules.
- Is idempotent — safe to re-run.

## 2. Sync the translations

```bash
npm run sync:translations
```

This reads `catalog/*.ts` (including new `app.crops.*` keys) and upserts rows into the `translations` table for all 8 locales. Verify:

```sql
SELECT key, locale FROM translations WHERE key LIKE 'app.crops.%' ORDER BY key, locale;
```

Every key should have 8 rows.

## 3. Run the dev server

```bash
npm run dev
```

## 4. Smoke-test the API (no UI needed)

Pick a farm_id from your local DB (`SELECT id, name FROM farms WHERE account_id = '<your-user-id>' LIMIT 1`).

```bash
# Generate recommendations
curl -X POST http://localhost:3000/api/crops \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{
    "farm_id": "<FARM_ID>",
    "target_season": "winter",
    "target_year": 2026,
    "soil_type": "loamy",
    "irrigation_type": "canal",
    "budget_bracket": "medium"
  }'

# Fetch them
curl -b cookies.txt "http://localhost:3000/api/crops?farm_id=<FARM_ID>"

# Save the top one
curl -X POST http://localhost:3000/api/crops/save \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{ "recommendation_id": "<RANK_1_RECOMMENDATION_ID>" }'
```

## 5. Run the automated tests

```bash
npm test -- --testPathPattern='(crops|crop-recommendation)'
```

Covers:
- Zod schemas (`lib/validation/crops.ts`)
- Scoring engine (`lib/crops/scoring.ts`) — top-3 for 3 reference scenarios matches snapshots
- Route handlers (`app/api/crops/*`) — auth, validation, 409 duplicate, 503 weather missing

## 6. Manual UI acceptance run-through

Per constitution ("UI is verified by manual run-through of acceptance criteria"):

1. Log in as a farmer with at least one farm record.
2. Navigate to `/crops` (the recommendation landing).
3. Confirm farm location is pre-filled; select soil type, irrigation, budget bracket.
4. Submit — verify 3 ranked recommendations appear within 15 seconds.
5. Open comparison view — verify revenue chart renders with real numbers.
6. Save the top recommendation — verify it appears on the farm records page.
7. View rotation suggestions — verify 2–3 seasons of suggestions with plain-language reasons.
8. Resize browser to 320px width — verify no horizontal scroll.
9. Switch to Urdu (RTL) — verify layout mirrors and labels render correctly.

## Tuning the scoring weights

If the top-3 for a reference scenario doesn't match what an agronomist would pick:

1. Edit weights in `lib/crops/scoring.ts` (`w_suitability`, `w_weather`, `w_profit`, `w_risk`, `w_sustain`).
2. Re-run `npm test` — snapshot tests will flag the change; update the snapshot intentionally once founder approves.

Reference scenarios (from `research.md`):
- Wheat-after-cotton in Punjab (winter)
- Rice-after-wheat in Sindh (rainy)
- Maize-after-potato in KP (summer)
- Mixed vegetables in peri-urban (any season)

## Demo-day cheat sheet

For the live demo, use:
- Farmer: the seeded demo account.
- Farm: "Chakwal — 12 acres, loamy soil, canal irrigation".
- Budget bracket: **Medium**.
- Target season: **Winter 2026**.

Expected top recommendation: **Wheat** (with mung bean and chickpea rounding out the top 3). Revenue chart shows wheat winning by a clear margin; rotation suggestions recommend mung bean in summer 2027 (nitrogen-fixing) and chickpea the following winter.
