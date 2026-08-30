# Research: Crop Recommendation Engine

**Feature**: 003-crop-recommendation
**Date**: 2026-08-30
**Status**: Complete

## Research Tasks

### 1. Soil Health Data Source

**Decision**: Start with a curated, **static district-to-soil-profile lookup table** (seeded into Postgres) for the hackathon demo. The Soil Health Card API is flagged as a future integration once its public endpoint availability is confirmed.

**Rationale**: The Government of Pakistan's Soil Health Card programme does not expose a documented, publicly-available REST endpoint as of the research date. Building against an undocumented API risks demo-day failure. A curated lookup — district → dominant soil type, pH range, organic-matter band — is auditable, deterministic, and satisfies FR-005 when labelled clearly ("regional soil profile" vs "your field's soil").

**Alternatives considered**:
- Live Soil Health Card API: rejected — no documented public endpoint; integration would be speculative.
- Farmer-uploaded soil test PDF: rejected — out of scope per hackathon build order, adds OCR complexity.
- No soil input at all: rejected — violates FR-001 (soil type is required).

**Data source for lookup**: Published PARC / provincial agriculture department soil-survey reports (secondary sources). Districts covered in demo: ~10–15 representative districts across Punjab, Sindh, KP, and Balochistan.

### 2. Crop Recommendation Model Approach

**Decision**: **Weighted multi-criteria scoring engine** implemented in TypeScript (`lib/crops/scoring.ts`). NOT scikit-learn / XGBoost as originally suggested by the user.

**Rationale**:
- Stack discipline (constitution Principle IV): Next.js full-stack, TypeScript strict mode. Python ML libraries require a separate runtime or serverless function, adding a deployment dependency the constitution blocks without approval.
- Auditability: A weighted scoring function is transparent — every recommendation reason can be traced to the contributing sub-scores. This supports FR-008 ("revenue estimate clearly labelled with assumptions") and FR-017 ("plain-language explanation").
- Demo credibility: Top-3 recommendations from a well-tuned scoring model are indistinguishable in output quality from an ML model for the demo audience.
- Performance: SC-001 requires 3 recommendations in under 15 seconds; a scoring engine over a 12-crop catalogue returns in <50 ms.

**Scoring dimensions** (per candidate crop):
- **Suitability** (soil type match, pH range, irrigation fit) — weight `w_suitability`
- **Weather fit** (seasonal temperature and rainfall windows vs current forecast) — weight `w_weather`
- **Profitability** (market price trend × typical yield × budget-bracket alignment) — weight `w_profit`
- **Risk** (price volatility, pest pressure for current season, input cost) — weight `w_risk` (subtracted / inverted)
- **Sustainability** (rotation fit, nitrogen-fixing, water use) — weight `w_sustain`

Final score = Σ(w_i × normalised_i) with weights tuned on the demo catalogue so that output agrees with agronomist-judged "top 3" for 3–4 representative scenarios (wheat-after-cotton in Punjab, rice-after-wheat in Sindh, maize-after-potato in KP, mixed vegetables in peri-urban).

**Alternatives considered**:
- Scikit-learn / XGBoost (user's original suggestion): rejected — requires Python runtime, training dataset, approval for new stack, and opaque explanation of results.
- LLM-ranked recommendations (Groq / OpenAI): rejected — violates SC-001 (latency), cost, non-determinism, and constitution's "no invented metrics" principle.
- Pure rule-based lookup (crop → if soil=loamy then wheat): rejected — too rigid; cannot produce meaningful top-3 ranking across diverse inputs.

### 3. Weather Data Reuse

**Decision**: Reuse the **OpenWeatherMap** integration built for `001-weather-advisory`.

**Rationale**: Constitution Principle IV (reuse before adding). The weather advisory feature already has `lib/weather/` for fetching and caching forecasts. The crop recommendation engine imports the same module. No new dependency, no new env var.

**Integration point**: `lib/weather/forecast.ts` (or equivalent) exposes `getForecastForLocation(lat, lon)` returning current + 5-day forecast. Crop scoring consumes seasonal aggregates (avg temp, total rainfall in next 30 days) derived from the same forecast.

### 4. Market Price Data Reuse

**Decision**: Consume **mandi price data** from the in-progress `002-mandi-price-tracker` feature (Feature #4).

**Rationale**: Same reuse principle. The mandi feature has `lib/prices/` with market price ingestion, forecasting, and per-crop price series. Crop recommendation consumes:
- Recent price trend (up / stable / down) per crop
- Price volatility (stddev over last N weeks) — feeds the risk sub-score
- Typical mandi price band — feeds the profitability sub-score

**Contract**: Read-only access to `lib/prices/api-types.ts` types and the mandi-price tables. The crop recommendation feature does NOT write to mandi tables.

**Fallback for demo**: If mandi feature is not yet merged when crop recommendation builds, seed a static price-trend table (`crop_price_trends`) with representative values for the 10–12 demo crops. The real integration replaces the static source in a later task.

### 5. Crop Catalogue Storage

**Decision**: **Postgres table `crops`** seeded via migration, plus a `crop_soil_compatibility` junction table.

**Rationale**:
- Catalogue is reference data that must be queryable (filter by season, soil compatibility, irrigation needs) — flat files would be awkward.
- Admin-editable later (consistent with constitution's admin-editable translation pattern).
- Seeded once via migration (`db/migrations/0009_crop_catalogue.sql`); updates via future migrations.

**Columns (sketch)**:
- `crops`: id, name_en, name_ur, category (staple/cash/pulse/vegetable), typical_yield_per_acre, growing_duration_days, season_windows (array of the 6 seasons), water_requirement_level, labour_cost_level, market_risk_baseline.
- `crop_soil_compatibility`: crop_id, soil_type_id, suitability_score, ph_min, ph_max, notes.
- `crop_rotation_rules`: previous_crop_id, next_crop_id, benefit, reason_key (i18n).

### 6. Budget Brackets as Filters

**Decision**: 4 labelled brackets — **Low / Medium / High / Very High** — each mapping to a PKR range per-acre that the scoring engine uses as a capital-availability filter.

**Rationale**:
- The budget input is NOT an exact amount (per clarified spec); it's a bracket.
- Each crop has a typical per-acre capital requirement (seed + fertiliser + labour + irrigation). Crops whose requirement exceeds the farmer's bracket are filtered out before scoring; crops within the bracket score full on the "budget fit" dimension.

**Concrete brackets (demo-tuned, adjustable)**:
- Low: up to PKR 25,000/acre
- Medium: PKR 25,000–60,000/acre
- High: PKR 60,000–120,000/acre
- Very High: over PKR 120,000/acre

Bracket labels are i18n keys (`app.crops.budget.*`) translated into all 8 locales.

### 7. Soil Type Taxonomy

**Decision**: **8 plain-language soil types** with local-language aliases: sandy, sandy-loam, loamy, clay-loam, clay, silty, saline, rocky.

**Rationale**:
- Matches the clarified spec (6–10 types, Pakistan-relevant).
- 8 is enough to cover the major Pakistani soil families while keeping the dropdown tractable on mobile.
- Each soil type gets a canonical id and 8 translated labels (one per locale) via the `translations` table.

### 8. Uniqueness & Season Model

**Decision**: **`(farm_id, season, year)`** is the uniqueness key for `crop_recommendation_requests`, where `season` is an enum of the 6 values (summer, winter, autumn, spring, rainy, windy).

**Rationale**: Implements FR-013 directly. Season is stored as a Postgres enum type for type safety. Year is Gregorian calendar year of the recommendation's target season.

### 9. Recommendation Engine Flow

**Decision**: Single server-side function `recommendCrops(input)` in `lib/crops/engine.ts`, called from the route handler.

**Flow**:
1. Validate input (Zod).
2. Check uniqueness — if `(farm_id, season, year)` already exists and not `regenerate=true`, return the stored recommendation.
3. Fetch weather forecast for farm location (reuse `lib/weather/`).
4. Fetch market price trends (reuse `lib/prices/` or static fallback).
5. Look up district soil profile if farmer selected "Not sure / Other" soil type; otherwise use the farmer's declared soil type.
6. Query the crop catalogue: filter to crops whose `season_windows` include the target season AND whose capital requirement fits the budget bracket.
7. Score each candidate crop (5 dimensions × weights).
8. Sort by final score, take top 3.
9. Generate plain-language reason for each (template-based, i18n-keyed).
10. Persist the request + 3 recommendations + confidence metadata.
11. Return to client.

**Degradation (FR-018)**:
- Weather unavailable → skip weather-fit dimension, re-normalise weights, flag confidence as reduced.
- Market data unavailable → skip profitability dimension, flag revenue estimate as unreliable (FR-008 label).
- Soil data unavailable (regional lookup failed) → use farmer's declared soil type only; if that was "Other", flag as "based on regional default".

### 10. Comparison Chart

**Decision**: Use the **same charting approach as the mandi price tracker's `prediction-chart.tsx`** — a lightweight React chart component using an existing approved library (likely `recharts` or similar; verify against mandi feature's choice).

**Rationale**: Constitution Principle IV — reuse before adding. If mandi has already approved a charting library, use it; if not, propose one and seek approval per the new-dependency rule.

**Chart shape**: Horizontal bar chart comparing expected revenue per acre for the 3 crops, with error bars / ranges reflecting confidence.

### 11. Rotation Suggestion Logic

**Decision**: **Lookup-based rotation rules** in `crop_rotation_rules` table, not ML-predicted sequences.

**Rationale**:
- Agronomic rotation science is well-established for Pakistani crops (wheat→mung→cotton, rice→wheat→fallow, etc.).
- Deterministic lookup is auditable and translates cleanly.
- ML-predicted rotations would add complexity without better output for the demo.

**Logic**:
- If farm has past crop history → exclude crops from the rotation list that match the last planted crop in consecutive seasons.
- If no history → fall back to generic rotation sequence for the recommended crop, labelled "generic advice".

### 12. Translation Strategy

**Decision**: Reuse the **existing catalog → DB sync pattern** with `app.crops.*` namespaced keys.

**Implementation**:
1. Add all crop-recommendation UI keys to `catalog/en.ts` under `app.crops.*`.
2. Add the 8 soil-type labels, 4 budget-bracket labels, and crop names to the same catalog under `app.crops.soil.*`, `app.crops.budget.*`, `app.crops.catalogue.*`.
3. Draft translations in the 7 non-English catalog files.
4. Run `npm run sync:translations` to populate the `translations` table.
5. Create `getCropsBundle()` in `lib/i18n/server.ts` following the `getWeatherBundle()` pattern.

**Coverage gate**: All 8 locales must have translated values for every `app.crops.*` key before merge. RTL layout for Urdu / Pashto must render mirrored correctly (FR-016).

## Open Risks

- Soil Health Card API: when it becomes publicly available, it should replace the static district lookup. Migration is non-breaking (same schema, different source).
- Mandi price tracker dependency: until Feature #4 is merged, crop recommendation uses static price-trend seed data. Integration task must be scheduled post-merge.
- Scoring weights are tuned on the demo catalogue; re-tuning will be needed when the catalogue grows past the demo scope.
- Revenue-per-acre projections are inherently uncertain — UI must make "projection, not guarantee" explicit per constitution Principle VI (UI honesty).

## Dependencies Requiring Approval

| Package | Purpose | Weight |
|---|---|---|
| Charting library (verify mandi choice) | Revenue comparison chart (FR-010) | Medium — verify if mandi already approved one |

All other functionality uses existing approved libraries + Postgres + TypeScript.
