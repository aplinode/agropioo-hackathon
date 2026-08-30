# Research: Mandi Price Tracker & Predictor

## Executive Summary

This document details the research findings, technical decisions, and architecture for Feature 002: Mandi Price Tracker & Predictor (`specs/002-mandi-price-tracker`).

All technical choices satisfy the project **Constitution** (`.specify/memory/constitution.md` and `AGENTS.md`), including Next.js Route Handlers as the API layer, Neon Lakebase Postgres via `lib/db.ts`, zero unauthorized dependencies, outdoor-mobile accessibility, and Pakistan-first localization across 8 languages.

---

## Key Research Areas & Decisions

### 1. Daily Mandi Price Data Ingestion & Fallbacks

- **Decision**: Multi-tier ingestion via Route Handler (`POST /api/prices/ingest`).
  1. **Primary API Scraper**: Automated daily fetch/scraper connecting to government market portals (Punjab AMIS / Market Information System).
  2. **Admin Web Panel**: An admin interface in `/prices/admin` for manual price entry, overrides, and market holiday flagging.
  3. **Offline / Missing Data Handling**: Markets with missing daily data maintain their last known price marked with a prominent `"Updated X days ago"` badge. Market holidays (Sundays / official holidays) render a `"Mandi Closed / Market Holiday"` status badge.
- **Rationale**: Direct scraper API integration guarantees real-time daily prices, while admin manual entry ensures resilience against external government server downtime.

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

### 5. Multi-Language & Offline LocalStorage Caching

- **Decision**: Crop names stored in database schema with columns (`name_en`, `name_ur`, `name_pa`, `name_ps`, `name_sd`, `name_skr`, `name_bal`, `name_hno`) and fetched according to active UI locale.
- **Offline Caching**: Client-side hook (`hooks/use-offline-prices.ts`) syncs latest price lists and 3-month history charts into `localStorage`, rendering cached data seamlessly when internet connection drops.

---

## Resolved Technical Unknowns

| Topic | Resolution / Decision |
|---|---|
| ML Prediction Framework | Pure TS Holt-Winters / Linear Trend engine in `lib/prices/forecast.ts` with 95% confidence bands |
| Prediction Caching | Postgres table `price_predictions` populated by scheduled nightly cron (`/api/cron/predict-prices`) |
| Data Unit | Standardized Maund (40 kg / Pakistani Mann) for all database rows and UI displays |
| Alerts Delivery | Dual channel: pinned green in-app notifications + `nodemailer` SMTP emails with deep links |
| Transport Costs | Distance shown in km from farm location to each mandi; no speculative PKR transport calculation |
| Multi-language Crop Names | Columns for 8 languages in `crops` table, served based on user language context |
