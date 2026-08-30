# Requirements Quality & Release Gate Checklist: Crop Recommendation Engine

**Purpose**: Requirements Quality Unit Test Suite & Release Gate Checklist for Feature 003: Crop Recommendation Engine
**Created**: 2026-08-30
**Target Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md) | [contracts/route-handlers.md](../contracts/route-handlers.md)
**Audience**: Feature Author / Builder & PR Reviewer
**Evaluation Rigor**: Strict / Release Gate (Comprehensive Coverage)

---

## 1. Requirement Completeness & User Scenarios

- [ ] CHK001 - Are loading-state UI requirements defined for the recommendation generation flow during the up-to-15-second engine computation window? [Completeness, Spec §US-1 scenario 2, SC-001]
- [ ] CHK002 - Are error-state UI requirements specified for each degraded-data scenario (weather missing, market missing, soil missing) with distinct messaging per source? [Completeness, Spec §FR-018]
- [ ] CHK003 - Is the "regenerate" user interaction fully specified — confirmation prompt, old recommendation replacement behaviour, and rotation suggestion regeneration? [Completeness, Spec §FR-013, Edge Case §duplicate]
- [ ] CHK004 - Are requirements defined for the zero-candidate case where no crops pass the season + budget bracket filters? [Completeness, Edge Case §budget-too-low]
- [ ] CHK005 - Are requirements specified for the "Save to farm plan" action when a farm plan entry already exists for that (farm, season, year) — confirmation, silent replace, or explicit warning? [Completeness, Spec §FR-011, Contracts §POST /api/crops/save]
- [ ] CHK006 - Are accessibility requirements specified for the revenue comparison chart (FR-010), including screen-reader labelling and keyboard navigation? [Completeness, Spec §FR-010, SC-007]
- [ ] CHK007 - Are requirements defined for what happens to saved farm plan entries and rotation suggestions when the underlying recommendation is regenerated (deleted + recreated)? [Completeness, Data Model §State Transitions, Contracts §DELETE]
- [ ] CHK008 - Are requirements defined for displaying recommendation history — can a farmer browse past (season, year) recommendations from the farm records page? [Completeness, Spec §US-1 scenario 5]
- [ ] CHK009 - Are concurrent-request requirements specified — what happens if two recommendation requests arrive for the same (farm, season, year) nearly simultaneously? [Completeness, Data Model §11, Contracts §POST /api/crops]
- [ ] CHK010 - Are requirements defined for the crop catalogue admin-editing interface, or is this explicitly deferred to post-demo scope? [Completeness, Data Model §crops "admin-editable later"]

---

## 2. Requirement Clarity & Precision

- [ ] CHK011 - Is "reasonable wait time" in US-1 scenario 2 quantified or explicitly tied to SC-001's 15-second threshold? [Clarity, Spec §US-1 vs §SC-001]
- [ ] CHK012 - Are the revenue confidence bands (`high` / `medium` / `low` / `unreliable`) defined with explicit criteria for which band applies to a given estimate? [Clarity, Data Model §crop_recommendations.revenue_confidence]
- [ ] CHK013 - Are the scoring-engine sub-score weights (`w_suitability`, `w_weather`, `w_profit`, `w_risk`, `w_sustain`) specified as concrete values or ranges in the plan or research, not just named? [Clarity, Research §2, Plan §Summary]
- [ ] CHK014 - Is the budget-bracket "lowest viable bracket" for the too-low-budget edge case a computed value (per farm-size) or a fixed label? [Clarity, Spec §Edge Case §budget-too-low]
- [ ] CHK015 - Does "key risks" in FR-007 have a defined taxonomy — drawn from a fixed set (price volatility, pest pressure, weather, water) or free-form text? [Clarity, Spec §FR-007]
- [ ] CHK016 - Is "data freshness" (FR-008) defined in measurable units — seconds since last observation, date of last price point, or forecast issue time? [Clarity, Spec §FR-008]
- [ ] CHK017 - Is "recent market price trends" in FR-004 quantified with a specific time window (e.g., last 4 weeks, last quarter)? [Clarity, Spec §FR-004]
- [ ] CHK018 - Is "clearly labels it as generic" for rotation advice (US-3 scenario 4) specified with concrete UI language or a translation key? [Clarity, Spec §US-3 scenario 4]

---

## 3. Requirement Consistency & Alignment

- [ ] CHK019 - Are the soil-type counts consistent across artifacts — spec says "6–10 types", research says "8 plain-language types", data model enum has 9 values (includes `other`)? [Consistency, Spec §FR-001, Research §7, Data Model §soil_type_enum]
- [ ] CHK020 - Does the comparison view (FR-009) include soil impact when the recommendation output (FR-007) does not explicitly list it as a field? [Consistency, Spec §FR-007 vs §FR-009]
- [ ] CHK021 - Are season definitions consistent — spec lists 6 named seasons but the data model uses these as a Postgres enum with no date-range mapping; is the mapping from calendar months to seasons specified? [Consistency, Spec §Clarifications, Data Model §season_enum]
- [ ] CHK022 - Is the UNIQUE constraint on `crop_recommendation_requests (farm_id, target_season, target_year)` consistent with the contract's `regenerate=true` path that deletes and recreates — is there a race-condition window? [Consistency, Data Model §11, Contracts §POST /api/crops]
- [ ] CHK023 - Are the cascade-delete rules in the data model consistent with the contract's regeneration flow — does deleting a recommendation request cascade through farm_plan_entries and rotation_suggestions correctly? [Consistency, Data Model §State Transitions, Contracts §DELETE]
- [ ] CHK024 - Does the route contract's `target_year` validation (current year ± 1–2) align with the spec's intent for forward-looking vs historical recommendations? [Consistency, Contracts §POST /api/crops, Spec §FR-013]

---

## 4. Acceptance Criteria & Measurability

- [ ] CHK025 - Is SC-001's 15-second threshold an end-to-end measurement (including network latency) or server-side only, and is this distinction specified? [Measurability, Spec §SC-001]
- [ ] CHK026 - Can SC-002's "80% of farmers open the comparison view or tap into a recommendation detail" be measured without an analytics/tracking system — is a tracking requirement specified? [Measurability, Spec §SC-002]
- [ ] CHK027 - Can SC-004's "50% of saved recommendations result in planting a different crop" be measured, given that actual planting behaviour is not captured by the app? [Measurability, Spec §SC-004]
- [ ] CHK028 - Can SC-006's "85% find explanation understandable" be measured without a feedback-collection mechanism — is the feedback mechanism in scope or deferred? [Measurability, Spec §SC-006]
- [ ] CHK029 - Can SC-005's "90% of responses include full data" be verified from server logs or response metadata? [Measurability, Spec §SC-005]
- [ ] CHK030 - Are SC-002 through SC-006 aspirational targets or hard acceptance gates — is the distinction stated? [Measurability, Spec §Success Criteria]

---

## 5. Edge Case & Failure Mode Coverage

- [ ] CHK031 - Are requirements specified for the case where no soil health data is available for the region AND the regional soil-profile lookup also fails (district not in the lookup table)? [Edge Case, Spec §Edge Case §soil-unknown, Data Model §soil_profiles]
- [ ] CHK032 - Are requirements defined for stale (not missing, but outdated beyond a threshold) market price data — is this treated the same as "unavailable" or as a distinct degraded state? [Edge Case, Spec §Edge Case §stale-market-data]
- [ ] CHK033 - Is the budget-too-low edge case fully specified — does the system suggest increasing budget, offer alternatives, or simply refuse to recommend? [Edge Case, Spec §Edge Case §budget-too-low]
- [ ] CHK034 - Are requirements specified for complete weather API failure with retry offering, rather than silent low-quality output? [Edge Case, Spec §Edge Case §weather-unavailable]
- [ ] CHK035 - Is the "outside Pakistan" rejection (FR-015) specified with a concrete geofencing mechanism — bounding box, admin boundary, or coordinate check? [Edge Case, Spec §FR-015]
- [ ] CHK036 - Is the irrigation-mismatch edge case specified — does the crop still appear in the top-3 with a warning, or is it excluded entirely? [Edge Case, Spec §Edge Case §irrigation]
- [ ] CHK037 - Are requirements defined for the comparison chart rendering failure (zero data, extreme values) — is a fallback specified? [Edge Case, Spec §FR-010]

---

## 6. Localization & 8-Locale Translation Requirements

- [ ] CHK038 - Are database translation insertion requirements defined for all 8 Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) in Neon `translations` table before merge? [Completeness, Constitution §II, Plan §Phase 0 §12]
- [ ] CHK039 - Are right-to-left (RTL) mirrored layout requirements specified for Urdu (`ur`) and Pashto (`ps`) recommendation pages? [Completeness, Spec §FR-016, Constitution §II]
- [ ] CHK040 - Are translatable label requirements specified for soil-type dropdown (8 types), budget-bracket selector (4 brackets), and crop catalogue names across all 8 locales? [Completeness, Spec §FR-014, Data Model §Translation Keys]
- [ ] CHK041 - Are requirements specified for inserting new or updated translation keys for every UI change into the Neon database `translations` table via Neon MCP or `scripts/sync-translations.mts` before completing the task? [Completeness, Constitution §II, Data Model §Translation Keys]
- [ ] CHK042 - Are soil-type local-language alias requirements defined — does each of the 8 soil types have a named alias per locale, or only translated display labels? [Clarity, Spec §FR-014, Research §7]

---

## 7. Non-Functional, Security & Performance Requirements

- [ ] CHK043 - Are route handler input validation requirements specified using Zod for all query parameters and request bodies across all crop recommendation endpoints? [Security, Constitution §V, Contracts §all routes]
- [ ] CHK044 - Are uniform error shape requirements (`{ error: { code, message } }`) specified for all crop recommendation API error responses? [Consistency, Constitution §V, Contracts §Error Shape]
- [ ] CHK045 - Are outdoor-mobile accessibility requirements specified (contrast ≥ 4.5:1, touch targets ≥ 44×44px, no horizontal scroll at 320px) for the recommendation form, comparison view, and chart? [Accessibility, Constitution §VI, Spec §SC-007]
- [ ] CHK046 - Are recommendation generation performance requirements (<15 seconds end-to-end, scoring engine <100ms) quantified and testable? [Performance, Spec §SC-001, Plan §Technical Context]
- [ ] CHK047 - Are rate limiting requirements specified for POST `/api/crops` and POST `/api/crops/save` (20 requests per hour per IP) with documented thresholds? [Security, Contracts §Rate Limiting]

---

## 8. Dependencies, Database & Integration Contracts

- [ ] CHK048 - Is the Weather Advisory feature (Feature #3) data reuse contract specified — what function signature (`getForecastForLocation(lat, lon)`) does the crop engine consume? [Dependency, Spec §Dependencies, Research §3]
- [ ] CHK049 - Is the Mandi Price Tracker (Feature #4) fallback contract specified — what data shape does the static `crop_price_trends` table need to match for seamless swap to live data? [Dependency, Spec §Dependencies, Research §4]
- [ ] CHK050 - Is the Pakistan Soil Health Card data availability assumption validated — has research confirmed or rejected it, and is the decision documented? [Assumption, Spec §Assumptions, Research §1]
- [ ] CHK051 - Is the charting library dependency resolved — has the mandi feature's choice been verified and approved, or is this still an open approval item? [Dependency, Plan §Phase 0, Research §10]
- [ ] CHK052 - Are database access requirements strictly specified to flow through shared `lib/db.ts` to Neon Lakebase Postgres with no ad-hoc clients? [Architecture, Constitution §IV, Plan §Summary]
- [ ] CHK053 - Are cross-feature data contracts (weather forecast shape, mandi price shape) versioned or pinned so that upstream changes in Feature #3 or #4 cannot silently break the crop engine? [Dependency, Spec §Dependencies, Plan §Risks]

---

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Link to relevant resources or documentation
- Items are numbered sequentially CHK001–CHK053
- Total: 53 items across 8 quality dimensions
