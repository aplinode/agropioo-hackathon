# Implementation Plan: AI Pest Outbreak Prediction

**Branch**: `09-pest-outbreak-prediction` | **Date**: 2026-09-05 | **Spec**: [spec.md](../spec.md)
**Input**: Feature specification from `/specs/pest-outbreak-prediction/spec.md`

## Summary

Build a pest outbreak prediction feature within the existing Agropioo Next.js app. A daily TypeScript-based cron job scrapes provincial government agriculture websites, runs a rule-based pest risk model per farm using weather forecast + crop + growth stage + district, stores 7-day predictions in Postgres, and triggers in-app + email alerts when risk exceeds 70%. The dashboard shows a pest risk widget; a dedicated `/pest` page shows a 7-day forecast; a history view shows past predictions and alerts.

## Technical Context

- **Language/Version**: TypeScript 5.x / Next.js 14+ (App Router)
- **Primary Dependencies**: Next.js Route Handlers, Neon Lakebase Postgres (`pg`), Zod, React Hook Form, Nodemailer + SMTP, existing LLM provider
- **Storage**: Neon Lakebase Postgres (schema migration `0015_pest_outbreak_prediction.sql`)
- **Testing**: Zod schemas + route-handler tests; UI verified by manual run-through
- **Target Platform**: Web application (outdoor-mobile first, light mode)
- **Constraints**: TypeScript strict mode; no `any`, `!`, `@ts-ignore`; Route Handlers only; shared `lib/db.ts`; no new libraries without approval; UI strings must have translations for all 8 locales
- **Scale/Scope**: Hackathon demo; daily cron; 7-day forecast horizon; predictions pruned after 1 year

## Key Decisions

- **Model runtime**: TypeScript rule-based model executed in a Next.js cron route handler (no Python runtime).
- **LLM provider**: Reuse the existing LLM provider already configured for advisor/detect features.
- **Data scraping**: Direct scraping from provincial government sites in the cron job, with cached rows persisted in Postgres and a "data may be outdated" notice on scrape failure.
- **Alert integration**: New `pest_alerts` table for pest-specific alert data; also insert rows into the generic `notifications` table so the in-app notification center shows pest alerts alongside weather and other alerts.
- **Cold-start behavior**: Use generic provincial models when district-level historical data is insufficient.
- **Alert deduplication**: No duplicate alerts for the same pest type on the same farm within a 6-hour window, except escalation alerts when risk continues to rise within that window.
- **History retention**: Store all predictions and alerts; prune records older than 1 year via a scheduled cleanup job.

## Project Structure

```text
specs/pest-outbreak-prediction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── route-handlers.md
└── tasks.md             # Phase 2 output

app/
├── (farmer)/(dashboard)/
│   ├── pest/
│   │   ├── page.tsx           # Main 7-day pest risk forecast page
│   │   └── history/
│   │       ├── page.tsx       # Alert/prediction history list
│   │       └── [id]/page.tsx  # History detail view
│   └── ...
├── api/
│   ├── pest/
│   │   ├── forecast/route.ts  # Fetch 7-day pest risk for a farm
│   │   ├── alerts/route.ts    # List pest alerts for current farmer
│   │   ├── alerts/[id]/read/route.ts
│   │   └── growth-stage/route.ts # Update crop growth stage
│   └── cron/
│       └── pest-prediction/route.ts # Daily cron: scrape + predict + alert
components/
├── pest/
│   ├── PestRiskWidget.tsx     # Dashboard widget (warning/critical counts + top farm)
│   ├── PestForecastChart.tsx  # 7-day risk chart per farm
│   ├── PestAlertCard.tsx      # Alert detail with chemical + organic recommendations
│   ├── PestHistoryList.tsx    # History list with filters
│   └── GrowthStageEditor.tsx  # Update crop growth stage per farm
lib/
├── pest/
│   ├── scraper.ts             # Scrape provincial gov sites + cache in pest_incidence_records
│   ├── model.ts               # TypeScript rule-based pest risk model
│   ├── recommendations.ts     # Curated treatment DB + PKR price refresh + LLM personalization
│   └── alerts.ts              # Alert rule engine, dedupe, escalation, email + notification insert
├── i18n/
│   └── server.ts              # Add getPestBundle()
catalog/
├── en.ts                      # Add app.pest.* keys
├── ur.ts, pa.ts, ps.ts, sd.ts, skr.ts, bal.ts, hno.ts # Draft translations
db/migrations/
└── 0015_pest_outbreak_prediction.sql
```

## Data Model

See `specs/pest-outbreak-prediction/data-model.md` for full schema. Summary:

- **`pest_predictions`**: Daily per-farm risk calculation. Columns: `id`, `farm_id`, `account_id`, `prediction_date`, `risk_score`, `predicted_pest`, `confidence`, `model_version`, `weather_snapshot jsonb`, `farm_snapshot jsonb`, `province`, `district`, `created_at`. Unique `(farm_id, prediction_date)`. Index on `(account_id, prediction_date desc)`.
- **`pest_alerts`**: Time-sensitive notification. Columns: `id`, `farm_id`, `account_id`, `pest_type`, `risk_score`, `severity`, `recommendation_text`, `recommendation_key`, `recommendation_translation_key`, `sent_via jsonb`, `sent_at`, `read_at`, `dismissed_at`, `escalation_of_id nullable`, `created_at`. Index on `(farm_id, created_at desc)` and `(account_id, read_at)` where unread.
- **`pest_incidence_records`**: Scraped/cached government data. Columns: `id`, `province`, `district`, `crop`, `pest_type`, `reported_count`, `source_url`, `data_date`, `raw_payload jsonb`, `fetched_at`. Index on `(province, district, crop, data_date)`.
- **`pest_treatments`**: Curated treatment database. Columns: `id`, `pest_type`, `treatment_name`, `type` (`chemical`|`organic`), `base_cost_pkr`, `unit`, `description_key`, `active`, `created_at`, `updated_at`.
- **`pest_price_snapshots`**: Cached PKR prices for treatments. Columns: `id`, `treatment_id`, `price_pkr`, `source`, `fetched_at`.
- **`notifications` insert**: Pest alerts also insert into the existing `notifications` table with `type = 'pest_alert'`, `title` = pest name + risk %, `body` = recommendation summary, `link_url` = `/pest/history/<alert_id>`.

## Route Handler Contracts

See `specs/pest-outbreak-prediction/contracts/route-handlers.md` for full API contracts. Summary:

- **`GET /api/pest/forecast?farm_id=<id>`** — Returns 7-day pest risk forecast for the farm. Falls back to cached `pest_predictions` when weather or pest data is unavailable. Requires session.
- **`GET /api/pest/alerts`** — Lists pest alerts for the current farmer, sorted newest first. Requires session.
- **`POST /api/pest/alerts/<id>/read`** — Marks a pest alert as read. Requires session.
- **`POST /api/pest/growth-stage`** — Updates crop growth stage for a farm. Zod-validated body: `{ farm_id, crop, stage }`. Requires session.
- **`POST /api/cron/pest-prediction`** — Internal cron endpoint. Protected by `PEST_CRON_SECRET` Bearer token. Scrapes gov sites, runs model for all active farms, stores predictions, scans for >70% risk, sends alerts, and inserts into `notifications`. Returns `{ generated, alerted, scraped }`.

## Translation Architecture

Every visible string follows the existing catalog → DB sync pattern under `app.pest.*`:

1. **Authoring**: Add keys to `catalog/en.ts`.
2. **Drafting**: Add partial translations to the other 7 locale catalog files.
3. **Sync**: Run `npm run sync:translations` to upsert into Neon `translations` table.
4. **Runtime**: Add `getPestBundle()` in `lib/i18n/server.ts`; pass as props to client components.
5. **Fallback**: English is always present; DB overlays catalog.

## Cron / Background Job Flow

1. **Trigger**: GitHub Actions daily cron or manual `POST /api/cron/pest-prediction` with `Authorization: Bearer <PEST_CRON_SECRET>`.
2. **Scrape**: `lib/pest/scraper.ts` fetches Punjab, Sindh, KP, Balochistan gov sites. Parses pest incidence data. Upserts into `pest_incidence_records`. On failure, uses last cached rows and sets `data_may_be_outdated = true`.
3. **Predict**: `lib/pest/model.ts` iterates all active farms. For each farm:
   - Fetches 7-day weather forecast (reuse `lib/weather/openweather.ts`).
   - Determines crop + growth stage + district + province.
   - Runs rule-based risk scoring using weather inputs + historical incidence data (district, fallback to province).
   - If confidence < 60%, marks status as `monitoring` without naming a specific pest.
   - Upserts 7 rows into `pest_predictions`.
4. **Alert scan**: `lib/pest/alerts.ts` checks predictions where `risk_score >= 70`. Deduplicates within 6-hour window per `(farm_id, pest_type)`. Allows escalation if risk increased within window. Generates recommendations via `lib/pest/recommendations.ts` (curated DB + latest PKR prices + LLM personalization). Inserts into `pest_alerts` and `notifications`. Sends email via `nodemailer`.
5. **Cleanup**: A separate monthly cron (`POST /api/cron/pest-cleanup`) deletes `pest_predictions` and `pest_alerts` older than 1 year.

## UI Structure

- **Dashboard widget** (`components/pest/PestRiskWidget.tsx`): Shows count of farms at warning/critical risk, plus highest-risk farm and pest type. Top 3 only if many farms. Server-fetched data passed as props.
- **`/pest` page** (`app/(farmer)/(dashboard)/pest/page.tsx`): Farm selector at top. 7-day forecast chart with daily probability, pest name, and action recommendation per farm. Client-side farm switching. Empty state when no farms or no prediction available.
- **History page** (`app/(farmer)/(dashboard)/pest/history/page.tsx`): List of past predictions and alerts sorted by date. Filters by farm, risk level, type. Detail view opens in modal.
- **Growth stage editor** (`components/pest/GrowthStageEditor.tsx`): Inline editor on farm detail or pest page to update crop stage. Triggers on-demand prediction recalculation via `POST /api/pest/growth-stage`.

## Edge Cases & Rules

- **Weather data missing**: Show "data unavailable" with last cached prediction. Do not generate new predictions until weather returns.
- **No pest data for crop/district**: Show "no prediction available" for that farm on affected days.
- **Multiple farms**: Generate separate predictions per farm.
- **Crop stage not set**: Use default vulnerability based on crop type only.
- **Model confidence < 60%**: Display "monitoring" status instead of naming a specific pest.
- **Alert deduplication**: No repeat alerts for same pest type on same farm within 6-hour window; escalation alerts allowed if risk rises.
- **Scraping failure**: Use last cached data and show "data may be outdated" notice.
- **High volume of farms**: Dashboard widget shows top 3 highest-risk farms.
- **History retention**: Prune records older than 1 year.

## Constitution Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Farmer-First | PASS | Spec leads with farmer actions; plain-language recommendations; no external lookup required. |
| II. Pakistan-First | PASS | Localized government sources; 8-locale translation requirement; RTL support via existing i18n. |
| III. Spec-Driven | PASS | Plan follows spec; no code before planning; clarifications incorporated. |
| IV. Stack Discipline | PASS | Next.js + Neon + approved libs; shared `lib/db.ts`; schema via migrations; no new dependencies. |
| V. Security | PASS | Zod validation, JWT httpOnly cookies, secrets in env, uniform error shape, cron protected by bearer secret. |
| VI. Accessibility | PASS | Outdoor-mobile targets enforced; ≥44px touch, 4.5:1 contrast, no horizontal scroll at 320px. |

**Gate Result**: PASS — no violations.

## Migration

`db/migrations/0015_pest_outbreak_prediction.sql` creates:
- `pest_predictions`
- `pest_alerts`
- `pest_incidence_records`
- `pest_treatments`
- `pest_price_snapshots`
- Indexes for query patterns above
- Backfill `pest_treatments` with initial seed data

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Gov sites change HTML structure | Selector-based scrapers with drift detection; cache raw payload; alert on parse failure. |
| Scraping blocked/slow | Timeout per request; fallback to last cached `pest_incidence_records`; mark outdated. |
| LLM cost/latency for recommendations | Cache recommendations per pest type; refresh prices on a slower cadence (weekly). |
| Cron duration exceeds window | Process farms in batches; idempotent upserts allow safe retries. |
| Notification center performance | `notifications` insert is a single lightweight row per alert; indexed by `account_id`. |

## Validation Plan

1. `npm run lint` passes.
2. `npm run build` passes.
3. Endpoint verification: Hit every API endpoint manually or via automated tests. Confirm expected status, response shape, and error behavior for each route.
4. Error coverage: Exercise 4xx and 5xx paths for every route handler. Confirm uniform error shape `{ error: { code, message } }` and correct HTTP status codes.
5. End-to-end smoke test: Run through the full user journey â€” dashboard -> `/pest` page -> history -> growth stage update -> alert receipt. Confirm no console errors and correct UI states.
6. Database verification via Neon MCP: Inspect Postgres during implementation. Verify migrations apply cleanly, indexes exist, and rows are inserted/updated correctly in `pest_predictions`, `pest_alerts`, `pest_incidence_records`, `pest_treatments`, and `notifications`. Confirm no constraint violations or silent failures.
7. Data integrity checks: During cron execution, validate scraped data parsing, prediction storage for all active farms, alert firing only when `risk_score >= 70`, and accurate email/in-app delivery channel population.
8. Research-first: Before implementing scrapers, model rules, or LLM prompts, research target government sites, existing weather/price scrapers in this repo, and the configured LLM provider. Use only verified sources and established patterns.
9. Translation coverage: Verify every visible string resolves through `app.pest.*` keys and that all 8 locales have non-empty translations in the database.
