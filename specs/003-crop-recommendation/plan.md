# Implementation Plan: Crop Recommendation Engine

**Branch**: `003-crop-recommendation` | **Date**: 2026-08-30 | **Spec**: `specs/003-crop-recommendation/spec.md`
**Input**: Clarified specification from `specs/003-crop-recommendation/spec.md` and research from `specs/003-crop-recommendation/research.md`.

## Summary

The Crop Recommendation Engine delivers **personalised top-3 crop recommendations** for a Pakistani farmer, combining farm inputs (soil type, irrigation, budget bracket) with weather forecasts, market price trends, and regional soil profiles. A **weighted multi-criteria scoring engine** in TypeScript ranks candidate crops on suitability, weather fit, profitability, risk, and sustainability; the output includes plain-language reasons, a revenue comparison chart, and a 2–3-season rotation plan. The feature is a **full-stack Next.js Route Handler + Postgres** implementation that reuses the existing Weather Advisory and Mandi Price Tracker integrations — no new runtime dependencies beyond a charting library (pending mandi feature's choice).

## Technical Context

**Language/Version**: TypeScript (strict mode, zero escapes), running on the project's existing Next.js + Node runtime.
**Primary Dependencies**: Next.js (Route Handlers as API layer), Neon Lakebase Postgres, `zod` for validation, `react-hook-form` + `@hookform/resolvers` for forms, `jose` for sessions.
**Storage**: Postgres. New tables: `crops`, `crop_soil_compatibility`, `crop_rotation_rules`, `soil_profiles`, `crop_price_trends` (demo fallback), `crop_recommendation_requests`, `crop_recommendations`, `farm_plan_entries`, `crop_rotation_suggestions`. Catalogue seeded via migration.
**Testing**: Project's existing test runner (vitest or similar) for Zod schemas + scoring engine + route handlers; manual run-through of acceptance criteria for the UI.
**Target Platform**: Web (Next.js), deployed alongside the existing Agropioo app. Mobile-first responsive (320px+).
**Project Type**: Single full-stack web app.
**Performance Goals**: 3 recommendations returned in < 15 seconds end-to-end (SC-001); scoring engine itself < 100 ms on a 12-crop catalogue.
**Constraints**: < 2 MB client JS bundle delta; no horizontal scroll at 320px; all UI strings translatable; RTL-ready.
**Scale/Scope**: ~12 commercial Pakistani crops in demo catalogue; ~15 representative districts in soil-profile lookup; 6 named seasons.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Farmer-First | Pass | Plain-language reason for every recommendation (FR-017); bracket-based budget, not exact PKR. |
| II. Pakistan-First | Pass | 6 Pakistani seasons, 8 plain-language soil types, commercial Pakistani crops, 8-locale i18n with RTL. |
| III. Spec-Driven | Pass | Research + clarify before plan; no code yet. |
| IV. Stack Discipline | Pass | Next.js + Postgres + TypeScript; reuse `lib/weather/` and `lib/prices/`; one shared DB client via `lib/db.ts`; no new runtime deps pending approval beyond a charting library (mandi-verified). |
| V. Security & Data Integrity | Pass | All route handlers Zod-validate inputs; auth via existing `requireSessionApi()`; uniform error shape `{ error: { code, message } }`. |
| VI. Accessibility & Outdoor-Mobile | Pass | 320px mobile-first; >= 44px touch targets; `--color-agro-*` tokens only; ONE `--agro-wheat` conversion moment; no emoji-as-icon. |
| UI Honesty (non-negotiable) | Pass | Every revenue estimate is labelled with its data sources and freshness (FR-008); "projection, not guarantee" copy; regional-default disclosure when farmer picks "other" soil (FR-018 edge case). |

**No violations requiring complexity tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/003-crop-recommendation/
├── plan.md                # this file
├── research.md            # Phase 0 output
├── data-model.md          # Phase 1 output
├── quickstart.md          # Phase 1 output
├── contracts/
│   └── route-handlers.md  # Phase 1 output
├── checklists/
│   └── requirements.md    # from /speckit.specify
└── tasks.md               # Phase 2 output (/speckit.tasks, NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── (farmer)/(dashboard)/crops/
│   ├── page.tsx                        # Server Component — recommendation landing / form
│   ├── [request_id]/
│   │   └── page.tsx                    # Recommendation detail + comparison + rotation
│   ├── crops-bundle.ts                 # i18n bundle + typed client props
│   ├── crops-client.tsx                # "use client" — form + comparison UI
│   └── comparison-chart.tsx            # "use client" — revenue bar chart
└── api/crops/
    ├── route.ts                        # POST recommendation request, GET list by farm
    ├── [request_id]/
    │   └── route.ts                    # GET single, DELETE (regenerate)
    ├── catalogue/
    │   └── route.ts                    # GET crop catalogue (for dropdowns)
    └── save/
        └── route.ts                    # POST save a recommendation to farm plan; GET saved entry

lib/
├── crops/
│   ├── engine.ts                       # recommendCrops() — core scoring flow
│   ├── scoring.ts                      # weighted multi-criteria scoring + normalisation
│   ├── rotation.ts                     # rotation lookup logic
│   ├── reasons.ts                      # plain-language reason templates (i18n-keyed)
│   ├── api-types.ts                    # shared response types
│   ├── catalogue.ts                    # catalogue query helpers
│   └── soil-profiles.ts                # district → soil profile lookup
└── validation/
    └── crops.ts                        # Zod schemas shared with route handlers

db/migrations/
└── 0009_crop_recommendation.sql        # tables, enums, seeds for catalogue + soil profiles + rotation rules

catalog/
├── en.ts                               # new app.crops.* keys
├── ur.ts / pa.ts / ps.ts / sd.ts /
│   skr.ts / bal.ts / hno.ts            # translations for all 8 locales
```

**Structure Decision**: Single full-stack Next.js app. Crop recommendation lives under the existing `(farmer)/(dashboard)` group (authenticated farmer area). API routes under `app/api/crops/`. Feature-specific lib code in `lib/crops/`. Shared validation in `lib/validation/crops.ts`. This mirrors the layout used by the Weather Advisory (`001-weather-advisory`) and Mandi Price Tracker (`002-mandi-price-tracker`) features.

## Phases

### Phase 0: Research (complete)

See `research.md`. Key decisions:
- Weighted multi-criteria TypeScript scoring (not Python ML).
- Static district-to-soil-profile lookup (Soil Health Card API deferred).
- Reuse `lib/weather/` and `lib/prices/`.
- 8 plain-language soil types; 4 budget brackets; 6 named seasons.
- Postgres catalogue seeded via migration.
- One new dependency pending approval: charting library (verify mandi feature's choice).

### Phase 1: Design & Contracts (this document)

- `data-model.md` — entity schemas, enums, indexes, validation rules.
- `contracts/route-handlers.md` — HTTP contracts for all crop-recommendation routes.
- `quickstart.md` — developer onboarding: how to seed the catalogue, run the engine locally, verify the happy path.
- Updated `QODER.md` SPECKIT block to point at this plan.

### Phase 2: Task Breakdown (deferred to `/speckit.tasks`)

Will produce `tasks.md` with atomic, testable tasks in dependency order.

## Re-evaluation (post-design)

Re-checking constitution against the completed design:

| Principle | Post-Design Status | Notes |
|---|---|---|
| Farmer-First | Pass | Plain-language reasons, bracket-based budget, no PKR typing. |
| Pakistan-First | Pass | 6 seasons, 8 soils, commercial Pakistani crops, 8-locale i18n. |
| Spec-Driven | Pass | All design decisions trace back to FR-* and clarified answers. |
| Stack Discipline | Pass | No new runtime deps beyond charting library (pending approval); reuse weather + prices; shared `lib/db.ts`. |
| Security & Data Integrity | Pass | Zod on every input; auth via session; uniform errors. |
| Accessibility | Pass | 320px mobile-first; RTL-ready; no emoji icons; token-only colors. |
| UI Honesty | Pass | Revenue confidence labels, regional-default disclosures, "projection not guarantee" copy. |

**Result**: design passes all gates. No violations to justify.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Soil Health Card API becomes available with a different shape | Medium | Low | Static lookup is swappable; schema stays the same. |
| Mandi feature not merged in time | Medium | Medium | Static `crop_price_trends` seed table is the demo fallback; real integration is a follow-up task. |
| Scoring weights don't produce agronomist-agreeable top-3 | Medium | High | Tuning pass on 3-4 representative scenarios (wheat-after-cotton, rice-after-wheat, maize-after-potato, peri-urban veg). Founder reviews before merge. |
| Charting library approval delays | Low | Low | Fall back to a pure-CSS horizontal bar layout. |
| Revenue projections look too optimistic | Medium | High | UI copy explicitly calls out "projection, not guarantee"; confidence bands shown on the chart. |

## Out of Scope (this plan)

- Live Soil Health Card API integration.
- Python ML (scikit-learn / XGBoost).
- LLM-ranked recommendations.
- Voice input / IVR / SMS delivery.
- Expert / agronomist review flow.
- Farms outside Pakistan.
- Insurance / credit / subsidy integration.
- Dark mode.
