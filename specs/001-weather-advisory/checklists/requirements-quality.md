# Requirements Quality Checklist: Smart Weather Advisory

**Purpose**: Validate requirement completeness, clarity, consistency, and measurability  
**Created**: 2026-08-30  
**Feature**: [spec.md](./spec.md)

## Extension Hooks

**Optional Pre-Hook**: git
Command: `/speckit.git.commit`
Description: Auto-commit before checklist generation

Prompt: Commit outstanding changes before checklist?
To execute: `/speckit.git.commit`

## Requirement Completeness

- [ ] CHK001 Are validation constraints specified for each Farm Registration attribute (crop type, sowing date, location, farm name, area size, soil type, irrigation method)? [Completeness, Spec §FR-001]
- [ ] CHK002 Are the specific growth stages and their duration categories defined for crop stage determination logic? [Completeness, Spec §FR-002]
- [ ] CHK003 Is the exact forecast horizon (number of days) and data granularity specified for the weather forecast requirement? [Clarity, Spec §FR-003]
- [ ] CHK004 Is the format and structure of personalized farming advice explicitly defined? [Clarity, Spec §FR-004]
- [ ] CHK005 Are alert severity levels and their specific criteria explicitly defined? [Completeness, Spec §FR-005]
- [ ] CHK006 Is the advisory history retention period and deletion policy specified? [Gap, Spec §FR-006]
- [ ] CHK007 Are the initially supported languages explicitly listed with fallback behavior defined when a translation is missing? [Clarity, Spec §FR-007]
- [ ] CHK008 Is the behavior defined after an advisory is marked as acknowledged or acted upon? [Gap, Spec §FR-011]
- [ ] CHK009 Is the default farm selection behavior specified when a farmer has multiple farms? [Gap, Spec §FR-010]
- [ ] CHK010 Are requirements defined for what happens when the farmer has no cached advisory and weather data is unavailable? [Gap, Spec §Edge Cases]

## Requirement Clarity

- [ ] CHK011 Is "within 30 seconds" a hard requirement or performance target, and what happens if exceeded? [Ambiguity, Spec §SC-001]
- [ ] CHK012 Is "relevant to the farmer's registered crop" objectively measurable with specific criteria? [Measurability, Spec §SC-002]
- [ ] CHK013 Is "within 15 minutes" for alert delivery a hard SLA or best-effort target? [Ambiguity, Spec §SC-003]
- [ ] CHK014 Is "significant risk" in FR-005 quantified with specific weather thresholds and time windows? [Clarity, Spec §FR-005]
- [ ] CHK015 Is "avoid unnecessary irrigation before expected rainfall" defined with measurable thresholds (e.g., mm of rain, hours ahead)? [Clarity, Spec §SC-005]

## Requirement Consistency

- [ ] CHK016 Are the language requirements in FR-007 consistent with the project's 8-locale translation policy in the constitution? [Consistency, Spec §FR-007]
- [ ] CHK017 Do the edge case handling rules (cached advisory fallback, generic advice fallback) align with the main functional requirements without conflict? [Consistency]
- [ ] CHK018 Is the 7-day forecast horizon in user story 3 consistent with the OpenWeatherMap API capabilities noted in research? [Consistency]

## Acceptance Criteria Quality

- [ ] CHK019 Are all user stories covered by measurable acceptance scenarios? [Acceptance Criteria]
- [ ] CHK020 Is there an acceptance scenario for the edge case where no cached advisory exists when weather data becomes unavailable? [Coverage, Gap]
- [ ] CHK021 Is there an acceptance scenario for switching between multiple farms and verifying advisory updates? [Coverage, Spec §FR-010]
- [ ] CHK022 Is there an acceptance scenario for marking an advisory as acted upon? [Coverage, Spec §FR-011]
- [ ] CHK023 Is there an acceptance scenario for language switching and verifying advisory text updates? [Coverage, Spec §FR-007]

## Scenario Coverage

- [ ] CHK024 Are error scenarios defined for OpenWeatherMap API failures (timeout, invalid response, quota exceeded)? [Coverage, Exception Flow]
- [ ] CHK025 Are recovery scenarios defined for when weather data resumes after being unavailable? [Coverage, Recovery]
- [ ] CHK026 Are concurrent user scenarios addressed (e.g., farmer switches farms while advisory is loading)? [Coverage]
- [ ] CHK027 Are requirements defined for when the farmer's location has no forecast coverage at all (not just temporary unavailability)? [Coverage, Gap]
- [ ] CHK028 Are requirements defined for partial forecast data availability (some days available, others not)? [Coverage, Exception Flow]

## Edge Case Coverage

- [ ] CHK029 Is the behavior defined when a farm's crop sowing date is in the future? [Edge Case, Gap]
- [ ] CHK030 Is the behavior defined when the farmer's location is at the edge of forecast coverage with low accuracy? [Edge Case, Gap]
- [ ] CHK031 Are duplicate advisory prevention requirements defined (e.g., same advice generated twice for the same farm and day)? [Edge Case, Gap]
- [ ] CHK032 Is the behavior defined when the farmer's selected language is not yet supported in the translations table? [Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK033 Are outdoor-mobile accessibility requirements specified for the advisory UI (touch targets, contrast, readability in sunlight)? [NFR, Gap]
- [ ] CHK034 Is the data freshness policy for cached advisories explicitly defined (e.g., max age before showing stale data)? [NFR, Gap]
- [ ] CHK035 Are rate limiting or quota considerations for OpenWeatherMap API calls specified in requirements? [NFR, Gap]
- [ ] CHK036 Is the advisory generation timeout specified (what if OpenWeatherMap is slow but responds)? [NFR, Gap]

## Dependencies & Assumptions

- [ ] CHK037 Is the dependency on OpenWeatherMap API availability addressed with a fallback strategy beyond database caching? [Dependency, Gap]
- [ ] CHK038 Is the assumption of "reasonable accuracy for at least 3 days ahead" validated or documented with acceptable deviation? [Assumption]
- [ ] CHK039 Is the assumption of internet connectivity for farmers addressed with any offline capability or graceful degradation? [Assumption]
- [ ] CHK040 Are translation key requirements for all 8 locales explicitly documented for advisory text templates? [Dependency, Constitution]

## Ambiguities & Conflicts

- [ ] CHK041 Does "advice text" in the Weather Advisory entity align with the structured recommendation fields implied by FR-008 and FR-009, or is there a schema conflict? [Conflict]
- [ ] CHK042 Is there a conflict between SC-001's 30-second rendering target and the 15-minute alert detection target in terms of data freshness expectations? [Ambiguity]
- [ ] CHK043 Is the term "personalized" in FR-004 defined with specific criteria, or is it subjective? [Ambiguity, Spec §FR-004]
