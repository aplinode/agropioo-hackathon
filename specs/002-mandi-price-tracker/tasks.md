# Tasks: Mandi Price Tracker & Predictor (Playwright whole-Pakistan)

**Input**: Design documents from `/specs/002-mandi-price-tracker/`
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-contracts.md](contracts/api-contracts.md), [quickstart.md](quickstart.md)
**Tests**: Zod/Route Handler unit tests via Vitest; manual acceptance verification for UI and cron (per Constitution §Testing Policy). No live-network tests committed.

**Organization**: Tasks are grouped by user story + a new "Scraper" phase (US-S1…US-S4) that has no farmer-facing acceptance but is the only path to fresh data. All UI stories (US1–US6) reuse the existing pages from the prior implementation and only change in behaviour once scraper data is in the table.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US6 (farmer-facing) or US-S1…US-S4 (scraper/infra)
- Includes exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch + dependency additions for the scraper-only path.

- [x] T001 Create feature branch `feat/002-scraper` from `main` and push it (per AGENTS.md hybrid branching — multi-file feature)
- [x] T002 [P] Add `playwright` to `devDependencies` in `package.json` (scoped to scraper; **requires founder approval per Constitution new-dependency rule**)
- [x] T003 [P] Add `xlsx` to `devDependencies` in `package.json` (PBS SPI parsing; **requires founder approval**)
- [x] T004 [P] Add `npm` script `scrape:prices` in `package.json` that runs `node --experimental-strip-types --env-file-if-exists=.env scripts/scrape-prices/index.ts`
- [x] T005 [P] Add `PRICES_CRON_SECRET` placeholder to `.env.example` with a comment marking it required for the cron job

**Checkpoint**: Branch up; deps approved and installed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + ingest hardening that MUST be complete before any user story can be verified against real data.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [ ] T006 Create migration `db/migrations/0009_scraper_audit_and_holidays.sql` that:
  - drops the `('govt_api','admin_manual')` CHECK on `mandi_prices.source`,
  - alters `mandi_prices` to add `source_code VARCHAR(32) NOT NULL` with the new CHECK enum,
  - adds index `(source_code, date DESC)` on `mandi_prices`,
  - creates `scraper_runs` table (id, received_at, source_code, status, rows_written, rows_rejected, caller_ip INET, request_id UUID) with the 7-day retention column set,
  - creates `mandi_holidays` table (id, mandi_id, province, date, label, source_code) with the `UNIQUE(mandi_id, date)` constraint
- [ ] T007 [P] Extend `scripts/seed-mandi-prices.ts` to backfill `mandi_prices.source_code = 'seed_pk_initial'` for any existing seed rows
- [ ] T008 [P] Extend `scripts/seed-mandi-prices.ts` to seed `mandi_holidays` with all Sundays for the next 12 months and the official Pakistan federal holidays for the current year
- [ ] T009 [P] Update `data-model.md` to reflect the migration (already done in plan; this task verifies the schema matches the docs)
- [ ] T010 Extend `app/api/prices/ingest/route.ts` to:
  - require `Authorization: Bearer ${PRICES_CRON_SECRET}` (return 401 `unauthorized` on mismatch),
  - apply per-IP rate limit of 10 req/min (return 429 `rate_limited` on exceed),
  - validate the new `ingestBatchSchema` from `contracts/api-contracts.md`,
  - upsert into `mandi_prices` with `source='govt_api'` + `source_code` echoed from body,
  - write an audit row to `scraper_runs` for every accepted request,
  - on success return `{ success, request_id, rows_written, rows_rejected, ingested_at }`
- [ ] T011 [P] Implement `GET /api/prices/health` in `app/api/prices/health/route.ts` returning per-source `last_success`, `rows`, and `status` from `scraper_runs` (no auth, no PII)
- [ ] T012 [P] Add a Vitest unit test `app/api/prices/ingest/route.test.ts` covering: missing bearer → 401, bad bearer → 401, rate-limit → 429, valid bearer + valid body → 200 + audit row, malformed row in body → that row skipped + `rows_rejected` incremented
- [ ] T013 [P] Add a Vitest unit test for `app/api/prices/health/route.ts` asserting the per-source shape from `contracts/api-contracts.md` §6

**Checkpoint**: Migration applies cleanly on a fresh DB; ingest endpoint hardened and tested; no app UI work has begun.

---

## Phase 3: User Story — Scraper runs daily and writes rows for all four provinces (US-S1, P0 infrastructure)

**Goal**: A free GitHub Actions cron invokes the scraper, which pulls prices from Punjab AMIS, Sindh SAMIS, KP FMIS, Balochistan BMIS, and PBS SPI XLSX, then POSTs them in authenticated batches to `/api/prices/ingest`.

**Independent Test**: Manually run `npm run scrape:prices` against a local dev server; verify `mandi_prices` got rows from all four `source_code`s; verify `scraper_runs` got one audit row per batch; verify a deliberate 401 when `PRICES_CRON_SECRET` is wrong.

### Implementation for US-S1

- [ ] T014 [P] Create `scripts/scrape-prices/selectors.ts` exporting a single object keyed by `source_code` with each portal's CSS selectors, the base URL, and the date-extraction strategy (single file so drift is auditable)
- [ ] T015 [P] Create `scripts/scrape-prices/sources/amis.ts` (Punjab AMIS) — Playwright opens `ViewPrices.aspx`, walks per-commodity + per-mandi, returns `IngestRow[]` (≥3 historical rows per active mandi to satisfy the FR-008 prediction bar of ≥3 rows / ≤7d)
- [ ] T016 [P] Create `scripts/scrape-prices/sources/samis.ts` (Sindh SAMIS) — Playwright navigates the React frontend at `new-theme.staging-amis.com/market_price`, applies district/market/commodity filters via URL, returns `IngestRow[]`
- [ ] T017 [P] Create `scripts/scrape-prices/sources/fmis-kp.ts` (KP FMIS) — Playwright loads `fmis.kp.gov.pk/kp_essential_commodities_price`, iterates the datatable rows, returns `IngestRow[]` (the built-in CSV export endpoint is the preferred happy path; fall back to table scrape if needed)
- [ ] T018 [P] Create `scripts/scrape-prices/sources/bmis.ts` (Balochistan BMIS + balochistankissan fallback) — Playwright visits `amisbalochistan.org/prices/` and `balochistankissan.gob.pk/pages/market-rates`, picks district from the dropdown, returns `IngestRow[]`
- [ ] T019 [P] Create `scripts/scrape-prices/sources/pbs-spi.ts` (PBS Weekly SPI XLSX) — uses `xlsx` to parse the latest weekly XLSX from `pbs.gov.pk/price-statistics/`, returns `IngestRow[]` (federal cross-check; sparse is expected)
- [ ] T020 [P] Create `scripts/scrape-prices/holiday-check.ts` — `isHoliday(mandiId, date)` returns `true` if a row exists in `mandi_holidays`; used to set `is_holiday=true` so the UI shows the badge and the drift detector doesn't false-positive
- [ ] T021 [P] Create `scripts/scrape-prices/drift-detector.ts` — `detectDrift(source_code, rows)` returns `status='drift_suspected'` if rows=0 AND that source had historical rows for the same weekday; otherwise `status='ok'`
- [ ] T022 Create `scripts/scrape-prices/post.ts` — `postBatch(source_code, rows, secret)` splits rows into ≤5000-row batches, signs each with the bearer, POSTs to `/api/prices/ingest`, retries once on 5xx with backoff, returns aggregated counts
- [ ] T023 Create `scripts/scrape-prices/index.ts` — the runner: loads env, instantiates a single Playwright browser, calls each `sources/*.ts` in its own try/catch (one failure cannot block others), runs `holiday-check` and `drift-detector` per source, posts each batch via `post.ts`, exits 0 if any source wrote rows, exits 1 if zero rows across all sources (per spec §Q1)

**Checkpoint**: Locally, `npm run scrape:prices` ingests real prices for at least Punjab AMIS into the dev DB. The runner never imports the Next.js app.

---

## Phase 4: User Story — Workflow automation (US-S2, P0 infrastructure)

**Goal**: The free GitHub Actions cron runs the scraper daily, exits non-zero on zero-row run, and caches Playwright's Chromium between runs.

**Independent Test**: Manually trigger `.github/workflows/mandi-cron.yml` from the Actions tab; verify a successful run uploads rows; verify a forced secret mismatch produces a non-zero exit and a workflow-failure notification.

### Implementation for US-S2

- [ ] T024 Extend `.github/workflows/mandi-cron.yml` to: install `playwright` + `xlsx` from devDependencies, `actions/cache` the Playwright browsers path, `npm ci`, `npm run scrape:prices`, set the exit code from the runner
- [ ] T025 [P] Add a second manual-trigger job to `.github/workflows/mandi-cron.yml` (`workflow_dispatch`) that runs `npm run scrape:prices -- --dry-run` for operator debugging without writing to the DB
- [ ] T026 [P] Add `PRICES_CRON_SECRET` to the GitHub repo secrets list in `docs/runbook.md` (or new `docs/cron-secrets.md`) with rotation instructions

**Checkpoint**: A maintainer can run the workflow manually, and the scheduled run produces green ticks on success and red on zero-row.

---

## Phase 5: User Story 1 - View Current Market Prices (Priority: P1) 🎯 MVP

**Goal**: A logged-in farmer opens `/prices` and sees wholesale mandi prices near their farm for the crops they care about, with the "Updated X days ago" and "Mandi Closed" badges from the new scraper run, plus a small chip showing which portal reported the number.

**Independent Test**: With `mandi_prices` populated by the seed + a successful `npm run scrape:prices`, open `/prices`, confirm prices for the farmer's district + bordering districts load, confirm at least one card shows the new `data-source-badge` chip, confirm a `mandi_holidays` row causes the "Mandi Closed" badge on that market.

### Tests for User Story 1 (only if Vitest setup exists for the page) ⚠️

- [ ] T027 [P] [US1] Vitest contract test for `app/api/prices/route.ts` (already exists at T012-equivalent level; skip if already passing) — confirm `mandi_prices` query returns the new `source_code` field per row

### Implementation for User Story 1

- [ ] T028 [P] [US1] Create `components/prices/data-source-badge.tsx` — small server component that maps `source_code` → localized label (Punjab AMIS / Sindh SAMIS / KP FMIS / Balochistan BMIS / PBS SPI / Seed) and uses an existing color-agro-* token, ≥44×44px tap target, focus ring per design system
- [ ] T029 [P] [US1] Add the 8 `data_source_badge` translation keys (one per locale × one per source) to `scripts/sync-translations.mts` and run `npm run sync:translations` (per Constitution §Language Policy)
- [ ] T030 [US1] Wire `data-source-badge` into the existing `components/prices/mandi-price-card.tsx` so each card shows the source chip; no other card change
- [ ] T031 [US1] Manually verify the acceptance scenarios from spec US1 against the dev server with scraper-populated data; capture before/after screenshots in `specs/002-mandi-price-tracker/checklists/us1-acceptance.md`

**Checkpoint**: User Story 1 demonstrably ships the new scraper-sourced data to farmers.

---

## Phase 6: User Story 3 - See Price Trend Predictions (Priority: P2)

**Goal**: The 14-day Holt-Winters chart only renders when ≥3 historical rows exist and the most recent row is within 7 days (per spec §Q2); otherwise show a clear "Not enough data" state.

**Independent Test**: With only 2 historical rows for a crop, the predictions chart shows the "Not enough data" state; with 3+ rows where the most recent is 6 days old, the chart shows the 14 forecast points + confidence band.

### Implementation for User Story 3

- [ ] T032 [P] [US3] Extend `lib/prices/forecast.ts` with a `canForecast(cropId, mandiId)` helper that returns `{ ok: boolean, reason: 'insufficient_rows' | 'stale_data' | 'ok', rowCount, lastDate }` per the spec §Q2 bar
- [ ] T033 [US3] Wire `canForecast` into the existing prediction route and prediction chart so the "Not enough data" state renders when `ok=false`
- [ ] T034 [US3] Manually verify US3 acceptance #3 + #4 against a crop with deliberately thinned history; record in `specs/002-mandi-price-tracker/checklists/us3-acceptance.md`

**Checkpoint**: Predictions correctly self-defer on thin data; existing happy-path predictions still work.

---

## Phase 7: User Story 5 - Set Price Alerts (Priority: P3) — re-verify after scraper is live

**Goal**: Confirm that alerts still fire correctly when the row that crossed the target came from the scraper (not the seed) and the audit trail in `scraper_runs` is intact.

**Independent Test**: After a successful cron run writes a row that crosses a target, the same cron run also triggers the in-app + email alert (per spec SC-006).

### Implementation for User Story 5

- [ ] T035 [US5] Extend `lib/prices/alerts.ts` (existing) so that the evaluation log includes the `source_code` of the row that triggered the alert (audit, not user-facing)
- [ ] T036 [US5] Manually verify the full alert flow: set target PKR 3,500 for `wheat` at a mandi, force a cron run that ingests a row ≥ 3,500, confirm in-app + email + `last_triggered_at` update + audit log entry

**Checkpoint**: Alerts are confirmed end-to-end with scraper-sourced data.

---

## Phase 8: Cross-cutting — Drift detection health (US-S4, P0 infrastructure visible in `/api/prices/health`)

**Goal**: The new `GET /api/prices/health` endpoint surfaces a "drift_suspected" status so a maintainer can see at a glance which portal's selectors are stale.

**Independent Test**: After a simulated failure (point one source's selectors at a wrong CSS class), the next cron run produces `status='drift_suspected'` in `scraper_runs` and `GET /api/prices/health` reflects it.

### Implementation for US-S4

- [ ] T037 [P] [US-S4] Vitest integration test for `scripts/scrape-prices/drift-detector.ts` — given a stub source with rows=[] and same-weekday history, returns `drift_suspected`; given rows=[] but a matching `mandi_holidays` row, returns `ok` with `is_holiday=true`
- [ ] T038 [US-S4] Document the operator runbook for drift in `specs/002-mandi-price-tracker/runbook.md` (how to read the health endpoint, where to fix selectors, how to manually trigger the workflow)

**Checkpoint**: Drift is visible and actionable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Ship-time cleanup and verification.

- [ ] T039 [P] Run `npm run lint` and fix all new warnings introduced by the scraper
- [ ] T040 [P] Run `npm run build` and confirm zero TS errors (no `any`, no `!`, no `@ts-ignore`)
- [ ] T041 [P] Insert any new UI strings introduced by the scraper (e.g. the `data-source-badge` labels) into the Neon `translations` table across all 8 locales via `scripts/sync-translations.mts` (per Constitution §Language Policy)
- [ ] T042 [P] Update `AGENTS.md` `<!-- SPECKIT -->` pointer if any further plan/spec moves (no change needed for this iteration — already points at this `plan.md`)
- [ ] T043 [P] Append a short ADR to `adrs/0018-playwright-scraper.md` recording the decision to add Playwright + xlsx scoped to the scraper, the rejected alternatives, and the constitution-violation justification (per AGENTS.md "Significant architecture decisions")
- [ ] T044 Commit + push per atomic-commit rule (one task = one commit where the unit stands alone; multi-file coherent change = one commit; e.g. T010/T011/T012/T013 can be one commit; T024/T025/T026 can be one commit)
- [ ] T045 Open PR from `feat/002-scraper` to `main` with the spec + plan + research linked; per Constitution, solo founder review is the gate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No deps. Branch first.
- **Phase 2 (Foundational)**: Depends on Phase 1 (deps + secrets). **Blocks all other work.**
- **Phase 3 (US-S1 Scraper)**: Depends on Phase 2 (migration + ingest hardening). No app UI work needed before this — the scraper is the only new data path.
- **Phase 4 (US-S2 Workflow)**: Depends on Phase 3 (runner must exist). Parallelizable with Phase 5/6 UI work.
- **Phase 5 (US1)**: Depends on Phase 2 (so the read path returns the new `source_code`). Can run in parallel with Phase 6/7.
- **Phase 6 (US3)**: Depends on Phase 2. Independent of US1.
- **Phase 7 (US5)**: Depends on Phase 3 (needs scraper-written rows to trigger alerts on).
- **Phase 8 (US-S4)**: Depends on Phase 3 (drift logic only meaningful once scraper runs).
- **Phase 9 (Polish)**: Depends on all chosen user stories being complete.

### Parallel Opportunities (within `feat/002-scraper`)

- T015–T019 (per-source scraper files) can all be written in parallel — different files, no shared state.
- T020, T021 (holiday + drift) can run in parallel with T014 (selectors) — different files.
- T028 + T029 (badge component + translation keys) can run in parallel with T032 (forecast helper) — different files.

---

## Implementation Strategy

### MVP (US-S1 + US-S2 + Phase 2)

1. Phase 1 → branch + deps
2. Phase 2 → migration + hardened ingest + health endpoint + unit tests
3. Phase 3 → scraper runner with all four sources in one PR (per spec §Q5)
4. Phase 4 → workflow + runbook
5. **STOP and VALIDATE**: run the cron end-to-end against staging; confirm at least Punjab AMIS writes rows, others fail with `drift_suspected` (so we know the drift detector works from day one)

### Incremental Delivery

After MVP, layer the existing user stories (US1 UI chip, US3 thin-data guard, US5 alert audit) in order of their priority in spec.md. Each is independently testable.

### Risk-aware sequencing

The Playwright browsers install is the slowest single operation (~300 MB). Cache it in the workflow from T024 so the second and subsequent runs complete in well under 15 minutes (SC-011).

---

## Notes

- The first commit on `feat/002-scraper` must include the migration so `git rebase main` from a teammate's working copy is clean.
- Each Vitest test added in this plan should fail on `main` and pass on the branch after the corresponding implementation task lands — never commit a test that already passes.
- The scraper has no live-network tests committed (Constitution security). Validate the scraper locally with `npm run scrape:prices` against `npm run dev`; CI covers the typed Zod schemas and the drift detector only.
- Per the constitution: every commit must include its spec/plan changes if behaviour changed; in this iteration, the spec/plan changes already shipped on `main` in commit `7508359` and the present `plan.md`.