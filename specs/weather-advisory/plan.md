# Implementation Plan: Smart Weather Advisory

**Branch**: `001-weather-advisory` | **Date**: 2026-08-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-weather-advisory/spec.md`

## Summary

Build a weather advisory feature within the existing Agropioo Next.js app that turns OpenWeatherMap forecast data into daily farming recommendations and critical alerts. Farmers register crops, sowing dates, and farm details; the system determines growth stage, fetches forecasts, generates personalized advice per farm, and delivers alerts via email and in-app notifications. Advisory history is tracked per farm.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 14+ (App Router)  
**Primary Dependencies**: Next.js Route Handlers, Neon Lakebase Postgres (`@neondatabase/serverless`), Zod, React Hook Form, Nodemailer + SMTP, Jose, Bcryptjs  
**Storage**: Neon Lakebase Postgres (schema migrations in repo)  
**Testing**: Zod schemas + route-handler tests (manual UI verification per constitution)  
**Target Platform**: Web application (outdoor-mobile first, light mode)  
**Project Type**: Full-stack web application  
**Performance Goals**: Daily advisory rendered within 30 seconds on-demand; critical alerts detected and queued within 15 minutes  
**Constraints**: TypeScript strict mode; no `any`, `!`, `@ts-ignore`; Route Handlers only for API; shared `lib/db.ts`; no new libraries without approval; UI strings must have translations for all 8 locales  
**Scale/Scope**: Hackathon demo; single-tenant per farmer; 7-day forecast horizon; advisory history retained indefinitely per farm

## Clarifications Applied

The following decisions from `/speckit.clarify` are reflected in this plan:

- Advisory generation is on-demand when the farmer opens the app or views the forecast page. No scheduled advisory cron job is required.
- Default farm selection shows the most recently active/registered farm; the farmer can switch to other farms.
- Alert deduplication: one alert per condition type per farm per 6-hour window.
- Growth stage is computed dynamically at advisory generation time based on current date vs sowing date and crop duration.
- Email alerts are sent for both warning and critical severities; in-app notifications show both.
- Translation keys are namespaced under `app.weather.*`; client components receive strings via `getWeatherBundle()` server-side props.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Farmer-First | PASS | Spec leads with farmer actions ("what to do, when to do it"); plain-language advice requirement (FR-004, SC-004). |
| II. Pakistan-First, Global-Ready | PASS | Language priority policy explicit; translations managed in DB; Urdu/Pashto RTL reserved. |
| III. Spec-Driven Development | PASS | Spec, clarifications, and plan follow required phase order; no code before planning. |
| IV. Stack Discipline & Reuse | PASS | Next.js + Neon + approved libs only; no ad-hoc clients; schema via migrations. |
| V. Security & Data Integrity | PASS | Zod validation, JWT httpOnly cookies, secrets in env, uniform error shape, rate limiting for auth routes. |
| VI. Accessibility & Outdoor-Mobile | PASS | Outdoor-mobile targets (≥44px touch, 4.5:1 contrast, no horizontal scroll at 320px) are non-negotiable constraints. |

**Gate Result**: PASS — no violations; no complexity tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/001-weather-advisory/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (/speckit.plan)
├── data-model.md        # Phase 1 output (/speckit.plan)
├── quickstart.md        # Phase 1 output (/speckit.plan)
├── contracts/           # Phase 1 output (/speckit.plan)
│   └── route-handlers.md
└── tasks.md             # Phase 2 output (/speckit.tasks - not created here)
```

### Source Code (repository root)

```text
app/
├── (farmer)/(dashboard)/      # Authenticated farmer route group
│   ├── weather/               # New: weather advisory page + history
│   │   ├── page.tsx           # Main advisory + 7-day forecast view
│   │   ├── history/
│   │   │   └── page.tsx       # Advisory history list + detail
│   │   └── demo-data.ts       # Demo forecast data per location
│   └── advisor/               # Existing: AI chat advisor (reuse patterns)
├── api/
│   └── weather/               # New: weather advisory API routes
│       ├── forecast/route.ts  # Fetch/generate daily advisory
│       ├── alerts/route.ts    # Scan and enqueue critical alerts
│       └── history/route.ts   # Fetch advisory history for a farm
components/
├── weather/                   # Feature-specific UI components
│   ├── AdvisoryCard.tsx
│   ├── AlertBanner.tsx
│   ├── FarmSelector.tsx
│   ├── ForecastList.tsx
│   └── HistoryList.tsx
├── icons.tsx                  # Shared SVG icons (existing)
lib/
├── db.ts                      # Shared Neon client (existing)
├── weather/
│   ├── openweather.ts         # OpenWeatherMap client wrapper
│   ├── advisory.ts            # Advisory generation rules
│   └── alerts.ts              # Alert rule engine
lib/i18n/
├── server.ts                  # Add getWeatherBundle() here
catalog/
├── en.ts                      # Add weather advisory translation keys
├── ur.ts, pa.ts, ps.ts, ...   # Draft translations for all 7 other locales
db/migrations/
└── 0008_weather_advisory.sql  # farms extensions + weather_advisories + weather_alerts
```

**Structure Decision**: Extend the existing farmer route group with `app/(farmer)/(dashboard)/weather/` for the advisory UI and `app/api/weather/` for API routes. Feature components live in `components/weather/`. Translation keys are added to `catalog/*.ts` and synced to the `translations` table via `npm run sync:translations`. All data access flows through `lib/db.ts`. Migrations live in `db/migrations/` and are applied in order.

### Translation Architecture

Every visible string in the weather advisory feature follows the existing catalog → DB sync pattern:

1. **Authoring**: Add namespaced keys to `catalog/en.ts` under the `app.weather.*` namespace.
2. **Drafting**: Add partial translations to the other 7 locale catalog files (`catalog/ur.ts`, `catalog/pa.ts`, etc.).
3. **Sync**: Run `npm run sync:translations` to upsert the full key × locale matrix into the Neon `translations` table.
4. **Runtime**: Server-side `getWeatherBundle()` in `lib/i18n/server.ts` loads the dictionary and returns a flat props bundle to client components.
5. **Fallback**: If the DB is unreachable, the build-time catalog draft is used; English is always present as the source of truth.

**Key namespacing convention**: `app.weather.pageTitle`, `app.weather.advisory.title`, `app.weather.alerts.heavyRain`, etc. — mirroring the existing `app.advisor.*` and `app.detect.*` patterns.

### Complexity Tracking

> No constitution violations detected; table not required.
