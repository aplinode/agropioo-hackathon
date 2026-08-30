# Implementation Plan: Smart Weather Advisory

**Branch**: `002-weather-advisory` | **Date**: 2026-08-30 | **Spec**: [spec.md](spec.md)
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
**Performance Goals**: Daily advisory rendered within 30 seconds; critical alerts detected and queued within 15 minutes  
**Constraints**: TypeScript strict mode; no `any`, `!`, `@ts-ignore`; Route Handlers only for API; shared `lib/db.ts`; no new libraries without approval; UI strings must have translations for all 8 locales  
**Scale/Scope**: Hackathon demo; single-tenant per farmer; 7-day forecast horizon; advisory history retained indefinitely per farm

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
├── (auth)/              # Existing auth routes
├── dashboard/           # Existing dashboard
├── farms/               # Existing farms module
├── advisor/             # New: weather advisory page + API routes
│   ├── page.tsx
│   ├── history/
│   │   └── page.tsx
│   └── api/
│       ├── forecast/route.ts
│       ├── alerts/route.ts
│       └── register/route.ts
components/
├── advisor/             # Feature-specific UI
│   ├── AdvisoryCard.tsx
│   ├── AlertBanner.tsx
│   ├── FarmSelector.tsx
│   ├── ForecastList.tsx
│   └── HistoryList.tsx
├── icons.tsx            # Shared SVG icons (existing)
lib/
├── db.ts                # Shared Neon client (existing)
├── weather/
│   ├── openweather.ts   # OpenWeatherMap client wrapper
│   ├── advisory.ts      # Advisory generation rules
│   └── alerts.ts        # Alert rule engine
scripts/
└── migrations/
    └── 001_weather_advisory.sql
```

**Structure Decision**: Extend the existing full-stack Next.js app with a new `app/advisor/` route segment and `components/advisor/` feature directory. Database migrations live in `scripts/migrations/` and are applied in order. All data access flows through `lib/db.ts`.

## Complexity Tracking

> No constitution violations detected; table not required.
