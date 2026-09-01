# Requirements Quality & Release Gate Checklist: Mandi Price Tracker & Predictor

**Purpose**: Requirements Quality Unit Test Suite & Release Gate Checklist for Feature 002: Mandi Price Tracker & Predictor
**Created**: 2026-08-30
**Updated**: 2026-09-01 (all 36 items checked; 3 carried over from session 2026-09-01 with founder sign-off)
**Target Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md) | [contracts/api-contracts.md](../contracts/api-contracts.md)
**Audience**: Feature Author / Builder & PR Reviewer
**Evaluation Rigor**: Strict / Release Gate (Comprehensive Coverage)

---

## 1. Requirement Completeness & User Scenarios

- [x] CHK001 - Are visual requirements defined for automatically loading market prices near a farmer's registered farm location on initial open? [Completeness, Spec §FR-001, User Story 1]
- [x] CHK002 - Is fallback banner behavior explicitly specified when a farmer has no registered farm location in their profile? [Completeness, Spec §FR-001]
- [x] CHK003 - Are requirements specified for displaying distance in kilometers between farm location and each mandi in comparison views? [Completeness, Spec §FR-015, User Story 2]
- [x] CHK004 - Are requirements documented for displaying top 3 tracked crops with 7-day mini-sparklines on the main dashboard `/dashboard`? [Completeness, Spec §FR-022]
- [x] CHK005 - Are client-side offline caching requirements in browser `localStorage` defined for price lists and history charts? [Completeness, Spec §FR-023]
- [x] CHK006 - Is global Pakistan mandi and crop search functionality specified across all 150+ districts? [Completeness, Spec §FR-021]

---

## 2. Requirement Clarity & Precision

- [x] CHK007 - Is the standardized unit of measurement explicitly defined as PKR per Maund (40 kg / Pakistani Mann)? [Clarity, Spec §FR-001, Data Model §1]
- [x] CHK008 - Are daily price changes quantified with exact formatting requirements showing both percentage and absolute PKR difference? [Clarity, Spec §FR-005]
- [x] CHK009 - Is the prediction forecast horizon explicitly specified as 14 discrete daily forecast points with upper and lower confidence range bands? [Clarity, Spec §FR-009]
- [x] CHK010 - Are price alert trigger conditions strictly defined as sell-only alerts executing when market price reaches or exceeds target price? [Clarity, Spec §FR-012]
- [x] CHK011 - Is the re-triggering policy for active price alerts specified for consecutive daily updates where price remains above target? [Clarity, Spec §FR-013]

---

## 3. Requirement Consistency & Alignment

- [x] CHK012 - Do sell/hold recommendation requirements align across both current price views and 14-day prediction views without conflicting advice? [Consistency, Spec §FR-010, §FR-011]
- [x] CHK013 - Are crop name rendering requirements consistent across search, comparison cards, prediction charts, and alert modals? [Consistency, Spec §FR-004]
- [x] CHK014 - Do target price alert status states (`active`, `paused`) in the spec align with data model column definitions and API contracts? [Consistency, Spec §FR-014, Data Model §5, API Contract §4]

---

## 4. Acceptance Criteria & Measurability

- [x] CHK015 - Can the requirement to load current prices within 3 taps from the dashboard be objectively verified? [Measurability, Spec §SC-001]
- [x] CHK016 - Can the freshness threshold for displayed mandi price data be objectively measured? — *Revised 2026-09-01: the original 24h hard SLA is replaced by the per-row "Updated X days ago" badge (SC-002 + FR-016); the badge itself is the verifiable signal.* [Measurability, Spec §SC-002]
- [x] CHK017 - Are success criteria for setting a price alert within 30 seconds testable without ambiguous steps? [Measurability, Spec §SC-005]
- [x] CHK018 - Can the requirement for identifying the best nearby market within 10 seconds of opening comparison view be verified? [Measurability, Spec §SC-003]

---

## 5. Edge Case & Failure Mode Coverage

- [x] CHK019 - Are requirements specified for rendering a prominent "Updated X days ago" badge when daily price data from government sources is missing or delayed? [Edge Case, Spec §FR-016]
- [x] CHK020 - Are requirements defined for displaying a distinct "Mandi Closed / Market Holiday" status badge on Sundays and market holidays? [Edge Case, Spec §FR-003]
- [x] CHK021 - Are visual warning requirements specified for rendering a "High Volatility / Low Data" badge when prediction model confidence is low? [Edge Case, Spec §FR-010, §FR-017]
- [x] CHK022 - Are fallback requirements documented when historical price data has missing gaps during chart rendering? [Edge Case, Spec §FR-006, User Story 6]
- [x] CHK023 - Are requirements defined for handling multiple price alerts triggering simultaneously for a single farmer? — *Resolved 2026-09-01: one in-app daily digest notification ("N target prices reached today") plus one email per triggered alert (each identifies crop + mandi + target + current + deep-link).* [Edge Case, Coverage]

---

## 6. Localization & 8-Locale Translation Requirements

- [x] CHK024 - Are database translation insertion requirements defined for all 8 Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) in Neon `translations` table before merge? [Completeness, Constitution §II, Plan §Technical Context]
- [x] CHK025 - Are right-to-left (RTL) mirrored layout requirements specified for Urdu (`ur`) and Pashto (`ps`) interfaces? [Completeness, Constitution §II]
- [x] CHK026 - Are dynamic crop name column schema requirements (`name_en`, `name_ur`, `name_pa`, etc.) specified in the database data model? [Coverage, Data Model §1]
- [x] CHK036 - Are requirements specified for inserting new or updated translation keys for every UI change into the Neon database `translations` table via Neon MCP or `scripts/sync-translations.mts` before completing the task? [Completeness, Spec §FR-024, Constitution §II]

---

## 7. Non-Functional, Security & Performance Requirements

- [x] CHK027 - Are route handler input validation requirements specified using Zod for all query parameters and request bodies? [Security, Constitution §V, API Contract §1–§6]
- [x] CHK028 - Are uniform error shape requirements (`{ error: { code, message } }`) specified for all API error responses? [Consistency, Constitution §V, API Contract §Intro]
- [x] CHK029 - Are outdoor-mobile accessibility requirements specified (contrast ≥ 4.5:1, touch targets ≥ 44x44px, light mode default)? [Accessibility, Constitution §VI]
- [x] CHK030 - Are response latency requirements quantified and testable? — *Resolved 2026-09-01: p95 < 200ms at the Vercel edge for `GET /api/prices` (SC-013), measured via Vercel Analytics over a 14-day rolling window.* [Performance, Plan §Technical Context]

---

## 8. Dependencies, Database & Integration Contracts

- [x] CHK031 - Are database access requirements strictly specified to flow through shared `lib/db.ts` to Neon Lakebase Postgres? [Architecture, Constitution §IV]
- [x] CHK032 - Are email notification requirements specified using `nodemailer` + SMTP with a direct deep-link button (`/prices?crop=X&mandi=Y`)? [Completeness, Spec §FR-013]
- [x] CHK033 - Are in-app alert notification requirements specified with a pinned green badge at the top of the feed? [Completeness, Spec §FR-013, §FR-022]
- [x] CHK034 - Are automated daily price ingestion and alert dispatch execution requirements specified post-ingestion? [Completeness, Spec §FR-003, §FR-013]
- [x] CHK035 - Are free cron execution requirements documented via GitHub Actions scheduled workflow (`.github/workflows/mandi-cron.yml`) with bearer-secret authentication? [Completeness, Research §2, Plan §Technical Context, Spec §FR-003]

---

## Summary

- **Total**: 36 items
- **PASS**: 36
- **FAIL**: 0
- **Outstanding clarifications folded back into spec.md and plan.md on 2026-09-01**: CHK016 (badge-over-24h), CHK023 (digest + per-alert email), CHK030 (200ms p95 pin → SC-013)
- **Status**: ✓ PASS — quality gate cleared; implementation may proceed once tasks.md is signed off
