# Implementation Plan: Mandi Price Tracker & Predictor

**Branch**: `002-mandi-price-tracker` | **Date**: 2026-08-30 | **Spec**: [spec.md](file:///home/sheikh-mohammad/Documents/hackathons/agropioo/specs/002-mandi-price-tracker/spec.md)
**Input**: Feature specification from `/specs/002-mandi-price-tracker/spec.md`

## Summary

The Mandi Price Tracker & Predictor enables Pakistani farmers to access real-time mandi prices for nearby markets, compare prices across districts, view 14-day ML/statistical price trend forecasts with confidence bands, receive actionable Sell/Hold recommendations, and set sell-only target price alerts delivered via in-app notifications and email (`nodemailer` + SMTP). It also provides global Pakistan mandi search, multi-language crop displays across 8 locales, offline caching in `localStorage`, and a summary widget on the main dashboard (`/dashboard`).

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js (Next.js 16 App Router, React 19)  
**Primary Dependencies**: Next.js, React, Tailwind CSS v4, Zod, bcryptjs, jose, nodemailer, react-hook-form, @hookform/resolvers, Neon Lakebase Postgres (`@neondatabase/serverless` / `pg` via `lib/db.ts`)  
**Storage**: Neon Lakebase Postgres (`mandis`, `crops`, `mandi_prices`, `price_predictions`, `price_alerts`, `user_crop_preferences`, `translations`)  
**Testing**: Vitest for Zod schemas & Route Handlers (`npx vitest run`); manual acceptance criteria run-through for UI  
**Target Platform**: Web (Responsive Outdoor-Mobile, Next.js Fullstack)  
**Project Type**: Full-stack Next.js Application  
**Performance Goals**: <200ms p95 response time for `/api/prices` queries; <10ms forecasting calculations; client rendering at 60fps  
**Constraints**: Server-side Route Handlers ONLY (no separate backend, no Server Actions); Neon Lakebase Postgres via `lib/db.ts` only; strictly approved dependencies; light mode default with outdoor high-contrast colors (`--color-agro-*`); 8 Pakistan language translations in Neon `translations` table before merge  
**Scale/Scope**: All 150+ districts of Pakistan, multiple crop types per market, daily price ingestion, 14-day forecasts, unlimited sell alerts per farmer  

---

## Constitution Check

*GATE: All checks evaluated against `.specify/memory/constitution.md` and `AGENTS.md`.*

| Gate / Principle | Status | Evaluation & Compliance Notes |
|---|---|---|
| **I. Farmer-First** | PASS | UI copy leads with actionable outcomes ("What to do, when to do it", Sell/Hold recommendation). Plain language over tech jargon. |
| **II. Pakistan-First** | PASS | Multi-language support across all 8 locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) with DB-driven translations in Neon `translations` table. Standardized unit in Maund (40 kg). Right-to-left layout for Urdu and Pashto. |
| **III. Spec-Driven Dev** | PASS | Follows strict loop. Research (`research.md`), Data Model (`data-model.md`), Contracts (`contracts/api-contracts.md`), Quickstart (`quickstart.md`), and Plan (`plan.md`) established before task generation. |
| **IV. Stack Discipline** | PASS | Route Handlers ARE the API layer. No separate Node backend or Server Actions. Neon Postgres accessed via `lib/db.ts`. No new unauthorized packages added. |
| **V. Security & Integrity** | PASS | Zod validates every route handler input. Password/JWT auth verified server-side. No plaintext secrets. Uniform error shape `{ error: { code, message } }`. |
| **VI. Outdoor Accessibility** | PASS | Light mode default, `--color-agro-*` tokens only, contrast ≥ 4.5:1, touch targets ≥ 44x44px, no horizontal scroll at 320px. |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-mandi-price-tracker/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database & entity models
├── quickstart.md        # Phase 1 developer setup & quickstart guide
└── contracts/
    └── api-contracts.md # Phase 1 API route handler contracts & Zod schemas
```

### Source Code Layout

```text
app/
├── (farmer)/
│   ├── (dashboard)/
│   │   └── page.tsx                      # Main dashboard featuring Top 3 tracked crops summary widget
│   └── prices/
│       ├── page.tsx                      # Main Mandi Price Tracker page
│       └── admin/
│           └── page.tsx                  # Admin manual price entry & holiday management panel
└── api/
    ├── cron/
    │   └── predict-prices/
    │       └── route.ts                  # Nightly background cron for 14-day forecasts
    └── prices/
        ├── route.ts                      # GET current mandi prices & search
        ├── history/
        │   └── route.ts                  # GET historical prices (1M, 3M, 6M, 12M)
        ├── predictions/
        │   └── route.ts                  # GET 14-day price predictions & recommendations
        ├── alerts/
        │   └── route.ts                  # GET/POST/PUT/DELETE farmer target price alerts
        └── ingest/
            └── route.ts                  # POST daily price ingestion & alert trigger engine

lib/
├── db.ts                                 # Shared Neon Postgres client
└── prices/
    ├── forecast.ts                       # Holt-Winters & linear trend statistical forecasting engine
    ├── proximity.ts                      # District proximity & bordering district resolution
    ├── ingest.ts                         # Daily market price scraper & manual override handler
    └── alerts.ts                         # Sell-only alert evaluation & email notification dispatcher

components/
├── prices/
    ├── mandi-price-card.tsx              # Mandi price listing card with change % and PKR diff
    ├── market-comparison-table.tsx       # Side-by-side mandi comparison view
    ├── price-history-chart.tsx           # Interactive 1M/3M/6M/12M price history chart
    ├── prediction-chart.tsx              # 14-day discrete forecast chart with 95% confidence band
    ├── recommendation-badge.tsx          # Sell/Hold recommendation badge & plain-language explanation
    ├── price-alert-modal.tsx             # Target price alert setup & edit modal
    ├── global-mandi-search.tsx           # Pakistan-wide mandi & crop search bar
    └── dashboard-prices-widget.tsx       # Summary widget with 7-day mini-sparklines for /dashboard
```

**Structure Decision**: Standard Next.js App Router full-stack layout consistent with feature-based route structure and shared utility modules.

---

## Complexity Tracking

> **No violations identified.** All requirements fit cleanly within Next.js App Router, Route Handlers, and Neon Lakebase Postgres using approved project libraries.
