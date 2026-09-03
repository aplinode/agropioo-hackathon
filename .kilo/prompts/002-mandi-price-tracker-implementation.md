# Implementation Prompt: Mandi Price Tracker & Predictor (Feature #002)

You are implementing **Feature #002: Mandi Price Tracker & Predictor** for the Agropioo platform. Read the spec and plan thoroughly before writing any code. Do not skip steps.

## Required Reading (in order)

1. `specs/mandi-price-tracker/spec.md` — full feature specification with FRs, edge cases, UI requirements, and acceptance criteria
2. `specs/mandi-price-tracker/plan.md` — implementation architecture, file layout, and key decisions
3. `specs/mandi-price-tracker/tasks.md` — task breakdown and acceptance checklist
4. `specs/mandi-price-tracker/research.md` — scraper research and technical decisions
5. `specs/mandi-price-tracker/data-model.md` — database schema details
6. `specs/mandi-price-tracker/contracts/api-contracts.md` — API contracts and Zod schemas

Also read these existing files to match the project's exact patterns:
- `lib/db.ts` — Neon Lakebase Postgres client
- `lib/http.ts` — uniform error shape helpers
- `lib/prices/forecast.ts` — existing Holt-Winters forecasting engine
- `lib/prices/proximity.ts` — district proximity calculations
- `lib/prices/alerts.ts` — existing alert evaluation logic
- `app/api/prices/route.ts` — existing prices read path
- `app/api/prices/alerts/route.ts` — existing alerts CRUD
- `app/api/prices/predictions/route.ts` — existing predictions route
- `app/api/prices/health/route.ts` — existing health endpoint
- `app/(farmer)/prices/page.tsx` — existing price tracker page
- `app/(farmer)/dashboard/page.tsx` — existing dashboard
- `components/prices/mandi-price-card.tsx` — existing price card component
- `scripts/seed-mandi-prices.ts` — existing seed script pattern
- `scripts/sync-translations.mts` — translation sync script pattern
- `db/migrations/0008_mandi_prices.sql` — migration style

---

## Pre-Implementation Verification Checklist (MANDATORY)

Before writing any code, verify the following:

### 1. Environment & Connectivity
- [ ] `.env` file exists with `DATABASE_URL` set
- [ ] Neon Lakebase Postgres is reachable: run `npm run db:check` or use Neon MCP `neon_get_database_tables` to confirm connection
- [ ] All required env vars are documented in `.env.example`: `DATABASE_URL`, `PRICES_CRON_SECRET`, `NODEMAILER_HOST`, `NODEMAILER_PORT`, `NODEMAILER_USER`, `NODEMAILER_PASS`, `CRON_SECRET`

### 2. Database State Verification
- [ ] Run `npm run db:migrate` or apply migrations manually; confirm `db/migrations/0010_scraper_audit_and_holidays.sql` has been applied
- [ ] Verify `mandi_prices` table has columns: `id`, `mandi_id`, `crop_id`, `date`, `modal_price`, `min_price`, `max_price`, `unit`, `is_holiday`, `source`, `source_code`, `created_at`
- [ ] Verify `mandi_prices` has UNIQUE constraint on `(mandi_id, crop_id, date, source_code)`
- [ ] Verify `scraper_runs` table exists with columns: `id`, `received_at`, `source_code`, `status`, `rows_written`, `rows_rejected`, `caller_ip`, `request_id`
- [ ] Verify `mandi_holidays` table exists with columns: `id`, `mandi_id`, `province`, `date`, `label`, `source_code`
- [ ] Verify `price_predictions` table exists
- [ ] Verify `price_alerts` table exists
- [ ] Verify `user_crop_preferences` table exists
- [ ] Verify `crops` table has at least 10 major Pakistani crops seeded
- [ ] Verify `mandis` table has markets across all provinces
- [ ] Run a test query: `SELECT COUNT(*) FROM mandi_prices WHERE source_code = 'seed_pk_initial'` — should return seed data count
- [ ] Run a test query: `SELECT COUNT(*) FROM mandi_holidays` — should return seeded holidays

### 3. Dependencies Verification
- [ ] Run `npm install` — confirm no missing packages
- [ ] Verify `playwright` and `xlsx` are in `devDependencies` (scraper-only, not runtime app deps)
- [ ] Verify `npm run scrape:prices` script exists in package.json
- [ ] Verify `npm run sync:translations` script exists
- [ ] Run `npx playwright install --with-deps chromium` to pre-cache browsers (optional but recommended)

### 4. Code State Verification
- [ ] Confirm `app/api/prices/ingest/route.ts` exists with bearer auth, rate limit, and audit row logic
- [ ] Confirm `app/api/prices/health/route.ts` exists
- [ ] Confirm `lib/prices/forecast.ts` has `canForecast` helper (if T032 done)
- [ ] Confirm `lib/prices/transport.ts` exists with flat per-km rate constant
- [ ] Confirm no merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) exist in any tracked files

### 5. GitHub / Remote State
- [ ] Confirm current branch is `feat/002-scraper` or `main` as appropriate
- [ ] Confirm `git pull --rebase` shows no unpushed commits
- [ ] Confirm `.github/workflows/mandi-cron.yml` exists with Playwright cache setup

---

## Implementation Steps (strict order)

### Phase 3: Scraper Runner (US-S1)

**Goal**: Complete the Playwright scraper runner that POSTs to `/api/prices/ingest`.

1. **T023**: Create `scripts/scrape-prices/index.ts` — the runner entry point:
   - Load env vars (`PRICES_CRON_SECRET`, `DATABASE_URL`)
   - Instantiate a single Playwright browser
   - Call each `sources/*.ts` in its own try/catch (one failure cannot block others)
   - Run `holiday-check` and `drift-detector` per source
   - Post each batch via `post.ts`
   - Exit 0 if any source wrote rows, exit 1 if zero rows across all sources
   - Never import Next.js app code

**Checkpoint**: `npm run scrape:prices` runs without crashing and POSTs to a local dev server.

---

### Phase 4: Workflow Automation (US-S2)

**Goal**: GitHub Actions cron runs the scraper daily with proper secret management.

2. **T026**: Add `PRICES_CRON_SECRET` documentation in `docs/runbook.md` (or create `docs/cron-secrets.md`):
   - Document how to set the secret in GitHub repo settings
   - Document rotation instructions
   - Document what happens on secret mismatch (401, workflow failure)

**Checkpoint**: A maintainer can set up the cron secret following the docs.

---

### Phase 5: User Story 1 — View Current Market Prices (Priority: P1) 🎯 MVP

**Goal**: Farmers see scraper-sourced prices with source badges.

3. **T027**: Add Vitest contract test for `app/api/prices/route.ts`:
   - Confirm `mandi_prices` query returns `source_code` field per row
   - Test with a mock DB row containing `source_code = 'amis_pk'`
   - Skip if already passing

4. **T028**: Create `components/prices/data-source-badge.tsx`:
   - Server component mapping `source_code` → localized label
   - Labels: `amis_pk` → "Punjab AMIS", `samis_pk` → "Sindh SAMIS", `fmis_kp` → "KP FMIS", `bmis_balochistan` → "Balochistan BMIS", `pbs_spi` → "PBS SPI", `seed_pk_initial` → "Seed"
   - Use existing `--color-agro-*` token
   - ≥44×44px tap target, visible focus ring
   - Accessible aria-label

5. **T029**: Add translation keys for `data_source_badge`:
   - Add keys for all 8 locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`)
   - Run `npm run sync:translations` to insert into Neon `translations` table

6. **T030**: Wire `data-source-badge` into `components/prices/mandi-price-card.tsx`:
   - Import and render the badge on each price card
   - Pass `source_code` from the price row

7. **T031**: Manual verification of US1 acceptance scenarios:
   - Open `/prices` with scraper-populated data
   - Confirm prices load for farmer's district + bordering districts
   - Confirm at least one card shows the `data-source-badge` chip
   - Confirm a `mandi_holidays` row causes "Mandi Closed" badge
   - Capture before/after screenshots in `specs/002-mandi-price-tracker/checklists/us1-acceptance.md`

**Checkpoint**: User Story 1 demonstrably ships scraper-sourced data to farmers.

---

### Phase 6: User Story 3 & 7 — Price Predictions & History (Priority: P2/P3)

**Goal**: Predictions self-defer on thin data; history chart supports 1M/3M/6M/12M.

8. **T032**: Extend `lib/prices/forecast.ts` with `canForecast(cropId, mandiId)`:
   - Returns `{ ok: boolean, reason: 'insufficient_rows' | 'stale_data' | 'ok', rowCount, lastDate }`
   - `ok` requires: rowCount >= 3 AND lastDate within last 7 days

9. **T033**: Wire `canForecast` into prediction route and chart:
   - In `app/api/prices/predictions/route.ts`, call `canForecast` before running Holt-Winters
   - In the prediction chart component, render "Not enough data" state when `ok=false`

10. **T034**: Manual verification of US3 acceptance #3 + #4:
    - Test with a crop having only 2 historical rows → "Not enough data" state
    - Test with 3+ rows where most recent is 6 days old → forecast renders
    - Record in `specs/002-mandi-price-tracker/checklists/us3-acceptance.md`

11. **T035**: Implement `GET /api/prices/history` Route Handler:
    - Accept `crop_id` (required), `mandi_id` (optional), `range` (enum: `1M`, `3M`, `6M`, `12M`, default `3M`)
    - Validate with Zod
    - Query `mandi_prices` for the date range
    - Return `{ crop_id, range, history: [{ date, modal_price, min_price, max_price }] }`

12. **T036**: Create `components/prices/price-history-chart.tsx`:
    - Interactive chart with date range selector toggles (1M, 3M, 6M, 12M)
    - Use custom SVG following existing chart patterns (no Recharts)
    - Handle data gaps gracefully

13. **T037**: Integrate price history chart into `app/(farmer)/prices/page.tsx`:
    - Add the chart component below the current prices section
    - Wire the range selector to the API

**Checkpoint**: Predictions correctly self-defer on thin data; history chart renders across all ranges.

---

### Phase 7: User Story 5 — Price Alerts (Priority: P3)

**Goal**: Confirm alerts fire correctly with scraper-sourced data.

14. **T038**: Extend `lib/prices/alerts.ts`:
    - Add `source_code` field to alert evaluation log entries
    - This is audit-only, not user-facing

15. **T039**: Manual verification of full alert flow:
    - Set target PKR 3,500 for `wheat` at a mandi
    - Force a cron run that ingests a row ≥ 3,500
    - Confirm in-app notification + email + `last_triggered_at` update + audit log entry

**Checkpoint**: Alerts confirmed end-to-end with scraper-sourced data.

---

### Phase 8: User Story 4 & 6 — Favorites & Transport Cost (Priority: P2/P3)

**Goal**: Farmers can star favorite crops and see transport cost estimates.

16. **T040**: Implement `GET /api/favourites` Route Handler:
    - Require session auth
    - Return `{ favourites: [{ crop_id, display_order }] }` for the logged-in farmer
    - Query `user_crop_preferences` table

17. **T041**: Implement `POST /api/favourites` Route Handler:
    - Require session auth
    - Validate `{ crop_id, display_order? }` with Zod
    - Upsert into `user_crop_preferences`
    - Return updated favorites list

18. **T042**: Implement `DELETE /api/favourites` Route Handler:
    - Require session auth
    - Accept `crop_id` query param
    - Delete from `user_crop_preferences`
    - Return updated favorites list

19. **T043**: Create `components/prices/favorite-crop-star.tsx`:
    - Star icon component toggling favorite state
    - ≥44×44px tap target, accessible focus ring
    - Server component that reads current favorite state and renders filled/outline star
    - Uses existing icon set from `components/icons.tsx`

20. **T044**: Wire `favorite-crop-star` into existing crop cards on `/prices`:
    - Render star on each crop card
    - On click, call `POST /api/favourites` or `DELETE /api/favourites`
    - Optimistically update UI state

21. **T045**: Create `app/(farmer)/favourites/page.tsx`:
    - Dedicated page listing all favorited crops
    - Show crop name, current price, 7-day mini-sparkline
    - Allow removal with a button per crop

22. **T046**: Update `components/prices/dashboard-prices-widget.tsx`:
    - Read favorites from `/api/favourites`
    - Show top 3 favorite crops with 7-day mini-sparklines
    - Fallback to provincial hub with setup banner if no farms registered
    - Fallback to first 3 crops if fewer than 3 favorites

23. **T047**: Create `lib/prices/transport.ts`:
    - Export `TRANSPORT_COST_PER_KM_PKR = 15` (flat per-km rate per 40kg Maund, configurable constant)
    - Export `estimateTransportCost(distanceKm: number): number` helper
    - Document calibration source in comments

24. **T048**: Update `app/api/prices/route.ts`:
    - Include `transport_cost_pkr` in each price response object
    - Calculate using `estimateTransportCost(distance_km)`
    - Ensure `distance_km` is populated from proximity calculation

25. **T049**: Update market comparison UI:
    - Show both `distance_km` and `transport_cost_pkr` on each market card
    - Format transport cost as PKR with proper localization

**Checkpoint**: Favorites and transport cost functional across `/prices`, `/favourites`, and dashboard widget.

---

### Phase 9: Cross-Cutting — Drift Detection Health (US-S4)

**Goal**: Drift status visible in `/api/prices/health`.

26. **T050**: Vitest integration test for `scripts/scrape-prices/drift-detector.ts`:
    - Test: stub source with rows=[] and same-weekday history → returns `drift_suspected`
    - Test: rows=[] but matching `mandi_holidays` row → returns `ok` with `is_holiday=true`

27. **T051**: Document operator runbook in `specs/002-mandi-price-tracker/runbook.md`:
    - How to read `/api/prices/health`
    - Where to fix selectors (`scripts/scrape-prices/selectors.ts`)
    - How to manually trigger the workflow

**Checkpoint**: Drift detection is visible and actionable.

---

### Phase 10: Polish & Cross-Cutting Concerns

28. **T052**: Run `npm run lint` and fix all new warnings introduced by the scraper and new UI components.

29. **T053**: Run `npm run build` and confirm zero TypeScript errors:
    - No `any` types
    - No non-null assertions (`!`)
    - No `@ts-ignore` / `@ts-expect-error`

30. **T054**: Insert new UI strings into Neon `translations` table:
    - Data source badge labels
    - Favorite star aria-labels
    - Transport cost labels
    - Any new button/badge text
    - Run `npm run sync:translations` after adding keys
    - Verify via Neon MCP or direct DB query that all 8 locales have entries

31. **T055**: Update `AGENTS.md` `<!-- SPECKIT -->` pointer if needed.

32. **T056**: Append ADR to `adrs/0018-playwright-scraper.md`:
    - Decision to add Playwright + xlsx scoped to scraper
    - Rejected alternatives
    - Constitution violation justification

33. **T057**: Commit + push per atomic-commit rule.

34. **T058**: Open PR from `feat/002-scraper` to `main` with spec + plan + research linked.

---

### Phase 11: Quality Gates

35. **T059**: Sync all Mandi Price Tracker UI string keys and translations across all 8 Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) into Neon `translations` database table using `scripts/sync-translations.mts`.

36. **T060**: Run `npx vitest run` to verify all automated test suites pass.

37. **T061**: Run `npm run lint` and `npm run build` to confirm zero TypeScript compilation or linting errors.

38. **T062**: Verify all items in `specs/002-mandi-price-tracker/checklists/quality-gate.md` pass.

---

## Critical Rules

- Do NOT install new runtime dependencies for the Next.js app. Playwright and xlsx are scoped to `devDependencies` and `scripts/scrape-prices/` only.
- Do NOT use Recharts. The project uses custom SVG charts.
- Do NOT hardcode crop lists. Fetch from `/api/crops` or seed data.
- Do NOT store secrets in code. Use env vars for `PRICES_CRON_SECRET`, Nodemailer credentials, etc.
- Do NOT use `any` in TypeScript. Zero escapes.
- Do NOT commit until `npm run lint` and `npm run build` pass.
- Do NOT implement features not in the spec. Stay within acceptance criteria.
- Every new UI string must have translation keys for all 8 locales before merge.
- All DB queries must flow through `lib/db.ts`. No ad-hoc clients.
- Zod validates every route handler input before it reaches the database.
- Scraper never reads or stores farmer PII.

---

## Deliverables

1. All code changes committed to the `feat/002-scraper` branch.
2. `specs/002-mandi-price-tracker/checklists/` populated with acceptance verification notes.
3. All acceptance criteria in `tasks.md` checked off.
4. A summary of what was built and any deviations from the spec.

---

## If You Get Stuck

- Re-read the spec and plan files first.
- Study existing similar features (prices, alerts, farms) for patterns.
- Check the Neon MCP for DB schema verification.
- Search the web for Playwright scraping patterns for ASP.NET/React sites.
- Ask only after you have exhausted research and codebase study.
