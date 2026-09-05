# Tasks: AI Pest Outbreak Prediction

**Branch**: `09-pest-outbreak-prediction` | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## Phase 1 — Foundation & Research

- [ ] T001 Research provincial government agriculture websites (Punjab, Sindh, KP, Balochistan) to understand HTML structure and available pest incidence data fields. Document selectors and fallback strategies.
- [ ] T002 Research existing scraper patterns in `scripts/scrape-prices/` and `lib/prices/scrapers/` for reuse opportunities.
- [ ] T003 Research existing LLM provider configuration used by advisor/detect features to confirm reuse approach for recommendation personalization.
- [ ] T004 Create migration `db/migrations/0015_pest_outbreak_prediction.sql` with tables: `pest_predictions`, `pest_alerts`, `pest_incidence_records`, `pest_treatments`, `pest_price_snapshots`, indexes, and seed data.
- [ ] T005 Apply migration via Neon MCP or local migration runner. Verify tables and indexes exist in the database.

## Phase 2 — Backend: Scraping & Model

- [ ] T006 Implement `lib/pest/scraper.ts` to scrape provincial gov sites and upsert into `pest_incidence_records`. Add timeout, retry, and stale-cache fallback.
- [ ] T007 Implement `lib/pest/model.ts` rule-based risk scoring using weather forecast, crop type, growth stage, district, and historical incidence data. Handle cold-start provincial fallback and <60% confidence monitoring state.
- [ ] T008 Implement `lib/pest/recommendations.ts` with curated treatment DB lookup, PKR price snapshot caching, and LLM personalization using the existing provider.
- [ ] T009 Implement `lib/pest/alerts.ts` for deduplication, escalation detection, email sending via nodemailer, and insert into `pest_alerts` + `notifications`.
- [ ] T010 Implement `POST /api/cron/pest-prediction` protected by `PEST_CRON_SECRET`. Wire scrape -> predict -> alert pipeline. Return `{ generated, alerted, scraped }`.

## Phase 3 — Backend: API Routes

- [ ] T011 Implement `GET /api/pest/forecast?farm_id=<id>` with Zod validation. Return 7-day forecast or cached fallback.
- [ ] T012 Implement `GET /api/pest/alerts` listing current farmer's pest alerts.
- [ ] T013 Implement `POST /api/pest/alerts/<id>/read` to mark alerts as read.
- [ ] T014 Implement `POST /api/pest/growth-stage` with Zod validation `{ farm_id, crop, stage }`. Trigger on-demand recalculation.
- [ ] T015 Verify every API endpoint returns correct status codes, uniform error shape, and expected response bodies.

## Phase 4 — Frontend: Components & Pages

- [ ] T016 Add `app.pest.*` translation keys to `catalog/en.ts` and draft translations in all 7 other locale catalogs.
- [ ] T017 Implement `lib/i18n/server.ts` `getPestBundle()` for server-side string resolution.
- [ ] T018 Build `components/pest/PestRiskWidget.tsx` for dashboard: warning/critical counts + highest-risk farm + pest type.
- [ ] T019 Build `app/(farmer)/(dashboard)/pest/page.tsx` with farm selector and 7-day forecast chart using client components.
- [ ] T020 Build `app/(farmer)/(dashboard)/pest/history/page.tsx` with filters and history list.
- [ ] T021 Build `app/(farmer)/(dashboard)/pest/history/[id]/page.tsx` detail view.
- [ ] T022 Build `components/pest/GrowthStageEditor.tsx` for inline crop stage updates.
- [ ] T023 Integrate pest widget into dashboard and wire navigation.

## Phase 5 — Verification & Quality Gates

- [ ] T024 Run `npm run lint` and `npm run build`; fix any errors.
- [ ] T025 Endpoint verification: Hit every pest API endpoint. Confirm expected status, shape, and error behavior.
- [ ] T026 Error coverage: Exercise 4xx/5xx paths for every route handler. Confirm uniform error shape `{ error: { code, message } }`.
- [ ] T027 End-to-end smoke test: dashboard -> `/pest` -> history -> growth stage update -> alert receipt. Confirm no console errors and correct UI states.
- [ ] T028 Database verification via Neon MCP: Inspect `pest_predictions`, `pest_alerts`, `pest_incidence_records`, `pest_treatments`, `notifications`. Verify migrations, indexes, inserts, updates, and constraints.
- [ ] T029 Cron execution test: Trigger `POST /api/cron/pest-prediction` manually. Validate scraped data parsing, prediction storage for all active farms, alert firing only when `risk_score >= 70`, and accurate delivery channels.
- [ ] T030 Translation coverage audit: Verify all `app.pest.*` keys resolve and all 8 locales have non-empty translations in the database.

## Phase 6 — Documentation & Cleanup

- [ ] T031 Add verification and quality gate notes to `spec.md` and `plan.md`.
- [ ] T032 Create `task.md` with phase breakdown and verification steps.
- [ ] T033 Commit and push branch with atomic commits per phase.
