# Tasks: Crop Recommendation Engine

**Input**: Design documents from `/specs/003-crop-recommendation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/route-handlers.md, quickstart.md

**Tests**: Constitution Quality Gate mandates automated tests for Zod schemas and route handlers. Test tasks are included in Phase 2 (schema tests) and Phase 3 (route handler tests). Manual acceptance run-through per constitution covers UI verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single full-stack Next.js app. Feature code under `app/(farmer)/(dashboard)/crops/` and `app/api/crops/`. Shared logic in `lib/crops/`. Validation in `lib/validation/`. Migration in `db/migrations/`. Catalog in `catalog/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, validation schemas, i18n keys, and rate-limiting config — the scaffolding every subsequent phase depends on.

- [x] T001 Create the crop recommendation migration with all 5 enum types, 9 tables, indexes, and seed data (~12 crops, ~15 district soil profiles, rotation rules, static price trends) in `db/migrations/0009_crop_recommendation.sql`
- [x] T002 [P] Create Zod schemas for all crop recommendation inputs and enums (season, soil_type, irrigation_type, budget_bracket, crop_category, request body, query params) in `lib/validation/crops.ts`
- [x] T003 [P] Add all `app.crops.*` i18n keys (soil labels, budget labels, crop catalogue names, reason templates, rotation reason keys, UI copy) to `catalog/en.ts`
- [x] T004 [P] Add translated `app.crops.*` keys to the 7 non-English catalog files (`catalog/ur.ts`, `catalog/pa.ts`, `catalog/ps.ts`, `catalog/sd.ts`, `catalog/skr.ts`, `catalog/bal.ts`, `catalog/hno.ts`)
- [x] T005 Add `cropsIp` rate-limit rule (`limit: 20, windowMs: HOUR_MS`) to `RATE_RULES` in `lib/auth/rate-limit.ts`

**Checkpoint**: Migration runs cleanly (`npm run db:push`); Zod schemas pass type-check; all 8 locale files have matching `app.crops.*` keys; `npm run sync:translations` upserts rows into `translations` table.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core library modules that the recommendation engine, route handlers, and UI all depend on. No user story can begin until this phase is complete.

- [x] T006 Create shared API response types and interfaces (`CropRecommendationRequest`, `CropRecommendation`, `FarmPlanEntry`, `RotationSuggestion`, etc.) in `lib/crops/api-types.ts`
- [x] T007 [P] Create crop catalogue query helpers (filter by season, budget bracket; fetch by id) in `lib/crops/catalogue.ts`
- [x] T008 [P] Create district-to-soil-profile lookup (query `soil_profiles` by district, return dominant soil type with disclosure flag) in `lib/crops/soil-profiles.ts`
- [x] T009 Create the weighted multi-criteria scoring function with 5 dimensions (suitability, weather, profitability, risk, sustainability), normalisation, and configurable weights in `lib/crops/scoring.ts`. Sustainability sub-score sources: rotation fit from `crop_rotation_rules` (T011), nitrogen-fixing flag from `crops.category == 'pulse'`, water use from `crops.water_requirement_level`.
- [x] T010 Create plain-language reason template generator (i18n-keyed, per crop + season + soil combination) in `lib/crops/reasons.ts`
- [x] T011 Create rotation lookup logic (query `crop_rotation_rules`, handle past crop history exclusion, generic fallback when no history) in `lib/crops/rotation.ts`
- [x] T012 Create the `recommendCrops()` orchestration function in `lib/crops/engine.ts` that wires together: validation, uniqueness check, weather fetch (reuse `lib/weather/`), market data fetch (reuse `lib/prices/` or static fallback), soil lookup, catalogue filter, scoring, reason generation, and persistence. Must include: (a) Pakistan geo-check — reject farms with coordinates outside Pakistan bounds, (b) compute `data_fresheness_seconds` as max age across upstream data sources, (c) throw a typed `WeatherUnavailableError` when weather API is completely unreachable and no cached advisory exists (route handler maps this to 503), (d) degrade gracefully with re-normalised weights when individual data sources are partially unavailable.
- [x] T012a [P] Write automated tests for Zod schemas (input validation, enum membership, boundary values, invalid combinations) in `lib/validation/crops.test.ts`
- [x] T012b [P] Write automated tests for scoring engine — verify top-3 output for 3 reference scenarios (wheat-after-cotton, rice-after-wheat, maize-after-potato) matches approved snapshots in `lib/crops/scoring.test.ts`

**Checkpoint**: `recommendCrops()` can be called with mock inputs and returns a scored top-3 for a reference scenario. All lib modules import cleanly with no type errors.

---

## Phase 3: User Story 1 — Farmer Gets Personalized Crop Recommendations (Priority: P1) MVP

**Goal**: A logged-in farmer with an existing farm record can submit farm inputs and receive 3 ranked crop recommendations with reasons, risks, and revenue estimates.

**Independent Test**: Create a farm record, POST to `/api/crops` with valid inputs, receive 3 ranked recommendations. Verify the form page submits and renders the recommendation list.

### Implementation for User Story 1

- [x] T013 [US1] Implement `POST /api/crops` route handler — validate input with Zod, call `recommendCrops()`, catch `WeatherUnavailableError` and return 503, handle 409 duplicate, return 201 on success — in `app/api/crops/route.ts`
- [x] T014 [P] [US1] Implement `GET /api/crops` route handler — list recommendation requests for a farm with cursor pagination per contract (same file as T013; GET export alongside POST) — in `app/api/crops/route.ts`
- [x] T015 [P] [US1] Implement `GET /api/crops/catalogue` route handler — return filtered crop catalogue per contract — in `app/api/crops/catalogue/route.ts`
- [x] T016 [P] [US1] Implement `GET /api/crops/[request_id]` route handler — fetch single request with its 3 recommendations per contract — in `app/api/crops/[request_id]/route.ts`
- [x] T017 [P] [US1] Implement `DELETE /api/crops/[request_id]` route handler — delete a recommendation request per contract — in `app/api/crops/[request_id]/route.ts`
- [x] T018 [US1] Create the recommendation landing page (Server Component) — fetch farm list for dropdown, pass i18n bundle to client component — in `app/(farmer)/(dashboard)/crops/page.tsx`
- [x] T019 [US1] Create the i18n bundle helper `getCropsBundle()` for server-side translation fetching, following the per-feature bundle pattern used by `getWeatherBundle()` — in `app/(farmer)/(dashboard)/crops/crops-bundle.ts`
- [x] T020 [US1] Create the client-side recommendation form (farm selector, soil type dropdown, irrigation selector, budget bracket selector, submit) using `react-hook-form` + `@hookform/resolvers` with the Zod schemas from T002. Must display a "lowest viable bracket" warning when the selected budget filters out all catalogue crops — in `app/(farmer)/(dashboard)/crops/crops-client.tsx`
- [x] T021 [US1] Create the recommendation result list component — renders 3 ranked cards with crop name, revenue, reason, risks, and "Save to farm plan" + "Compare" actions — in `app/(farmer)/(dashboard)/crops/crops-client.tsx` (same file, separate component)
- [x] T022 [US1] Create the recommendation detail page (Server Component) — fetch request by ID, render full breakdown with data-source labels and confidence — in `app/(farmer)/(dashboard)/crops/[request_id]/page.tsx`
- [x] T023 [US1] Implement the duplicate-recommendation flow — when a recommendation exists for (farm, season, year), show the existing result with a "Regenerate" button that calls DELETE then re-POSTs — in `app/(farmer)/(dashboard)/crops/crops-client.tsx`
- [x] T023a [P] [US1] Write automated tests for `POST /api/crops` route handler — auth, validation, 201 success, 409 duplicate, 503 weather unavailable in `app/api/crops/route.test.ts`
- [x] T023b [P] [US1] Write automated tests for `GET /api/crops` and `GET /api/crops/[request_id]` route handlers — auth, 403 cross-account, 404 not found, pagination in `app/api/crops/route.test.ts`

**Checkpoint**: Farmer can navigate to `/crops`, fill the form, receive 3 recommendations, view detail, and see the duplicate-detection flow. API smoke tests from quickstart.md step 4 pass.

---

## Phase 4: User Story 2 — Farmer Compares Recommended Crops Side-by-Side (Priority: P2)

**Goal**: After receiving recommendations, the farmer opens a comparison view with all 3 crops shown side-by-side across revenue, water, duration, risk, soil impact, and labour — plus a revenue bar chart.

**Independent Test**: Generate recommendations, tap "Compare crops", verify the comparison table and chart render with real data on a 320px screen.

### Implementation for User Story 2

- [x] T024 [US2] Create the comparison view section (side-by-side table with revenue, growing duration, water requirement, market risk, soil impact, labour cost per crop) as a client component — in `app/(farmer)/(dashboard)/crops/crops-client.tsx` (separate component)
- [x] T025 [US2] Create the revenue comparison bar chart component. **Prerequisite**: confirm charting library with founder (verify mandi feature's choice; if none approved, propose one per constitution's new-dependency rule before implementing). Fall back to pure-CSS horizontal bars if approval is blocked. — in `app/(farmer)/(dashboard)/crops/comparison-chart.tsx`
- [x] T026 [US2] Wire the "Compare crops" action from the recommendation list to open the comparison view, and allow selecting one crop from comparison to become the save target — in `app/(farmer)/(dashboard)/crops/crops-client.tsx`

**Checkpoint**: From the recommendation list, tapping "Compare crops" opens the comparison view with real data in both the table and the chart. A crop selected from comparison can be saved.

---

## Phase 5: User Story 3 — Farmer Receives Crop Rotation Advice (Priority: P3)

**Goal**: After saving a crop recommendation, the farmer sees a 2–3 season rotation plan with plain-language reasons, taking past crop history into account when available.

**Independent Test**: Save a recommendation to the farm plan, verify rotation suggestions appear for the next 2–3 seasons with reasons. Verify generic label when no past crop history exists.

### Implementation for User Story 3

- [x] T027 [US3] Implement `POST /api/crops/save` route handler — validate `recommendation_id`, upsert `farm_plan_entries`, compute and persist rotation suggestions per contract — in `app/api/crops/save/route.ts`
- [x] T028 [US3] Implement `GET /api/crops/save` route handler — fetch saved farm plan entry with rotation suggestions for a (farm, season, year) per contract (same file as T027; GET export alongside POST) — in `app/api/crops/save/route.ts`
- [x] T029 [US3] Add rotation suggestion display section to the recommendation detail page — renders 2–3 upcoming seasons with crop name, plain-language reason, and "generic advice" label when applicable — in `app/(farmer)/(dashboard)/crops/[request_id]/page.tsx`
- [x] T030 [US3] Wire the "Save to farm plan" button to call `POST /api/crops/save` and display the resulting rotation suggestions inline — in `app/(farmer)/(dashboard)/crops/crops-client.tsx`

**Checkpoint**: Saving a recommendation triggers rotation suggestions that render on the detail page. Generic vs history-based label is correct.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, RTL, responsive layout, and final validation pass across all user stories.

- [x] T031 [P] Add crop recommendation navigation link to the farmer dashboard in `app/(farmer)/(dashboard)/dashboard/page.tsx` (or the shared nav component)
- [ ] T032 [P] Verify and fix RTL layout for Urdu and Pashto — all `app.crops.*` labels render correctly, layout mirrors, no horizontal scroll at 320px
- [ ] T033 [P] Accessibility pass — verify all touch targets >= 44x44px, focus rings visible, `prefers-reduced-motion` respected on chart, contrast ratios meet 4.5:1 on all text
- [ ] T034 Verify quickstart.md validation end-to-end — run all 6 steps and confirm every expected outcome passes
- [ ] T035 Run `npm run lint` and `npm run build` — fix any type errors, lint warnings, or build failures introduced by this feature
- [ ] T036 Verify all `app.crops.*` translation keys exist in the `translations` table for all 8 locales after running `npm run sync:translations`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 migration must exist for types; T002 Zod schemas used by lib modules)
- **User Story 1 (Phase 3)**: Depends on Foundational — uses `recommendCrops()`, catalogue helpers, validation schemas
- **User Story 2 (Phase 4)**: Depends on US1 — comparison view consumes recommendations from Phase 3
- **User Story 3 (Phase 5)**: Depends on US1 — save and rotation consume a recommendation from Phase 3; can proceed in parallel with US2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 Phase 3 is complete — consumes recommendation output
- **User Story 3 (P3)**: Can start after US1 Phase 3 is complete — can proceed in parallel with US2

### Within Each User Story

- Route handlers before UI (data must exist for the UI to render)
- Models/queries before services before endpoints
- Core implementation before integration with other components
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can all run in parallel (different files, no dependencies)
- **Phase 2**: T007 and T008 can run in parallel (different files, no dependencies); T012a and T012b can run in parallel (different test files)
- **Phase 3**: T014, T015, T016, T017 can run in parallel once T013 is complete (different route files, same lib dependency); T023a and T023b can run in parallel (different test scopes, same file)
- **Phase 6**: T031, T032, T033 can all run in parallel (different files/concerns)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all independent setup tasks together:
Task: "Create Zod schemas in lib/validation/crops.ts"
Task: "Add app.crops.* keys to catalog/en.ts"
Task: "Add app.crops.* keys to 7 non-English catalog files"
```

## Parallel Example: Phase 3 US1 Route Handlers

```bash
# After T013 (POST /api/crops) is complete, launch remaining routes:
Task: "Implement GET /api/crops in app/api/crops/route.ts"
Task: "Implement GET /api/crops/catalogue in app/api/crops/catalogue/route.ts"
Task: "Implement GET /api/crops/[request_id] in app/api/crops/[request_id]/route.ts"
Task: "Implement DELETE /api/crops/[request_id] in app/api/crops/[request_id]/route.ts"
```

## Parallel Example: Phase 5 + Phase 4

```bash
# US2 and US3 can proceed in parallel once US1 is complete:
Team A: Phase 4 (comparison view + chart)
Team B: Phase 5 (save + rotation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently via quickstart.md steps 4–6
5. Deploy/demo if ready — farmer can get and view recommendations

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (comparison adds decision support)
4. Add User Story 3 → Test independently → Deploy/Demo (rotation adds long-term value)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (full stack — routes + UI)
3. Once US1 is done:
   - Developer A: User Story 2 (comparison)
   - Developer B: User Story 3 (save + rotation) — in parallel
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The charting library dependency (T025) requires founder approval per constitution's new-dependency rule — verify mandi feature's choice first
- Revenue estimates in UI must always carry "projection, not guarantee" copy per constitution Principle VI (UI honesty)
- All `app.crops.*` i18n keys must be synced to the `translations` table before merge (definition of done)
