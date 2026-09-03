# Implementation Plan: Smart Weather Advisory

**Branch**: `001-weather-advisory` | **Date**: 2026-08-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-weather-advisory/spec.md`

## Summary

Build a weather advisory feature within the existing Agropioo Next.js app that turns OpenWeatherMap forecast data into daily farming recommendations and critical alerts. Farmers register crops, sowing dates, farm area, and farm details; the system determines growth stage, fetches forecasts, generates personalized advice per farm, and delivers alerts via email and in-app notifications. Advisory history is tracked per farm.

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
 - Farm registration includes `acres` (area size) via the weather-specific registration form (`POST /api/weather/register`); validation ensures `acres > 0`.
 - A dedicated `get_forecast` tool is added to the weather advisor agent so it can provide forecast-aware guidance; the existing `getWeather` tool remains for current conditions.
  - AI-generated daily advice is cached in the `weather_advisories` table keyed by `(farm_id, advisory_date)`, satisfying SC-001's 30-second target on repeat visits. Cache is regenerated only when a new forecast is fetched for a date that already has cached advice; same-day repeat visits reuse the cached row.
  - The weather advisor agent's `get_forecast` tool returns the full 7-day forecast with daily AI-generated advice text, enabling forecast-aware guidance without additional round-trips.
  - OpenWeatherMap API calls are protected by per-IP rate limiting on weather routes; repeated requests from the same device/account within the limit window are blocked.
  - When the OpenWeatherMap API key is missing or invalid, the weather page shows an explicit error message. No sample or demo weather data is served; the farmer can still view the last cached advisory from history.
  - Advisory history is surfaced as a tab on the main weather page instead of a separate route, keeping navigation simple for the farmer. The tab order is Advisory → Forecast → History, matching the farmer's natural reading flow.
  - The weather page's empty state for farmers with no registered farms uses an inline register-farm form, reducing friction by capturing farm details without leaving the page.
  - The farm selector is placed at the top of the weather page, above the advisory content.
  - Current weather conditions are shown only on the weather page, not on the dashboard.
  - The alert banner appears on both the dashboard and the weather page.
  - Advisory history detail opens in a modal popup from the history tab, preserving the farmer's place in the list.
  - The weather page uses a two-column layout on desktop (advisory left, forecast right) and collapses to a single column on mobile.
  - Farm switching on the weather page uses client-side switching without a full page reload.
  - Weather page tabs are client-side tabs within the same page (Advisory, Forecast, History), not separate routes.
  - Alert dismiss is permanent within the 6-hour deduplication window; dismissed alerts do not reappear until a new alert of the same type is generated.
  - The history tab includes filters for severity and farm, plus a Load more button for pagination.
  - A manual Refresh button is available on the weather page to re-fetch the latest forecast and regenerate advice.
  - The selected farm is persisted via the URL query parameter (`?farm=<id>`), with the most recent farm as the fallback default.
  - The history tab sorts advisories newest-first and includes filters for severity and farm.
  - The alert banner appears on both the dashboard and the weather page.
  - The weather page uses dynamic SEO metadata including farm name and location when available.
  - Offline behavior shows cached forecast and advisory data with an offline indicator; the last saved advisory remains visible.
  - The alert banner has no dismiss button; alerts transition only between unread and read states, synced across dashboard and weather page.
  - The history tab shows all advisories by default with no filter applied, sorted newest first. Optional filters for severity and farm are available.
  - The weather page uses stale-while-revalidate loading: cached data is shown immediately, then refreshed in the background.
  - The dashboard includes a farm selector, consistent with the weather page.
  - AI-generated advice text is written in the farmer's selected locale, with English as the fallback.
  - The dashboard farm selector also uses the URL query parameter (`?farm=<id>`) for consistency.
  - History tab filters are persisted in URL query parameters for shareability and reload resilience.
  - The Advisory tab is the default active tab when the weather page opens.
  - Dashboard and weather page show the same alerts with synced read/unread state.
  - The Refresh button fetches fresh forecast data without clearing the existing cache.
  - Scroll position is preserved per tab when switching between Advisory, Forecast, and History.
  - History detail modals do not update the URL.
  - An optional weather widget may appear on the dashboard, following existing dashboard patterns.
  - The dashboard shows an unread alert count badge alongside the alert banner.
  - The weather page loading state follows the existing app pattern: server components fetch and render data directly without explicit skeletons or spinners. Stale-while-revalidate is achieved by serving cached data first, then refreshing in the background.
  - Advisory history is surfaced as a tab on the main weather page instead of a separate route, keeping navigation simple for the farmer.
 - Completion of translation catalogs for `ps`, `sd`, `skr`, `bal`, and `hno` is tracked as an implementation task, not a spec change.

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
│   ├── weather/               # New: weather advisory page with inline history tab
│   │   ├── page.tsx           # Main advisory + 7-day forecast + history tab (client-side tabs)
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
│   ├── FarmSelector.tsx       # Shared: weather page + dashboard
│   ├── ForecastList.tsx
│   ├── HistoryList.tsx        # History list with filters + Load more
│   ├── WeatherHistoryTab.tsx  # Tabbed history view with modal detail
│   └── WeatherPageShell.tsx   # Client-side tab shell
├── shell/                     # Existing app shell components
│   ├── page-header.tsx
│   └── ...
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
└── 0008_weather_advisory.sql  # farms extensions + weather_advisories + weather_alerts (+ acres column)
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
