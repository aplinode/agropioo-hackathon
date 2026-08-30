# Feature Specification: Crop Recommendation Engine

**Feature Branch**: `003-crop-recommendation`
**Created**: 2026-08-30
**Status**: Draft
**Input**: User description: "Feature #6: Crop Recommendation Engine — Farmers often plant the same crop every year without considering market demand, soil depletion, or climate shifts — leading to low profits and soil degradation. Based on soil health data, current weather patterns, market demand forecasts, and historical yields, AI recommends the most profitable crop to plant this season with reasoning."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Farmer gets personalized crop recommendations (Priority: P1)

A logged-in farmer with an existing farm record opens the Crop Recommendation page. They confirm their farm location, select soil type and irrigation availability, and enter their approximate budget for the upcoming season. The system combines these inputs with current weather forecasts, market price trends, and soil health data for their region, then returns a ranked list of the top 3 most suitable crops to plant. Each recommendation includes the expected revenue per acre, key risks, and a plain-language explanation of why it was recommended. The farmer can tap any recommendation to see a full breakdown and save the recommendation to their farm plan.

**Why this priority**: This is the core value promise of the feature — helping a farmer pick a more profitable, sustainable crop. Without this flow, the feature does not exist.

**Independent Test**: Can be fully tested by creating a farm record, entering farm inputs, receiving recommendations, and saving one. Delivers the primary value (better crop selection) on its own.

**Acceptance Scenarios**:

1. **Given** a logged-in farmer with at least one farm record, **When** they open the Crop Recommendation page, **Then** their farm location is pre-filled from the selected farm record and they are prompted for soil type, irrigation availability, and budget.
2. **Given** the farmer has entered all required inputs, **When** they submit the recommendation request, **Then** the system returns exactly 3 ranked crop recommendations within a reasonable wait time.
3. **Given** a list of 3 recommendations, **When** the farmer views a recommendation, **Then** each recommendation displays: crop name, expected revenue per acre, a plain-language reason for the recommendation, and key risk factors.
4. **Given** a recommendation is displayed, **When** they tap "Save to farm plan", **Then** the recommendation is attached to the selected farm record and visible from the farm records page.
5. **Given** the farmer has previously received recommendations for a farm in a particular (season, year) pair, **When** they return to the recommendation page for the same farm and same (season, year), **Then** they are informed a recommendation already exists for this season and can choose to view it or regenerate.

---

### User Story 2 — Farmer compares recommended crops side-by-side (Priority: P2)

After receiving the top 3 recommendations, the farmer wants to compare them before deciding. They open a comparison view that places the three crops side-by-side across the dimensions that matter: expected revenue, water requirement, growing duration, market risk, soil impact, and labour cost. A simple bar chart visualises the revenue comparison so that even a farmer with low numeracy can see which option pays best.

**Why this priority**: Comparison is what turns a suggestion into a decision. Without it, farmers may fall back to habit and ignore the recommendations.

**Independent Test**: Can be tested by generating recommendations and then opening the comparison view; delivers informed decision-making on its own.

**Acceptance Scenarios**:

1. **Given** 3 crop recommendations exist for a farm, **When** the farmer taps "Compare crops", **Then** a side-by-side comparison view is shown with all 3 crops.
2. **Given** the comparison view, **When** it renders, **Then** each crop is shown with: expected revenue per acre, growing duration, water requirement, market risk level, soil impact, and estimated labour cost.
3. **Given** the comparison view, **When** it renders, **Then** a revenue comparison chart is displayed using honest, real data (no invented or aspirational projections presented as fact).
4. **Given** the comparison view, **When** the farmer selects one crop from the comparison, **Then** that crop becomes the selected recommendation and can be saved to the farm plan.

---

### User Story 3 — Farmer receives crop rotation advice for long-term soil health (Priority: P3)

After selecting a crop for the current season, the farmer is shown a suggested crop rotation plan for the next 2–3 seasons. The plan explains which crops to plant in sequence and why, focusing on maintaining soil fertility, breaking pest cycles, and diversifying income. The rotation advice references the farmer's own field history when available.

**Why this priority**: Rotation advice delivers long-term value (sustainability, soil health) but is secondary to the immediate decision of "what to plant this season". It builds trust and retention.

**Independent Test**: Can be tested by saving a crop recommendation and viewing the rotation suggestions that follow; delivers standalone sustainability guidance.

**Acceptance Scenarios**:

1. **Given** a farmer has saved a crop recommendation for the current season, **When** they view the saved recommendation, **Then** a rotation suggestion section is shown listing recommended crops for the next 2–3 seasons.
2. **Given** the rotation suggestion, **When** it renders, **Then** each suggested next-season crop includes a plain-language reason (e.g., "fixes nitrogen after wheat", "breaks pest cycle of cotton").
3. **Given** the farm has past crop history recorded, **When** rotation suggestions are generated, **Then** the suggestions take past planted crops into account and avoid repeating the same crop in consecutive seasons.
4. **Given** the farm has no past crop history, **When** rotation suggestions are generated, **Then** the system provides generic rotation advice based on the current recommended crop and clearly labels it as generic.

---

### Edge Cases

- What happens when the farmer's location is in a region where no soil health data is available? The system must inform the farmer clearly and still provide recommendations based on weather + market data only, labelled with reduced confidence.
- What happens when market price data for a recommended crop is unavailable or stale? The system must show the recommendation but flag the revenue estimate as unreliable and state the data gap.
- What happens when the farmer selects a budget bracket that is too low to support any viable commercial crop on their farm size? The system must show a clear warning naming the lowest viable bracket for that farm before producing recommendations, and offer to switch to it.
- What happens when the weather forecast API is unavailable at request time? The system must inform the farmer the recommendation cannot be completed right now and offer to retry, rather than silently producing lower-quality results.
- What happens when the farmer's farm is outside Pakistan? The feature is scoped to Pakistani crops, soils, and markets; the system must clearly state that recommendations are only available for farms in Pakistan.
- What happens when the farmer tries to get a second recommendation for the same farm in the same (season, year)? The system must surface the existing recommendation and offer to regenerate, rather than creating duplicate records silently.
- What happens when a farmer's soil does not match any of the 6–10 predefined soil types? The system must offer a "Not sure / Other" option that falls back to a regional soil-profile default derived from the farm's location, with a clear disclosure that the recommendation is based on the regional default rather than the farmer's own soil.
- What happens when a recommended crop is unsuitable for the farmer's stated irrigation level (e.g., water-intensive rice for a rainfed farm)? The system must either exclude it from recommendations or flag it with a clear mismatch warning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept farmer inputs: farm selection (from existing farm records), **soil type (from a predefined Pakistan-relevant list of 6–10 types)**, irrigation availability (rainfed / canal / tubewell / mixed), and a **predefined season-budget bracket** (one of 4–5 labelled PKR ranges shown to the farmer).
- **FR-002**: System MUST pre-fill the farm location from the farmer's selected farm record — farmers MUST NOT have to type their location manually.
- **FR-003**: System MUST retrieve and use current weather forecasts for the farm's location as an input to the recommendation.
- **FR-004**: System MUST retrieve and use recent market price trends for candidate crops as an input to the recommendation.
- **FR-005**: System MUST retrieve and use soil health data for the farm's region when available, and clearly disclose when it is not available.
- **FR-006**: System MUST produce exactly 3 ranked crop recommendations for the submitted inputs.
- **FR-007**: Each recommendation MUST include: crop name, expected revenue per acre, plain-language reason for the recommendation, key risks, and water requirement.
- **FR-008**: Each revenue estimate MUST be clearly labelled with its assumptions (data sources used, data freshness) so farmers can judge confidence — UI honesty is mandatory.
- **FR-009**: System MUST provide a side-by-side comparison view for the 3 recommended crops covering: revenue, growing duration, water requirement, market risk, soil impact, and labour cost.
- **FR-010**: System MUST provide a revenue comparison chart for the 3 recommended crops using real data only — no invented metrics or aspirational projections rendered as fact.
- **FR-011**: Farmer MUST be able to save one recommended crop to their farm plan for the current **(season, year)** pair.
- **FR-012**: System MUST provide a crop rotation suggestion for the next 2–3 of the 6 recognised seasons (summer, winter, autumn, spring, rainy, windy) after a crop is saved, referencing the farm's past crop history when available.
- **FR-013**: System MUST prevent duplicate recommendations for the same **(farm, season, year)** combination by surfacing the existing recommendation with an option to regenerate. A "season" is one of: summer, winter, autumn, spring, rainy, windy.
- **FR-014**: System MUST validate all inputs against their predefined enumerations (soil-type list, irrigation type, budget bracket) and reject invalid combinations with clear error messages. Soil-type labels MUST be translatable and support local-language aliases across all 8 supported locales.
- **FR-015**: System MUST clearly state when the farm is outside Pakistan and refuse to generate a recommendation, since the feature is scoped to Pakistani crops and markets.
- **FR-016**: Recommendation page MUST be accessible in all supported languages and render correctly in RTL layouts for Urdu and Pashto.
- **FR-017**: Recommendation output MUST include a plain-language explanation readable by a farmer with no technical background — farmer-first copy is required.
- **FR-018**: System MUST gracefully handle missing upstream data (weather, market, soil) by either degrading with clear disclosure or refusing to recommend — never by producing silent low-quality output.

### Key Entities

- **Crop Recommendation Request**: A farmer's submission of farm + soil + irrigation + **budget-bracket** inputs that triggers the recommendation engine. Tied to one farm record and one **(season, year)** pair.
- **Crop Recommendation**: A ranked output for a single crop — includes crop name, expected revenue, reason, risks, water requirement, and data-confidence metadata. Three of these are returned per request.
- **Crop Comparison**: A derived view over the 3 recommendations in a single response, used for side-by-side evaluation.
- **Farm Plan Entry**: A saved recommendation attached to a farm record for a specific **(season, year)** pair, where season is one of summer, winter, autumn, spring, rainy, or windy. One active entry per farm per (season, year).
- **Crop Rotation Suggestion**: A sequenced list of recommended crops for the next 2–3 of the 6 recognised seasons, derived from the saved crop and the farm's planting history.
- **Crop Catalogue**: The reference dataset of commercially-traded Pakistani crops (staples, cash crops, pulses, vegetables) with their agronomic profiles used by the recommendation engine. Representative, mandi-recognisable, and not locked to a single province.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A farmer can receive a complete set of 3 crop recommendations in under 15 seconds from submitting valid inputs.
- **SC-002**: 80% of farmers who receive recommendations open the comparison view or tap into a recommendation detail within the same session.
- **SC-003**: 40% of farmers who receive recommendations save at least one recommendation to their farm plan.
- **SC-004**: Farmers using the recommendation feature plant a different crop than their previous season in at least 50% of saved recommendations (rotation adoption signal).
- **SC-005**: 90% of recommendation responses include full weather + market + soil data; the remaining 10% clearly disclose which data source was missing.
- **SC-006**: Farmers report that the recommendation explanation is understandable on first read in at least 85% of post-session feedback responses (when feedback is collected).
- **SC-007**: Recommendation feature works end-to-end on a 320px-wide mobile screen with no horizontal scroll, meeting the project's outdoor-mobile accessibility baseline.

## Clarifications

### Session 2026-08-30

- Q: What season definition & uniqueness scope should govern crop recommendations? → A: **6-season model** — summer, winter, autumn, spring, rainy, windy. Uniqueness key for recommendations is **(farm, season, year)**. Rotation suggestions span the next 2–3 seasons in this 6-season cycle.
- Q: What crop catalogue scope should the hackathon demo cover? → A: **Commercial/market crops grown across Pakistan** — representative set of widely-traded Pakistani crops (e.g., wheat, rice, maize, sugarcane, cotton, chickpea, mustard, potato, onion, tomato, mung bean). Catalogue must be recognisable to a farmer shopping a typical mandi; not region-locked to one province.
- Q: How should the farmer provide the season budget input? → A: **Predefined budget brackets** — farmer picks one of 4–5 labelled PKR budget brackets (e.g., low / medium / high / very high, with concrete PKR ranges shown). Exact numbers are not collected.
- Q: What soil-type taxonomy should the input and validation use? → A: **Pakistan-relevant plain-language list** — 6–10 soil types commonly named in Pakistani farming (e.g., loamy, clay, sandy, sandy-loam, clay-loam, silty, saline, rocky), each with local-language aliases for translation. Full scientific taxonomy is out of scope.

## Assumptions

- The farmer already has an account, is logged in, and has at least one farm record. Onboarding, authentication, and farm record creation are out of scope for this feature.
- Weather data is available via the same source used by the Weather Advisory feature (Feature #3).
- Market price data is available via the same source used by the Mandi Price Tracker feature (Feature #4).
- Soil health data is sourced from a government-provided soil health dataset (Pakistan Soil Health Card programme or equivalent). Actual API availability and reliability will be confirmed during research.
- A curated crop catalogue aligned with Pakistani crops and practices will be assembled from PARC / public sources as part of this feature's data work. The demo catalogue covers **commercially-traded Pakistani crops** (representative set across staples, cash crops, pulses, and vegetables — e.g., wheat, rice, maize, sugarcane, cotton, chickpea, mustard, potato, onion, tomato, mung bean), recognisable at a typical mandi and not locked to a single province.
- The hackathon demo will cover the happy path for one representative region and a catalogue of commercially-traded Pakistani crops (~10–15, spanning staples, cash crops, pulses, and vegetables); full nationwide coverage is post-demo scope.
- Revenue estimates are projections, not guarantees — UI copy must make this explicit per the "UI honesty" constitution principle.
- Voice input/output for the recommendation flow is out of scope; text chat and form input only.

## Precision & Resolved Gaps (Checklist Gate)

This section closes the gaps flagged by the requirements/quality-gate checklists. Each CHK reference maps to `checklists/requirements.md` and `checklists/quality-gate.md`.

### UI states & loading (CHK001, CHK002, CHK011)
- The recommendation form shows a deterministic loading state ("Calculating your recommendations…", skeleton + spinner) while the engine runs; the wait window is bounded by **SC-001's 15 seconds**. No silent wait.
- Each degraded upstream source gets a **distinct** disclosure banner: `weather-missing` (recommendation cannot complete → 503 + retry offer, per FR-018), `market-missing` (recommendation shown but revenue flagged `unreliable`), `soil-missing` (recommendation shown but soil confidence reduced). Copy is per-source, not a generic message.

### Regenerate flow (CHK003, CHK006, CHK056)
- Regenerate is **destructive**: a confirm dialog ("This replaces your current recommendation and its saved plan") precedes DELETE of the request. The cascade removes its 3 recommendations, the related `farm_plan_entries`, and `crop_rotation_suggestions` (FKs `ON DELETE CASCADE`). A new request is then created. Rotation suggestions are recomputed at save-time, so they are regenerated with the new recommendation.

### Zero-candidate & budget-too-low (CHK004, CHK015, CHK033, CHK041)
- The engine filters candidates by season window + budget bracket. If **zero** crops pass, it returns `422` with code `no_candidates` and names the `lowest_viable_bracket`.
- `lowest_viable_bracket` is **computed**, not per-farm-size: the lowest bracket (low < medium < high < very_high) that admits ≥ 1 candidate crop from the catalogue for the chosen season. It is a fixed label from the 4-bracket set.
- UI shows this warning **before** producing recommendations when the selected bracket filters out all crops (T020 lowest-viable-bracket warning).

### History, save collision, multi-farm (CHK005, CHK010, CHK037)
- Past (season, year) recommendations are browsable from the farm records page via `GET /api/crops` (T014/T018).
- `POST /api/crops/save` **upserts** keyed on `(farm_id, target_season, target_year)`; an existing entry is silently replaced (delete + insert). The client shows a one-line "Replaced your previous plan for this season" note.
- Recommendations are generated **one farm at a time** via the farm selector; a "recommend for all my farms" batch flow is deferred.

### Concurrent requests (CHK007, CHK022, CHK024)
- The DB `UNIQUE (farm_id, target_season, target_year)` constraint is the authority. The handler checks existence first; on a rare concurrent double-submit, the second insert hits the UNIQUE constraint and is returned as `409 recommendation_exists`. No duplicate rows can ever exist.

### Comparison chart a11y & failure (CHK008, CHK006-quality, CHK037-quality, CHK036)
- The revenue chart exposes `role="img"` + `aria-label` summarising each crop's revenue, is keyboard-focusable, and respects `prefers-reduced-motion`.
- On missing/extreme data the chart falls back to a plain HTML table + text list; the page never crashes.

### Catalogue admin UI (CHK009, CHK010-quality)
- Admin-editing of the crop catalogue is **explicitly deferred** to post-demo scope. Demo catalogue is seeded via migration and updated by future migrations only.

### Quantified thresholds & taxonomies
- **"Recent" market window (CHK012, CHK017-quality)**: trend uses the last **4 weeks (28 days)**; volatility uses the last **8 weeks**.
- **Stale market data (CHK033-quality, CHK032)**: a price point older than **14 days** is `degraded` (not missing) — `market_confidence='degraded'`, `revenue_confidence` lowered; fully missing → `unreliable`.
- **Revenue confidence bands (CHK013, CHK012-quality)** criteria:
  - `high`: all three sources full AND price volatility < 0.15.
  - `medium`: all sources present, or exactly one degraded but still usable; volatility 0.15–0.30.
  - `low`: one source missing/degraded; volatility 0.30–0.40.
  - `unreliable`: market missing OR volatility > 0.40.
- **Risk taxonomy (CHK019, CHK015-quality)**: fixed set, each an i18n key in `risk_factors` — `price_volatility`, `pest_pressure`, `weather`, `water_stress`, `input_cost`.
- **Generic rotation label (CHK018, CHK018-quality)**: translation key `app.crops.rotation.generic` → "Generic advice — based on common practice, not your field history."
- **Irrigation mismatch (CHK014, CHK036-quality)**: the crop **still appears** in the top-3 with a clear mismatch warning banner and a reduced suitability score; it is never silently excluded.
- **Soil impact in comparison (CHK021, CHK020-quality)**: not a stored field — the comparison view derives `soil_impact` from `crops.category` (`pulse` → "improves soil / nitrogen-fixing"; `cash` → "neutral to depleting"; others → "neutral"). Consistent with FR-009.
- **Plain-language level (CHK054)**: farmer-first copy targeting roughly grade-5 reading level; implementer judgement within the farmer-first principle.

### Consistency reconciliations
- **Soil-type count (CHK020, CHK019-quality)**: the spec's "6–10" is an intentional range; the canonical taxonomy is **8 named types + `other` = 9 enum values** (research §7, data-model `soil_type_enum`). No conflict.
- **Water requirement (CHK025, CHK025-quality)**: `crops.water_requirement_level` ('low'/'medium'/'high') is the single concept used by both FR-007 (recommendation) and FR-009 (comparison). Consistent.
- **Season ↔ calendar mapping (CHK022, CHK021-quality)**: Pakistan agricultural seasons mapped to months (demo calendar):
  - `winter` (rabi): Nov–Feb · `summer` (zaid): Mar–Jun · `rainy` (kharif/monsoon): Jun–Sep · `autumn`: Sep–Oct · `spring`: Feb–Mar · `windy` (lu winds): May–Jun.
  - A farmer may request any season within `target_year` range (current −1 .. +2), including one already started.
- **data_sources_used vs confidence (CHK055)**: `weather_confidence` / `market_confidence` / `soil_confidence` are independent per-source assessments; `data_sources_used` is derived from them (any source whose confidence ≠ `missing`).

### Outside-Pakistan geofence (CHK039, CHK035-quality)
- Bounding box: latitude **23.5–37.0**, longitude **60.5–77.0**. `recommendCrops()` rejects coordinates outside this box with `422` code `outside_pakistan` before scoring (T012a).

### "Other" soil lookup failure (CHK040, CHK031-quality)
- If the farmer picks `other` AND the district is absent from `soil_profiles`, fall back to a **national default** soil type (`loamy`) with explicit disclosure "Based on a national estimate, not your region."

### Weather partial vs total failure (CHK042, CHK034-quality)
- Partial weather (e.g., temperature present, rainfall absent) → `weather_confidence='degraded'`, `weather_fit` computed from available dimensions, recommendation still produced.
- Total weather failure with no cached advisory → `503 service_unavailable` + retry offer (FR-018).

### Success-criteria nature (CHK025-quality, CHK026, CHK027, CHK028, CHK029, CHK030, CHK029-quality, CHK031)
- **SC-001's 15s is end-to-end** (including network); server-side scoring target is < 100 ms (plan Technical Context).
- **SC-002, SC-003, SC-004, SC-005, SC-006 are aspirational targets**, not hard automated gates. SC-002/SC-004/SC-006 require analytics/feedback not in demo scope; they are measured post-demo via manual review / follow-up survey. SC-005 is verifiable from response `data_sources_used` metadata on every response.

### Cross-session & lifecycle (CHK032, CHK034, CHK035, CHK038, CHK043)
- Switching the selected farm mid-form **resets** the form state (client component).
- Deleting/archiving a farm cascades (FKs) to its requests, recommendations, plan entries, and rotation suggestions.
- Rotation uses the **most recent** past crop only (latest season/year); multiple history rows do not all influence the plan.
- No impossible budget×farm-size combinations; budget brackets are independent of farm size.

### Non-functional & security (CHK044, CHK045, CHK046, CHK047, CHK043-quality, CHK044-quality, CHK045-quality, CHK046-quality, CHK047-quality)
- `GET /api/crops/catalogue` target < 500 ms (small static reference set, cacheable).
- Recommendations retained for the account's lifetime; no purge in demo; removed only via farm cascade-delete.
- Rate limit `cropsIp` = 20/hr/IP (contract) also caps **per account** at 20/hr.
- `< 2 MB client JS delta` is a plan implementation budget, not a separate spec requirement (traceable to Technical Context).
- All inputs Zod-validated; uniform `{ error: { code, message } }` shape; outdoor-mobile a11y (contrast ≥ 4.5:1, touch ≥ 44×44px, no 320px scroll) — all per constitution.

### Dependencies & integration contracts (CHK048, CHK049, CHK050, CHK051, CHK052, CHK053, CHK049-quality, CHK048-quality, CHK050-quality, CHK051-quality, CHK052-quality, CHK053-quality)
- **Weather (Feature #3)**: reuse `getForecastForLocation(lat, lon)` returning `{ current, daily: [{ date, tempAvg, rainfall }] }` (research §3).
- **Mandi (Feature #4)**: static `crop_price_trends` shape (`crop_id, observed_at, price_per_maan_pkr, trend, volatility`) is the swap-in contract for live per-crop series; crop engine is read-only against it.
- **Soil Health Card**: research §1 **rejected** the live API (no documented public endpoint); static `soil_profiles` lookup is the decision, swappable later without schema change.
- **Charting library**: mandates verifying the mandi feature's approved choice; if none approved, `comparison-chart.tsx` falls back to pure-CSS bars (T025). Open approval item tracked in plan Risks.
- Cross-feature types imported from `lib/weather` / `lib/prices` api-types; the static fallback decouples the crop engine from upstream churn.

## Out of Scope

- Hardware-based soil sensing or satellite-derived soil analysis (satellite monitoring is a separate feature).
- Automatic planting, procurement, or marketplace transactions — this feature only recommends and records the decision.
- Expert / agronomist review of recommendations (expert role is out of scope for the demo).
- IVR phone mode, SMS alerts, or voice interaction for recommendations.
- Recommendations for farms outside Pakistan.
- Real-time price guarantees or forward-contracting based on the recommendation.
- Integration with insurance, credit, or subsidy schemes.
- Dark mode UI.

## Dependencies

- **Weather Advisory feature (Feature #3)** — provides the weather forecast data source reused here.
- **Mandi Price Tracker feature (Feature #4)** — provides the market price trend data reused here.
- **Farm Records** — farm location and past crop history are read from existing farm records.
- **Authentication** — farmer must be logged in; no anonymous recommendations.
- **i18n / RTL infrastructure** — recommendation copy must flow through the translation system for all 8 supported locales.
- **Pakistan soil health dataset** — external data source whose availability and format must be confirmed during research.
- **Pakistani crop catalogue (PARC-aligned)** — reference data to be assembled before the recommendation engine can be built.
