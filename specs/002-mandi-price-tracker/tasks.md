# Tasks: Mandi Price Tracker & Predictor

**Input**: Design documents from `/specs/002-mandi-price-tracker/`
**Prerequisites**: [plan.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/plan.md) (required), [spec.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/spec.md) (required), [research.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/research.md), [data-model.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/data-model.md), [contracts/api-contracts.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/contracts/api-contracts.md), [quickstart.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/quickstart.md)

**Tests**: Unit tests for Zod schemas & Route Handlers via Vitest (`npx vitest run`); manual acceptance verification for UI.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Includes exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic file structure

- [X] T001 Create directory structure for Mandi Price Tracker components in `components/prices/` and route handlers in `app/api/prices/`
- [X] T002 [P] Create statistical forecasting module placeholder in `lib/prices/forecast.ts`
- [X] T003 [P] Create district proximity and topology helper module in `lib/prices/proximity.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, seeds, and shared helpers that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define Neon Lakebase Postgres database migration schema for `crops`, `mandis`, `mandi_prices`, `price_predictions`, `price_alerts`, and `user_crop_preferences` tables in `scripts/seed-mandi-prices.ts`
- [X] T005 Seed initial Pakistan crops (with 8-locale names) and major district mandis into Postgres using `scripts/seed-mandi-prices.ts`
- [X] T006 [P] Implement district proximity and bordering district lookup logic in `lib/prices/proximity.ts`
- [X] T007 Populate 8-locale translation keys for Mandi Price Tracker into Neon `translations` database table using `scripts/sync-translations.mts`

**Checkpoint**: Database schema & foundational data ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Current Market Prices (Priority: P1) 🎯 MVP

**Goal**: A logged-in farmer opens the price tracker to see current crop prices for markets near their registered farm location without manual selection, with fallback for missing dates.

**Independent Test**: Open `/prices`, select a crop, and verify prices load automatically for the farmer's registered district + bordering districts with clear missing data indicators if data is delayed.

### Implementation for User Story 1

- [X] T008 [P] [US1] Define Zod query validation schema `getPricesQuerySchema` for current market prices in `app/api/prices/route.ts`
- [X] T009 [US1] Implement `GET /api/prices` Route Handler to fetch current market prices filtered by farmer district + bordering districts in `app/api/prices/route.ts`
- [X] T010 [P] [US1] Build price card component `components/prices/mandi-price-card.tsx` displaying prevailing modal price, min/max price per Maund, daily change % and PKR diff
- [X] T011 [US1] Build Mandi Price Tracker main page `app/(farmer)/prices/page.tsx` auto-loading prices from farmer location with fallback provincial hub banner
- [X] T012 [US1] Implement manual price entry and holiday management admin panel in `app/(farmer)/prices/admin/page.tsx`

**Checkpoint**: User Story 1 (MVP) complete and independently testable at `/prices`

---

## Phase 4: User Story 2 - Compare Prices Across Markets (Priority: P2)

**Goal**: A farmer compares prices for a crop side-by-side across multiple nearby markets, sorted by price with the best price highlighted and approximate transport distance in km shown.

**Independent Test**: Select a crop and view the market comparison table. Verify highest price is highlighted and distance in km from farm is displayed for each market.

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement side-by-side market comparison table `components/prices/market-comparison-table.tsx` with price sorting and best price badge
- [X] T014 [US2] Integrate distance calculation (km from farm location to mandi) in `components/prices/market-comparison-table.tsx`
- [X] T015 [US2] Connect crop selector to update comparison view dynamically without full page reload in `app/(farmer)/prices/page.tsx`

**Checkpoint**: User Story 2 complete - market price comparisons functioning independently

---

## Phase 5: User Story 3 - See Price Trend Predictions (Priority: P2)

**Goal**: A farmer views 14-day daily predicted price points with upper and lower 95% confidence bands on a visual chart to plan selling timing.

**Independent Test**: Open prediction view for a crop and verify 14 discrete forecast points are rendered with a shaded upper/lower confidence band area.

### Implementation for User Story 3

- [X] T016 [P] [US3] Implement Holt-Winters triple exponential smoothing and linear trend time-series forecasting algorithm in `lib/prices/forecast.ts`
- [X] T017 [US3] Implement `GET /api/prices/predictions` Route Handler returning 14-day daily forecast points and 95% confidence bounds in `app/api/prices/predictions/route.ts`
- [X] T018 [P] [US3] Create 14-day discrete prediction chart component `components/prices/prediction-chart.tsx` with upper/lower confidence band shading
- [X] T019 [US3] Integrate prediction chart and confidence warning badge into `app/(farmer)/prices/page.tsx`

**Checkpoint**: User Story 3 complete - 14-day price trend predictions working independently

---

## Phase 6: User Story 4 - Receive Sell/Hold Recommendation (Priority: P2)

**Goal**: A farmer gets a clear, plain-language Sell or Hold recommendation based on current prices and 14-day predicted trends, accompanied by a "High Volatility / Low Data" warning when confidence is low.

**Independent Test**: View a crop page and verify a prominent Sell or Hold badge appears with plain-language explanation text, or a high volatility warning when historical data is limited.

### Implementation for User Story 4

- [X] T020 [P] [US4] Implement sell/hold recommendation decision logic and plain-language reasoning generator in `lib/prices/forecast.ts`
- [X] T021 [P] [US4] Create recommendation badge component `components/prices/recommendation-badge.tsx` with "High Volatility / Low Data" warning badge support
- [X] T022 [US4] Embed recommendation badge and reasoning card into `app/(farmer)/prices/page.tsx`

**Checkpoint**: User Story 4 complete - sell/hold recommendations displaying independently

---

## Phase 7: User Story 5 - Set Price Alerts & Notifications (Priority: P3)

**Goal**: A farmer sets a target price for a crop (e.g. wheat >= PKR 4,500/Maund) and receives pinned green in-app notifications and email alerts with direct deep links (`/prices?crop=X&mandi=Y`) when market price reaches or exceeds target.

**Independent Test**: Create a sell target price alert, trigger price ingestion, and verify an in-app notification appears pinned at top of feed and an email alert is sent via `nodemailer`.

### Implementation for User Story 5

- [X] T023 [P] [US5] Implement Zod validation schemas for alert creation and updates in `app/api/prices/alerts/route.ts`
- [X] T024 [US5] Implement `GET`, `POST`, `PUT`, `DELETE` Route Handlers for farmer price alerts in `app/api/prices/alerts/route.ts`
- [X] T025 [P] [US5] Create target price alert setup and edit modal `components/prices/price-alert-modal.tsx` supporting in-place editing and active/paused toggles
- [X] T026 [US5] Implement sell-only alert evaluation and `nodemailer` (SMTP) email dispatcher with deep-link button in `lib/prices/alerts.ts`
- [X] T027 [US5] Implement daily price ingestion and alert evaluation Route Handler `POST /api/prices/ingest` in `app/api/prices/ingest/route.ts`

**Checkpoint**: User Story 5 complete - target price alerts and notifications functional

---

## Phase 8: User Story 6 - View Price History (Priority: P3)

**Goal**: A farmer reviews historical price trends for a crop with defaulting 3-month view and date range selectors (1M, 3M, 6M, 12M).

**Independent Test**: Select a crop, open price history chart, and toggle between 1M, 3M, 6M, and 12M views. Verify daily modal prices render correctly.

### Implementation for User Story 6

- [X] T028 [P] [US6] Implement `GET /api/prices/history` Route Handler accepting date range parameters (`1M`, `3M`, `6M`, `12M`) in `app/api/prices/history/route.ts`
- [X] T029 [P] [US6] Create interactive price history chart component `components/prices/price-history-chart.tsx` with date range selector toggles
- [X] T030 [US6] Integrate price history chart into `app/(farmer)/prices/page.tsx`

**Checkpoint**: User Story 6 complete - price history charts functional

---

## Phase 9: Global Features & Integration

**Purpose**: Cross-cutting features including dashboard summary widget, Pakistan-wide mandi search, offline localstorage caching, and free GitHub Actions cron workflow.

- [X] T031 [P] Create Pakistan-wide global crop and mandi search bar component `components/prices/global-mandi-search.tsx`
- [X] T032 [P] Create dashboard summary widget `components/prices/dashboard-prices-widget.tsx` rendering top 3 tracked crops with 7-day mini-sparklines
- [X] T033 Integrate summary widget into main farmer dashboard in `app/(farmer)/(dashboard)/dashboard/page.tsx`
- [X] T034 [P] Create offline price list and history caching hook `hooks/use-offline-prices.ts` storing data in browser `localStorage`
- [X] T035 Create scheduled nightly prediction background cron Route Handler `POST /api/cron/predict-prices` in `app/api/cron/predict-prices/route.ts`
- [ ] T036 Create free GitHub Actions scheduled workflow configuration `.github/workflows/mandi-cron.yml` triggering daily price ingestion and predictions

---

## Phase 10: Polish & Quality Gates

**Purpose**: 8-locale Neon translation database population, Vitest automated testing, and release gate verification

- [ ] T037 Sync all Mandi Price Tracker UI string keys and translations across all 8 Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) into Neon `translations` database table using `scripts/sync-translations.mts`
- [X] T038 [P] Create Zod schema and Route Handler unit tests in `app/api/prices/prices-api.test.ts`
- [X] T039 [P] Create statistical forecasting unit tests in `lib/prices/forecast.test.ts`
- [X] T040 Run `npx vitest run` to verify all automated test suites pass
- [ ] T041 Run `npm run lint` and `npm run build` to confirm zero TypeScript compilation or linting errors
- [ ] T042 Verify all 36 items in `specs/002-mandi-price-tracker/checklists/quality-gate.md` pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3–8)**: All depend on Foundational completion.
  - **User Story 1 (P1)**: Starts immediately after Phase 2 (MVP).
  - **User Story 2 (P2)**: Depends on Phase 2; uses US1 price components.
  - **User Story 3 (P2)**: Depends on Phase 2; uses prediction logic.
  - **User Story 4 (P2)**: Depends on US3 forecasting engine.
  - **User Story 5 (P3)**: Depends on Phase 2; evaluates alerts against prices.
  - **User Story 6 (P3)**: Depends on Phase 2; fetches historical prices.
- **Global Integration (Phase 9)**: Depends on US1, US3, US5 handlers.
- **Polish & Quality Gates (Phase 10)**: Final phase after all stories are built.

---

## Parallel Execution Opportunities

- **Foundational**: T006 (Proximity) and T007 (Translations) can run in parallel.
- **User Story 1**: T008 (Schema) and T010 (Price Card) can run in parallel.
- **User Story 2 & 3**: US2 (Comparison Table) and US3 (Holt-Winters Engine) can run in parallel.
- **User Story 5 & 6**: US5 (Alert Modal) and US6 (History Chart) can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) & Phase 2 (Foundational DB + Seeds + 8-Locale Translations).
2. Build Phase 3 (User Story 1 - View Current Market Prices).
3. **Validate MVP**: Test `/prices` independently for district prices and fallback provincial hub.

### Incremental Delivery
1. Add User Story 2 (Market Comparison) + User Story 3 (14-day Trend Predictions).
2. Add User Story 4 (Sell/Hold Recommendations) + User Story 5 (Target Price Alerts).
3. Add User Story 6 (Price History) + Global Features (Dashboard Widget, Offline Caching, GitHub Actions Cron).
4. Run 8-locale Neon translation sync and quality gate checklist.
