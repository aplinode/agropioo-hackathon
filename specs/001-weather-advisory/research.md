# Research: Smart Weather Advisory

**Feature**: 002-weather-advisory  
**Date**: 2026-08-30  
**Status**: Complete

## Research Tasks

### 1. Weather Data Provider Integration

**Decision**: OpenWeatherMap API (Current Weather + 5 Day / 3 Hour Forecast + One Call 3.0)  
**Rationale**: Global coverage, generous free tier (60 calls/min, 1,000,000 calls/month), well-documented REST endpoints, stable versioning. Aligns with constitution's reuse discipline and avoids custom infrastructure.  
**Alternatives considered**: 
- Pakistan Meteorological Department feed: rejected due to uncertain API availability and lack of documented public endpoints.
- Mock/stub data only: rejected; spec requires real weather integration for demo credibility.

### 2. Advisory Generation Rules

**Decision**: Rule-based engine keyed on crop growth stage + weather thresholds, implemented in `lib/weather/advisory.ts`.  
**Rationale**: Deterministic, auditable, fast, and requires no external LLM dependency (which would require approval and add latency). Rules are defined as simple condition→recommendation mappings per growth stage.  
**Alternatives considered**:
- LLM-generated advice: rejected due to latency (violates SC-001), cost, and non-determinism for farmer-first clarity.
- Static lookup table per crop: rejected; too rigid for varying weather combinations.

**Growth stage logic**: Compute days from sowing date relative to known crop duration categories (e.g., wheat ~120 days, rice ~120 days, cotton ~160 days, maize ~100 days). Stages: seedling, vegetative, flowering, maturation, harvest-ready. Default to "generic" if crop not recognized.

### 3. Alert Rule Engine

**Decision**: Time-window scan over the next 3 hours of forecast data, with severity classification (high/medium/low).  
**Rationale**: Matches spec requirement for "within hours" alerts and SC-003's 15-minute detection target. Keeps computation lightweight and deterministic.  
**Rules**:
- Heavy rain: precipitation > 10mm in 3h → delay irrigation / protect harvested crops.
- Frost risk: temperature < 2°C → protect sensitive crops.
- Extreme heat: temperature > 40°C → increase irrigation, avoid field work midday.
- Disease-favoring: humidity > 80% AND temperature 20-30°C → preventive fungicide recommendation.

**Delivery**: Enqueue email via Nodemailer + SMTP (chosen library) and create in-app notification row. Retry email once on transient SMTP failure.

### 4. Multi-Farm Data Isolation

**Decision**: Every advisory and alert row carries `farm_id`; farmer sees one unified list filtered by owned farms.  
**Rationale**: Supports FR-010 without separate UI per farm except a selector. Query patterns stay simple and indexed.

### 5. Caching & Degradation

**Decision**: Cache the last generated advisory per farm in the database with `generated_at` timestamp. On provider failure, display cached advisory with a visible banner and suppress regeneration until data resumes.  
**Rationale**: Satisfies clarified edge case; avoids blank screens and keeps UI honest (constitution Principle VI).

### 6. Translation Strategy

**Decision**: Advisory text templates stored in the Neon `translations` table keyed by `key`, `locale`, and `feature = 'weather-advisory'`. Server-side lookup at generation time; client receives fully translated strings.  
**Rationale**: Constitution requires DB-backed translations, not hardcoded dictionaries. Existing infrastructure from other features can be reused.

## Open Risks

- OpenWeatherMap API key rotation and quota monitoring need operational runbook (out of scope for demo).
- Crop growth stage durations are simplified averages; local variety specifics are deferred to future enhancement.
- SMS delivery is out of scope per spec; email deliverability depends on SMTP provider warm-up.

## Translation Strategy

**Decision**: Use the existing catalog → DB sync pattern with `app.weather.*` namespaced keys.

**Rationale**: The project already has a mature translation infrastructure (`catalog/*.ts`, `scripts/sync-translations.mts`, `translations` table, `lib/i18n/server.ts`). Reusing it avoids new dependencies, ensures founder-editable strings without redeploy, and satisfies the constitution's DB-backed translation requirement.

**Implementation**:
1. Add all weather advisory UI keys to `catalog/en.ts` under `app.weather.*`.
2. Draft translations in the 7 non-English catalog files.
3. Run `npm run sync:translations` to populate the `translations` table.
4. Create `getWeatherBundle()` in `lib/i18n/server.ts` following the `getAdvisorBundle()` / `getDetectBundle()` pattern.
5. Client components receive strings as flat props; no hardcoded copy.

**Coverage gate**: All 8 locales must have translated values for every `app.weather.*` key before merge.
