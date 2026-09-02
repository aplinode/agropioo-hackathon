# Research: Mandi Price Tracker & Predictor

## Executive Summary

This document details the research findings, technical decisions, and architecture for Feature 002: Mandi Price Tracker & Predictor (`specs/002-mandi-price-tracker`).

All technical choices satisfy the project **Constitution** (`.specify/memory/constitution.md` and `AGENTS.md`), including Next.js Route Handlers as the API layer, Neon Lakebase Postgres via `lib/db.ts`, zero unauthorized dependencies, outdoor-mobile accessibility, and Pakistan-first localization across 8 languages.

---

## Key Research Areas & Decisions

### 1. Daily Mandi Price Data Ingestion & Fallbacks

- **Decision**: Multi-source ingestion via Route Handler (`POST /api/prices/ingest`) backed by a Playwright-based scraper running on the free GitHub Actions cron (`.github/workflows/mandi-cron.yml`). **No admin panel in this build.**
  1. **Provincial official portals** (one scraper per source, unified into `mandi_prices` with `source = 'govt_api'`):
     - **Punjab — AMIS** (`http://www.amis.pk`, run by PITB / Agriculture Dept Punjab). 135 markets. Scrapes `ViewPrices.aspx?commodityId=X` per commodity → mandi table.
     - **Sindh — SAMIS** (`https://new-theme.staging-amis.com/market_price`). 27 markets across 22 districts. Modern HTML frontend; district + market + commodity filters in URL.
     - **KP — FMIS KP** (`https://fmis.kp.gov.pk/kp_essential_commodities_price`). 35+ districts, datatable with built-in CSV export and filter URL params (district/item/dateFrom/dateTo) — preferred scrape path.
     - **Balochistan — BMIS** (`https://amisbalochistan.org/prices/`) + `https://balochistankissan.gob.pk/pages/market-rates` district selectors. Sparse coverage; existing seed data fills gaps until portals report.
  2. **Federal cross-check — PBS Weekly SPI XLSX** (`https://www.pbs.gov.pk/price-statistics/`). 50 markets, 17 cities, 51 essential items. Weekly cadence; parsed via `xlsx` library. Used as a sanity check, not a primary feed.
  3. **Offline / Missing Data Handling**: Markets with no fresh row keep their last known price (from scraper or seed), surfaced with a prominent `"Updated X days ago"` badge. Sundays / official holidays render a `"Mandi Closed / Market Holiday"` status badge.
- **Rationale**: No free, public, all-Pakistan REST API exists (Zarai Mandi and PAR are paid; PBS exposes XLSX, AMIS exposes HTML). Playwright on GitHub Actions is the lowest-cost path to daily nationwide coverage without violating the no-new-runtime-deps rule for the Next.js app itself — Playwright lives only in the cron workflow and a standalone `scripts/scrape-prices/` runner, never imported by app code. The existing seed (`scripts/seed-mandi-prices.ts`) covers Balochistan gaps when BMIS is down.
- **Scraper choice**: `playwright` (full Chromium) on `runs-on: ubuntu-latest` GitHub Actions runner. Browser bundle size is fine for Actions (~300 MB cached); Vercel is not in scope for the scraper. Install command: `npx playwright install --with-deps chromium` inside the workflow. Result rows are POSTed in batches to `/api/prices/ingest` (bearer-token authenticated) so the Route Handler stays the single write path per the Constitution.
- **Excluded from build** (record the no-go, per the constitution's ADR expectation):
  - Admin web panel — explicitly out of scope for this build (no `admin_manual` source channel).
  - Zarai Mandi public API — does not exist; only WhatsApp subscription.
  - PAR Daily Commodity Prices — login-gated, commercial product.
  - PBS dcrates.data.gov.pk — retail CPI only, not mandi-level wholesale.

### 2. Time-Series Price Prediction & Volatility Engine (7–14 Days)

- **Decision**: In-house statistical forecasting engine in pure TypeScript (`lib/prices/forecast.ts`) implementing **Holt-Winters Triple Exponential Smoothing & Linear Trend Estimation**.
- **Rationale**: 
  - Python-based Prophet/LSTM models require separate microservices or heavy runtime dependencies, violating our single Next.js fullstack architectural constraint.
  - Holt-Winters and time-series decomposition in TypeScript run in <10ms server-side without external dependencies, delivering 14 discrete daily forecast points along with lower and upper 95% confidence bounds (`[predicted - 1.96*SE, predicted + 1.96*SE]`).
  - When historical data points are < 14 or volatility standard deviation exceeds 15% threshold, the recommendation engine emits a `"High Volatility / Low Data"` warning badge alongside Sell/Hold recommendations.
- **Caching & Free Cron Execution**: Triggered via a free **GitHub Actions Scheduled Workflow** (`.github/workflows/mandi-cron.yml`) calling `POST /api/cron/predict-prices` daily with `CRON_SECRET` authentication. Forecasts are calculated and cached in the `price_predictions` Postgres table.

### 3. Price Target Alerting & Email Deep-Linking

- **Decision**: Event-driven alert evaluation triggered immediately following daily price ingestion.
- **Workflow**:
  1. Upon `POST /api/prices/ingest` execution, the system queries active sell-only target price alerts (`status = 'active'`, `market_price >= target_price`).
  2. Creates in-app notifications tagged with `type = 'price_alert'`, pinned to top feed with a distinct green badge.
  3. Sends HTML email alerts via `nodemailer` (SMTP) featuring a direct `"View Mandi Prices"` button deep-linked to `/prices?crop={crop_id}&mandi={mandi_id}`.
  4. Allows in-place editing, pause/active state toggling, and deletion of alerts via `/api/prices/alerts`. Re-triggers on every new daily price update where price >= target.

### 4. Location Proximity & Global Search Across Pakistan

- **Decision**: Proximity matched by district topology (`lib/farms/districts.ts`) + adjacent bordering districts + distance in km.
- **Fallback**: If farmer has no registered farm location in onboarding, auto-loads nearest provincial market hub (e.g. Lahore / Multan) with an informative setup prompt banner.
- **Global Search**: Global search bar enables selecting any crop or mandi across all 150+ districts of Pakistan.

### 5. Multi-Language & Neon Database Translation Management

- **Decision**: All UI strings, crop names, market card labels, recommendation badges, and search placeholders are managed dynamically via the Neon database `translations` table across all 8 supported locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`).
- **Database Source of Truth**: Translated strings live in Postgres, not hardcoded static catalog files alone. Any UI change introduced by the Mandi Price Tracker feature MUST populate/sync corresponding translation rows in the Neon `translations` table using Neon MCP or `scripts/sync-translations.mts`.
- **Offline Caching**: Client-side hook (`hooks/use-offline-prices.ts`) syncs latest price lists and 3-month history charts into `localStorage`, rendering cached data seamlessly when internet connection drops.

---

## Resolved Technical Unknowns

| Topic | Resolution / Decision |
|---|---|
| ML Prediction Framework | Pure TS Holt-Winters / Linear Trend engine in `lib/prices/forecast.ts` with 95% confidence bands |
| Prediction Caching | Postgres table `price_predictions` populated by free GitHub Actions cron (`/api/cron/predict-prices`) |
| Data Unit | Standardized Maund (40 kg / Pakistani Mann) for all database rows and UI displays |
| Scraper runtime | Playwright full Chromium on free GitHub Actions cron; scraper never imported by the Next.js app (kept under `scripts/scrape-prices/`) |
| Coverage | Punjab AMIS (primary), Sindh SAMIS, KP FMIS, Balochistan BMIS + admin manual fallback, PBS Weekly SPI XLSX as cross-check |
| Source value in DB | `govt_api` (scraper) — single channel. Scraper rows carry the source code of the portal that produced them |
| Alerts Delivery | Dual channel: pinned green in-app notifications + `nodemailer` SMTP emails with deep links |
| Transport Costs | Distance shown in km from farm location to each mandi; no speculative PKR transport calculation |
| Multi-language Localisation | All 8 Pakistan locales inserted into Neon `translations` DB table via Neon MCP / `sync-translations.mts` |
