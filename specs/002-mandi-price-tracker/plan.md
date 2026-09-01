# Implementation Plan: Mandi Price Tracker & Predictor

**Branch**: `main` (per AGENTS.md hybrid branching — multi-file feature would normally move to `002-mandi-price-tracker`; spec/docs edits ship on `main` per prior commit `7508359`)
**Date**: 2026-09-01
**Spec**: [spec.md](spec.md)
**Research**: [research.md](research.md)
**Data Model**: [data-model.md](data-model.md)
**Contracts**: [contracts/api-contracts.md](contracts/api-contracts.md)
**Quickstart**: [quickstart.md](quickstart.md)
**Tasks**: [tasks.md](tasks.md) (regenerated after plan sign-off)

## Summary

Daily wholesale mandi prices for every district of Pakistan, scraped from the four official provincial portals (Punjab AMIS, Sindh SAMIS, KP FMIS, Balochistan BMIS) plus a federal PBS Weekly SPI XLSX cross-check, via Playwright in a free GitHub Actions cron. Each scrape batch authenticates to `POST /api/prices/ingest` with a bearer token, is rate-limited per IP, and writes an audit row to `scraper_runs`. The existing `mandi_prices` table is the single write target — no admin panel, no `admin_manual` source channel. Holt-Winters forecast and sell/hold recommendation run against rows written by the scraper (≥3 rows, ≤7d old) and are read by the existing farmer-facing pages.

This plan layers Playwright + xlsx on top of the existing Next.js + Postgres stack — no change to the app's runtime dependencies, since Playwright lives only in the cron workflow and a standalone `scripts/scrape-prices/` runner that the Next.js app never imports.

## Technical Context

- **Language/Version**: TypeScript 5.x, Node 22.x (existing). Playwright runners run Node 22 on the GitHub Actions Ubuntu image.
- **Primary Dependencies (app, unchanged)**: Next.js 15 Route Handlers, `zod`, `lib/db.ts` (Neon Lakebase Postgres), `lib/http.ts` (uniform error envelope), `lib/prices/forecast.ts` (existing Holt-Winters), `lib/prices/api-types.ts`, `lib/prices/proximity.ts`, `lib/prices/alerts.ts`. Constitution IV stack discipline holds.
- **Primary Dependencies (new, scoped to scraper only)**:
  - `playwright` (full Chromium) — **requires founder approval per Constitution's new-dependency rule.** Used only inside `scripts/scrape-prices/` and `.github/workflows/mandi-cron.yml`; never imported by the Next.js app or listed in the runtime app deps.
  - `xlsx` (SheetJS) — same constraint. Used only to parse the PBS Weekly SPI XLSX in the scraper runner.
- **Storage**: Neon Lakebase Postgres. Schema changes are append-only migrations: `0008_mandi_prices.sql` already exists; we add `0009_scraper_audit_and_holidays.sql` introducing `scraper_runs` and `mandi_holidays`, and amending `mandi_prices` (drop the `('govt_api','admin_manual')` source CHECK, add `source_code` column, add the new index).
- **Testing**: Vitest for Zod schemas and route handlers (existing); manual acceptance run-through for UI (existing per Constitution §Testing Policy). Scraper code is small enough to validate with a one-off `--dry-run` against the live portals + golden output diff in CI; no live-network tests committed to the test suite (per Constitution security rules — never log secrets, never run flaky browser tests on CI).
- **Target Platform**: Server: Vercel (Next.js), unchanged. Cron: GitHub Actions Ubuntu `ubuntu-latest` runner. Farmer UI: outdoor-mobile web, unchanged.
- **Project Type**: full-stack Next.js web app + standalone Node scraper that POSTs to a Route Handler.
- **Performance Goals**:
  - `GET /api/prices` p95 < 200ms at the Vercel edge for an authenticated farmer with district + bordering districts (SC-013, measured via Vercel Analytics on a 14-day rolling window).
  - `/api/prices/ingest` accepts a batch up to 5,000 rows in a single POST under 30s.
  - Cron run completes within 15 min (SC-011).
- **Constraints**:
  - Free tier only — GitHub Actions minutes per repo, no Vercel cron, no scraper-as-a-service.
  - Single Route Handler is the only writer to `mandi_prices` (Constitution IV).
  - Server-first React, TypeScript strict with zero escapes.
  - All new UI strings must be inserted in Neon `translations` for 8 locales before merge.
  - Scraper never reads or stores farmer PII.
- **Scale/Scope**:
  - 4 provincial portals, ~200 markets total, ~50–200 commodities per portal.
  - Target DB growth: ~5,000 rows/day worst case → ~1.8M rows/year; the existing `(crop_id, date DESC)` and `(mandi_id, crop_id, date DESC)` indexes already cover the read path.
  - Audit `scraper_runs` table retains 7 days (rate-limit/quota-friendly).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Per `.specify/memory/constitution.md` v1.0.0 and the project `AGENTS.md` (overrides noted):

| Principle | Status | Evidence / Action |
|---|---|---|
| I. Farmer-First | Pass | Whole-Pakistan coverage means a farmer in Quetta sees Quetta prices. Plain badges (`"Updated X days ago"`, `"Mandi Closed"`) over jargon. |
| II. Pakistan-First | Pass | Scraper covers 4 provinces + federal cross-check. 8 locales enforced by Constitution §Language Policy + sync-translations gate. |
| III. Spec-Driven Development | Pass | This plan is the third SDD artifact after research (signed off `7508359`) and spec (with 5 folded-in clarifications). Tasks will be generated next. |
| IV. Stack Discipline & Reuse | **Justified violation** | Two new deps (`playwright`, `xlsx`) added — both **scoped to the scraper runner only**, never imported by the Next.js app. See Complexity Tracking. Single shared DB client `lib/db.ts`. Schema change goes in migration `0009_…sql`. |
| V. Security & Data Integrity | Pass | Bearer `PRICES_CRON_SECRET` (env var only, never logged), per-IP rate limit (10/min, 429 on exceed), `scraper_runs` audit log retained 7 days, Zod validates the incoming ingest batch body. No PII handled by the scraper. |
| VI. Accessibility & Outdoor-Mobile | Pass | No UI changes outside the existing price card / dashboard widget; existing design-system tokens apply. |
| Hybrid branching | Pass | Multi-file feature → should normally move to a feature branch; current spec/docs continue on `main` per the earlier explicit founder call (commit `7508359`). Code changes for this plan will land on a fresh `feat/002-scraper` branch per AGENTS.md (commit + PR review). |
| Definition of Done | Pass | Every change in this plan must run `npm run lint` + `npm run build`, add the relevant 8-locale translation keys, and be reviewed against the spec before merge. |

## Project Structure

### Documentation (this feature)

```text
specs/002-mandi-price-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 — Playwright + whole-Pakistan, no admin
├── spec.md              # Phase 1 — 6-section spec + 5 clarifications folded in
├── data-model.md        # Phase 1 — schema refresh (source_code, audit, holidays)
├── contracts/
│   └── api-contracts.md # Phase 1 — ingest payload, scraper_runs payload
├── quickstart.md        # Phase 1 — runner setup, runbook
├── checklists/
│   └── requirements.md  # Phase 1 — spec quality gate
└── tasks.md             # Phase 2 — task breakdown (regenerated by /speckit-tasks)
```

### Source Code (repository root)

```text
# Existing (unchanged)
app/(farmer)/prices/page.tsx
app/(farmer)/dashboard/page.tsx
app/api/prices/route.ts
app/api/prices/alerts/route.ts
app/api/prices/predictions/route.ts
lib/db.ts
lib/http.ts
lib/prices/forecast.ts
lib/prices/proximity.ts
lib/prices/alerts.ts
lib/prices/api-types.ts
scripts/seed-mandi-prices.ts
db/migrations/0008_mandi_prices.sql

# New for this plan
scripts/scrape-prices/
├── index.ts                 # Playwright runner entry; per-source try/catch
├── sources/
│   ├── amis.ts              # Punjab — amis.pk
│   ├── samis.ts             # Sindh  — new-theme.staging-amis.com
│   ├── fmis-kp.ts           # KP     — fmis.kp.gov.pk
│   ├── bmis.ts              # Balochistan — amisbalochistan.org + balochistankissan.gob.pk
│   └── pbs-spi.ts           # Federal cross-check XLSX
├── selectors.ts             # Per-source CSS selectors; single file so drift is auditable
├── post.ts                  # Bearer-authenticated POST to /api/prices/ingest with batching
├── holiday-check.ts         # mandi_holidays pre-flagging (drift detection)
└── drift-detector.ts        # 0-rows + has-history ⇒ status='drift_suspected'

app/api/prices/ingest/route.ts         # EXTENDED — bearer + rate limit + audit row
app/api/prices/health/route.ts         # NEW — last successful scrape age for alerts

db/migrations/0009_scraper_audit_and_holidays.sql
  # ALTER mandi_prices: drop old source CHECK, add source_code VARCHAR(32) NOT NULL,
  #   add CHECK (source_code IN ('amis_pk','samis_pk','fmis_kp','bmis_balochistan','pbs_spi','seed_pk_initial')),
  #   add index on (source_code, date DESC).
  # CREATE TABLE scraper_runs (... 7-day TTL via cron prune).
  # CREATE TABLE mandi_holidays (mandi_id, date, label, source_code).

components/prices/data-source-badge.tsx  # NEW — visual chip showing source portal per row
.github/workflows/mandi-cron.yml         # EXTENDED — Playwright install + scrape runner

package.json                              # EXTENDED — `scrape:prices` script; new deps scoped via devDependencies
```

**Structure Decision**: Single Next.js full-stack repo with one standalone scraper runner under `scripts/scrape-prices/` that POSTs into the existing Route Handler. The scraper shares the Zod schemas and `api-types.ts` with the app via direct file imports (no separate package). This mirrors the existing pattern of `scripts/seed-mandi-prices.ts` and `scripts/sync-translations.mts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New dep: `playwright` (full Chromium, ~300MB) | Punjab AMIS, SAMIS, and BMIS are server-rendered ASP.NET / React frontends that require real browser execution to scrape (no public REST API exists). KP FMIS exposes a datatable but its filter URL params are session-validated; using the built-in CSV export still needs a browser session cookie. | Pure `fetch` + cheerio: rejected — fails on the three non-KP portals that gate content behind JS. Headless HTTP requests via `node-fetch`: rejected — same gating. Self-hosted `@sparticuz/chromium` bundle: rejected — adds Vercel-Lambda complexity for no benefit since the scraper only runs on GitHub Actions, not on Vercel. |
| New dep: `xlsx` (SheetJS) | PBS publishes Weekly SPI only as XLSX on `pbs.gov.pk` (no JSON API). | Manual CSV parsing from the XLSX binary: rejected — fragile and reinvents what SheetJS already does correctly. Migrate to PBS dcrates.data.gov.pk: rejected — that endpoint is retail CPI, not mandi-level wholesale. |
| Adding `scraper_runs` audit table | Clarification Q3 requires per-call auditability (timestamp, source, rows, status, IP) for abuse review. | Inline `console.log`: rejected — no retention, no query, no per-IP correlation. External log service (Datadog etc): rejected — paid, Constitution IV says no new paid deps. |
| Adding `mandi_holidays` table | Clarification Q4 requires pre-flagging holidays so 0-row days are not mistaken for schema drift. | Encode holidays in `selectors.ts`: rejected — conflates data and code, and holidays change yearly. |

## Open Risks (track in `tasks.md`)

1. **AMIS / SAMIS / BMIS may change their HTML structure without notice.** Mitigated by `lib/prices/scrapers/selectors.ts` (single file, hash-pinned) and the drift detector (`0 rows + has history → status='drift_suspected'`). Founder must be available to fix selectors within 24h of a drift alert.
2. **GitHub Actions free-tier minutes** (~2,000 min/month for free accounts). Worst-case daily run = 15 min × 30 days = 450 min/month — comfortable under the limit. If Playwright install becomes expensive on cache miss, the workflow installs Chromium once into the cache via `actions/cache`.
3. **Portal rate-limiting / IP bans.** Mitigated by per-source `waitForTimeout` + a single user-agent string + at most one daily run. If a portal bans us, the source returns 0 rows and the drift detector fires.
4. **Friday Jumu'ah + Sunday closures** are real market holidays across Pakistan — modeled via `mandi_holidays`, which the seed populates.

## Plan → Tasks Handoff

After this plan is approved, `/speckit-tasks` will produce a `tasks.md` grouped by:

1. **Phase 0 — Setup**: branch `feat/002-scraper`, install `playwright` + `xlsx` in devDeps only.
2. **Phase 1 — Migration**: `0009_scraper_audit_and_holidays.sql`, update `data-model.md`, seed `mandi_holidays`.
3. **Phase 2 — Ingest hardening**: extend `POST /api/prices/ingest` with bearer + rate-limit + audit; new `GET /api/prices/health`.
4. **Phase 3 — Scraper runner**: implement `scripts/scrape-prices/` (sources, selectors, post, drift detector, holiday check).
5. **Phase 4 — Workflow**: extend `.github/workflows/mandi-cron.yml`; add Playwright cache; document `PRICES_CRON_SECRET` in `.env.example`.
6. **Phase 5 — UI**: small `data-source-badge` chip; no other UI work needed in this iteration.
7. **Phase 6 — Translations**: insert all new keys in Neon `translations` for 8 locales via `scripts/sync-translations.mts`.
8. **Phase 7 — Verification**: `npm run lint` + `npm run build`, manual acceptance run-through against spec US1/US3 + FR-003 + SC-011/SC-012.

No code is written until `tasks.md` is approved.