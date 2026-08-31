# Requirements Quality Checklist: Crop Recommendation Engine

**Purpose**: Validate the completeness, clarity, consistency, and coverage of requirements for the Crop Recommendation Engine (Feature 003) before implementation begins.
**Created**: 2026-08-30
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [data-model.md](../data-model.md) · [contracts/route-handlers.md](../contracts/route-handlers.md)

**Resolution status**: All 57 items resolved. Concrete decisions, thresholds, and contracts are captured in [spec.md §Precision & Resolved Gaps](../spec.md); weights in [research.md §2](../research.md); confidence/risk criteria in [data-model.md §crop_recommendations](../data-model.md).

## Requirement Completeness

- [x] CHK001 Are loading-state UI requirements defined for the recommendation generation flow, given the up-to-15-second wait window? [Gap, Spec §US-1]
- [x] CHK002 Are error-state UI requirements specified for each degraded-data scenario (weather missing, market missing, soil missing)? [Gap, Spec §FR-018]
- [x] CHK003 Is the "regenerate" user interaction fully specified — what does the farmer see, what confirms the old recommendation is being replaced, and are rotation suggestions also regenerated? [Completeness, Spec §FR-013, Edge Case §duplicate]
- [x] CHK004 Are requirements defined for the case where the scoring engine filters out ALL crops (none pass season + budget filters), leaving zero candidates? [Gap, Edge Case]
- [x] CHK005 Are requirements specified for displaying recommendation history — can a farmer browse past (season, year) recommendations from the farm records page? [Gap, Spec §US-1 scenario 5]
- [x] CHK006 Are requirements defined for what happens to saved farm plan entries and rotation suggestions when the underlying recommendation is regenerated (deleted + recreated)? [Gap, Data Model §State Transitions]
- [x] CHK007 Are concurrent-request requirements specified — what happens if two recommendation requests arrive for the same (farm, season, year) nearly simultaneously? [Gap, Contracts §POST /api/crops]
- [x] CHK008 Are accessibility requirements specified for the revenue comparison chart (FR-010), including screen-reader labelling and keyboard navigation? [Gap, Spec §FR-010, SC-007]
- [x] CHK009 Are requirements defined for the crop catalogue admin-editing interface, or is this explicitly deferred? [Gap, Data Model §crops "admin-editable later"]
- [x] CHK010 Are requirements defined for the "Save to farm plan" action when a farm plan entry already exists for that (farm, season, year) — is there a confirmation prompt, silent replace, or explicit warning? [Gap, Spec §FR-011, Contracts §POST /api/crops/save]

## Requirement Clarity

- [x] CHK011 Is "reasonable wait time" in US-1 scenario 2 quantified or explicitly tied to SC-001's 15-second threshold? [Ambiguity, Spec §US-1 vs §SC-001]
- [x] CHK012 Is "recent market price trends" in FR-004 quantified with a specific time window (e.g., last 4 weeks, last quarter)? [Ambiguity, Spec §FR-004]
- [x] CHK013 Are the revenue confidence bands (`high` / `medium` / `low` / `unreliable`) in the data model defined with explicit criteria for which band applies? [Clarity, Data Model §crop_recommendations.revenue_confidence]
- [x] CHK014 Is "flag it with a clear mismatch warning" for irrigation-mismatch edge case specified — does the crop still appear in the top-3, or is it excluded? [Ambiguity, Spec §Edge Case §irrigation]
- [x] CHK015 Is the budget-bracket "lowest viable bracket" for the too-low-budget edge case a computed value (per farm-size) or a fixed label? [Clarity, Spec §Edge Case §budget-too-low]
- [x] CHK016 Are the scoring-engine sub-score weights (`w_suitability`, `w_weather`, `w_profit`, `w_risk`, `w_sustain`) specified as concrete values or ranges, not just names? [Clarity, Research §2, Plan §Summary]
- [x] CHK017 Is "data freshness" (FR-008) defined in measurable units — seconds since last observation, date of last price point, or forecast issue time? [Clarity, Spec §FR-008]
- [x] CHK018 Is "clearly labels it as generic" for rotation advice (US-3 scenario 4) specified with concrete UI language or a translation key? [Clarity, Spec §US-3 scenario 4]
- [x] CHK019 Does "key risks" in FR-007 have a defined taxonomy — are they drawn from a fixed set (price volatility, pest pressure, weather, water) or free-form? [Clarity, Spec §FR-007]

## Requirement Consistency

- [x] CHK020 Are the soil-type counts consistent across artifacts — spec says "6–10 types", research says "8 plain-language types", data model enum has 9 values (includes `other`)? [Consistency, Spec §FR-001, Research §7, Data Model §soil_type_enum]
- [x] CHK021 Does the comparison view (FR-009) include soil impact when the recommendation output (FR-007) does not explicitly list it as a field? [Consistency, Spec §FR-007 vs §FR-009]
- [x] CHK022 Are season definitions consistent — spec lists 6 seasons (summer, winter, autumn, spring, rainy, windy) but the data model uses these as a Postgres enum with no date-range mapping; is the mapping from calendar months to seasons specified? [Consistency, Spec §Clarifications, Data Model §season_enum]
- [x] CHK023 Does the route contract's `target_year` validation (current year ± 1–2) align with the spec's intent for forward-looking vs historical recommendations? [Consistency, Contracts §POST /api/crops, Spec §FR-013]
- [x] CHK024 Is the UNIQUE constraint on `crop_recommendation_requests (farm_id, target_season, target_year)` consistent with the contract's `regenerate=true` path that deletes and recreates — is there a race-condition window? [Consistency, Data Model §11, Contracts §POST /api/crops]
- [x] CHK025 Does the data model's `water_requirement_level` text field ('low'/'medium'/'high') align with the spec's "water requirement" in FR-007/FR-009 — are these the same concept or different granularity? [Consistency, Spec §FR-007, Data Model §crops]
- [x] CHK026 Are the cascade-delete rules in the data model consistent with the contract's regeneration flow — does deleting a recommendation request cascade through farm_plan_entries and rotation_suggestions correctly? [Consistency, Data Model §State Transitions, Contracts §DELETE]

## Acceptance Criteria Quality

- [x] CHK027 Can SC-002's "80% of farmers open the comparison view or tap into a recommendation detail" be measured without an analytics/tracking system — is a tracking requirement specified? [Measurability, Spec §SC-002]
- [x] CHK028 Can SC-004's "50% of saved recommendations result in planting a different crop" be measured, given that actual planting behaviour is not captured by the app? [Measurability, Spec §SC-004]
- [x] CHK029 Can SC-006's "85% find explanation understandable" be measured without a feedback-collection mechanism — is the feedback mechanism in scope or deferred? [Measurability, Spec §SC-006]
- [x] CHK030 Is SC-001's 15-second threshold an end-to-end measurement (including network) or server-side only, and is this distinction specified? [Clarity, Spec §SC-001]
- [x] CHK031 Are SC-002 through SC-006 aspirational targets or hard acceptance gates — is the distinction stated? [Clarity, Spec §Success Criteria]

## Scenario Coverage

- [x] CHK032 Are requirements defined for the farmer who switches farms mid-session — does the recommendation form reset, retain state, or warn? [Gap, Spec §US-1]
- [x] CHK033 Are requirements defined for the scenario where market price data is stale (not missing, but outdated beyond a threshold) — is this the same as "unavailable" or a distinct state? [Coverage, Spec §Edge Case §stale-market-data]
- [x] CHK034 Are requirements defined for the boundary between seasons — when does "winter 2026" end and "spring 2027" begin, and can a farmer request a recommendation for a season that has already started? [Gap, Spec §FR-013, Data Model §season_enum]
- [x] CHK035 Are requirements defined for the case where the farm record is deleted or archived after a recommendation is saved — what happens to the farm plan entry? [Gap, Data Model §farm_plan_entries State Transitions]
- [x] CHK036 Are requirements defined for the comparison chart rendering failure (e.g., zero data, extreme values) — is a fallback specified? [Gap, Spec §FR-010]
- [x] CHK037 Are requirements specified for the farmer who wants recommendations for multiple farms — is there a "recommend for all my farms" flow or only one-at-a-time? [Gap, Spec §US-1]
- [x] CHK038 Are rotation-suggestion requirements complete for the case where the farm has multiple past crop history entries — which history entries influence the rotation, all of them or only the most recent? [Coverage, Spec §FR-012]

## Edge Case Coverage

- [x] CHK039 Is the "outside Pakistan" rejection (FR-015) specified with a concrete geofencing mechanism — bounding box, admin boundary, or coordinate check? [Clarity, Spec §FR-015]
- [x] CHK040 Is the "Not sure / Other" soil fallback (Edge Case §soil-unknown) specified for the case where the regional soil-profile lookup ALSO fails (district not in the lookup table)? [Coverage, Spec §Edge Case §soil-unknown, Data Model §soil_profiles]
- [x] CHK041 Is the edge case of a farmer with exactly zero viable crops for their budget bracket fully specified — does the system suggest increasing budget, or offer alternatives? [Coverage, Spec §Edge Case §budget-too-low]
- [x] CHK042 Is the edge case of weather API returning partial data (e.g., temperature available but rainfall not) specified — is this "degraded" or "missing" for the weather_confidence field? [Coverage, Data Model §weather_confidence]
- [x] CHK043 Are edge cases defined for extremely high or low budget brackets combined with small or large farm sizes — are there impossible combinations? [Coverage, Spec §FR-001]

## Non-Functional Requirements

- [x] CHK044 Are performance requirements specified for the crop catalogue endpoint (GET /api/crops/catalogue) used by the form dropdown? [Gap, Spec §SC-001 covers recommendation only]
- [x] CHK045 Are data-retention requirements defined — how long are recommendation requests kept, and is there an archival or purge policy? [Gap]
- [x] CHK046 Are rate-limiting requirements specified beyond the contract's "20 per hour per IP" — is there a per-account rate limit for recommendation generation? [Coverage, Contracts §Rate Limiting]
- [x] CHK047 Is the < 2 MB client JS bundle delta constraint (Plan §Technical Context) traceable to a spec-level requirement, or only a plan constraint? [Traceability, Plan §Technical Context]
- [x] CHK048 Are offline or low-connectivity requirements specified for the recommendation flow, given the rural farmer audience? [Gap]

## Dependencies & Assumptions

- [x] CHK049 Is the dependency on the Mandi Price Tracker feature (Feature #4) documented with a fallback contract — what data shape does the static `crop_price_trends` table need to match for seamless swap? [Dependency, Spec §Dependencies, Research §4]
- [x] CHK050 Is the dependency on the Weather Advisory feature (Feature #3) documented with a specific function signature or import path that the crop engine will consume? [Dependency, Spec §Dependencies, Research §3]
- [x] CHK051 Is the assumption of "Pakistan Soil Health Card programme" data availability validated — has research confirmed or rejected it, and is the decision documented? [Assumption, Spec §Assumptions, Research §1]
- [x] CHK052 Is the charting library dependency resolved — has the mandi feature's choice been verified, or is this still an open approval item? [Dependency, Plan §Phase 0, Research §10]
- [x] CHK053 Are the cross-feature data contracts (weather forecast shape, mandi price shape) versioned or pinned so that upstream changes in Feature #3 or #4 cannot silently break the crop engine? [Dependency, Spec §Dependencies]

## Ambiguities & Conflicts

- [x] CHK054 Is "plain-language explanation" (FR-017) scoped to a reading level or farmer-literacy assumption, or is it left to the implementer's judgment? [Ambiguity, Spec §FR-017]
- [x] CHK055 Is the relationship between `crop_recommendations.data_sources_used` and the individual confidence fields (`weather_confidence`, `market_confidence`, `soil_confidence` on the request) specified — are they derived from each other or independent? [Ambiguity, Data Model §11 vs §12]
- [x] CHK056 Is the "option to regenerate" in FR-013 specified as a destructive action (delete old + create new) or a non-destructive archive-and-replace? [Ambiguity, Spec §FR-013, Data Model §State Transitions]
- [x] CHK057 Does the spec assume year-round connectivity for the farmer, or are intermittent/poor-connectivity scenarios addressed in the requirements? [Assumption, Gap]

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Link to relevant resources or documentation
- Items are numbered sequentially CHK001–CHK057
- Total: 57 items across 9 quality dimensions
