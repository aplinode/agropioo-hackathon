# Quickstart: Smart Weather Advisory

**Feature**: 002-weather-advisory  
**Date**: 2026-08-30

## Prerequisites

- Node.js 18+ and npm/pnpm installed
- Neon Lakebase Postgres database URL configured in `.env.local`
- OpenWeatherMap API key configured as `OPENWEATHER_API_KEY`
- SMTP credentials configured as `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Cron secret configured as `ADVISOR_CRON_SECRET` for internal alert scanning

## Setup Steps

1. **Apply database migration**:
   ```bash
   npm run db:migrate
   ```
   This applies `scripts/migrations/0008_weather_advisory.sql`, adding columns to `farms` and creating `weather_advisories` and `weather_alerts`.

2. **Install dependencies** (if any new packages were added):
   ```bash
   npm install
   ```
   *Note: This feature uses only approved libraries (Next.js, Neon, Zod, Nodemailer, Jose, Bcryptjs). No new installs expected.*

3. **Environment variables**:
   Ensure `.env.local` includes:
   - `DATABASE_URL` — Neon connection string
   - `OPENWEATHER_API_KEY` — OpenWeatherMap API key
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — email delivery
   - `ADVISOR_CRON_SECRET` — secret for internal cron endpoint

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Verify manually**:
   - Navigate to `/advisor` while authenticated.
   - With no farm registered: see prompt to register a farm.
   - Register a farm with crop, sowing date, and location.
   - Confirm daily advisory appears with weather data and recommendation.
   - Confirm 7-day forecast tab shows advice per day.
   - Confirm alert banner appears when provider is unavailable (simulate by disabling network).
   - Confirm notification center shows alerts and email is sent (check SMTP logs).
   - Confirm advisory history page lists past days and detail view opens.

6. **Run lint and build**:
   ```bash
   npm run lint
   npm run build
   ```

## Architecture Notes

- Route Handlers in `app/api/advisor/` serve as the API layer.
- `lib/weather/openweather.ts` wraps OpenWeatherMap calls with caching and retry.
- `lib/weather/advisory.ts` contains rule-based advice generation keyed on growth stage + weather thresholds.
- `lib/weather/alerts.ts` scans the next 3 hours of forecast data for critical conditions.
- Advisory text templates live in the `translations` table under `feature = 'weather-advisory'`.
