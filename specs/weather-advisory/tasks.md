# Tasks: Smart Weather Advisory

**Input**: Design documents from `/specs/001-weather-advisory/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/route-handlers.md

**Tests**: Logic gets automated tests (Zod schemas + route-handler tests); UI is verified by manual run-through of acceptance criteria per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `components/`, `lib/`, `db/`, `catalog/` at repository root
- Routes live under `app/(farmer)/(dashboard)/` (farmer UI) and `app/api/` (API)
- Migrations live in `db/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Translation key authoring and database migration scaffolding

- [x] T001 Create database migration `db/migrations/0008_weather_advisory.sql` extending `farms` and creating `weather_advisories` and `weather_alerts` tables per data-model.md
- [x] T002 [P] Add weather advisory translation keys to `catalog/en.ts` under `app.weather.*` namespace (page, advisory, alerts, forecast, history, buttons, errors)
- [x] T003 [P] Draft weather advisory translations in `catalog/ur.ts`
- [x] T004 [P] Draft weather advisory translations in `catalog/pa.ts`
- [x] T005 [P] Draft weather advisory translations in `catalog/ps.ts`
- [x] T006 [P] Draft weather advisory translations in `catalog/sd.ts`
- [x] T007 [P] Draft weather advisory translations in `catalog/skr.ts`
- [x] T008 [P] Draft weather advisory translations in `catalog/bal.ts`
- [x] T009 [P] Draft weather advisory translations in `catalog/hno.ts`
- [x] T010 Run `npm run sync:translations` and verify 8-locale coverage report shows no missing `app.weather.*` keys

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 [P] Implement OpenWeatherMap client wrapper in `lib/weather/openweather.ts` with caching, retry, and graceful degradation
- [x] T012 [P] Implement advisory generation engine in `lib/weather/advisory.ts` keyed on crop growth stage + weather thresholds per research.md
- [x] T013 [P] Implement alert rule engine in `lib/weather/alerts.ts` scanning next 3 hours for heavy rain, frost, extreme heat, and disease risk conditions
- [x] T014 Add `getWeatherBundle()` to `lib/i18n/server.ts` resolving all `app.weather.*` translation keys per request
- [x] T015 [P] Create Zod validation schemas for weather advisory route handlers in `lib/validation/weather.ts`
- [x] T016 Apply migration `db/migrations/0008_weather_advisory.sql` and verify `farms`, `weather_advisories`, and `weather_alerts` tables exist
- [x] T017 [P] Add `requireSessionApi()` auth guards to all new `/api/weather/*` route handlers per contracts/route-handlers.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Register farm and receive daily advice (Priority: P1) 🎯 MVP

**Goal**: Farmer registers crop, sowing date, and farm location; opens app and sees a personalized daily advisory with a specific farming recommendation based on weather forecast and crop growth stage.

**Independent Test**: Register one farm, log in the next day, and see a personalized advisory for the crop and location. If no farm is registered, see a prompt to register first.

### Implementation for User Story 1

- [x] T018 [US1] Implement POST `/api/weather/register` route handler in `app/api/weather/register/route.ts` accepting farm_id, primary_crop, sowing_date, soil_type, irrigation_method
- [x] T019 [US1] Implement GET `/api/weather/forecast` route handler in `app/api/weather/forecast/route.ts` returning 7-day forecast with daily advice and cached fallback on provider failure
- [x] T020 [US1] Create AdvisoryCard component in `components/weather/AdvisoryCard.tsx` displaying today's recommendation with growth stage and severity
- [x] T021 [US1] Create FarmSelector component in `components/weather/FarmSelector.tsx` for switching between registered farms
- [x] T022 [US1] Update `app/(farmer)/(dashboard)/weather/page.tsx` to load farm data via getWeatherBundle(), render FarmSelector and AdvisoryCard, and show register prompt when no farms exist
- [x] T023 [US1] Add no-farm-registered empty state in `app/(farmer)/(dashboard)/weather/page.tsx` with CTA to register farm details

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Receive critical weather alerts (Priority: P2)

**Goal**: Farmer receives an alert via email and in-app notification when weather conditions threaten their crop (heavy rain, frost, extreme heat, disease risk).

**Independent Test**: Simulate a critical forecast condition and verify the farmer receives an in-app alert and email within the detection window.

### Implementation for User Story 2

- [x] T024 [US2] Implement GET `/api/weather/alerts` route handler in `app/api/weather/alerts/route.ts` returning active unread alerts for the authenticated farmer
- [x] T025 [US2] Implement POST `/api/weather/alerts/[id]/read` route handler in `app/api/weather/alerts/[id]/read/route.ts` marking alert as read
- [x] T026 [US2] Implement POST `/api/weather/alerts/trigger` internal cron endpoint in `app/api/weather/alerts/trigger/route.ts` protected by ADVISOR_CRON_SECRET
- [x] T027 [US2] Create AlertBanner component in `components/weather/AlertBanner.tsx` displaying critical alerts with severity, recommendation, and dismiss action
- [x] T028 [US2] Integrate email delivery via Nodemailer + SMTP in `lib/weather/alerts.ts` for critical alert notifications
- [x] T029 [US2] Add unread alert badge to shell navigation component using weather_alerts read_at index

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - View 7-day forecast with daily advice (Priority: P3)

**Goal**: Farmer views a 7-day forecast where each day shows weather prediction alongside a farming-specific recommendation for their crop and growth stage.

**Independent Test**: Navigate to the weather page and see a 7-day forecast with one actionable recommendation per day. Switch farms and verify recommendations update.

### Implementation for User Story 3

- [x] T030 [US3] Create ForecastList component in `components/weather/ForecastList.tsx` rendering 7-day forecast cards with weather summary and daily advice
- [x] T031 [US3] Add 7-day forecast section to `app/(farmer)/(dashboard)/weather/page.tsx` below today's advisory using ForecastList
- [x] T032 [US3] Wire FarmSelector to reload forecast and advisory when a different farm is selected

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Review advisory history (Priority: P4)

**Goal**: Farmer reviews past advisories to see what was recommended on previous days and track whether they acted on the advice.

**Independent Test**: View a list of past advisories sorted by date, tap one, and see the full recommendation and weather conditions for that day.

### Implementation for User Story 4

- [x] T033 [US4] Implement GET `/api/weather/history` route handler in `app/api/weather/history/route.ts` with farm_id, limit, and cursor pagination
- [x] T034 [US4] Implement POST `/api/weather/history/[id]/acknowledge` route handler in `app/api/weather/history/[id]/acknowledge/route.ts` accepting action: acknowledged or acted_upon
- [x] T035 [US4] Create HistoryList component in `components/weather/HistoryList.tsx` rendering paginated advisory history with date, severity, and action status
- [x] T036 [US4] Create `app/(farmer)/(dashboard)/weather/history/page.tsx` displaying HistoryList with farm selector
- [x] T037 [US4] Add advisory detail view in `app/(farmer)/(dashboard)/weather/history/[id]/page.tsx` showing full weather conditions, recommendation, and acknowledge/act buttons

**Checkpoint**: Advisory history is fully navigable and actionable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Demo data, error states, accessibility, and final validation

- [x] T038 [P] Update `app/(farmer)/(dashboard)/weather/demo-data.ts` with realistic 7-day forecast and advisory demo data per quickstart.md
- [x] T039 Add loading skeletons and error boundaries to `app/(farmer)/(dashboard)/weather/page.tsx` and `app/(farmer)/(dashboard)/weather/history/page.tsx`
- [x] T040 Verify outdoor-mobile accessibility targets: ≥44px touch targets, ≥4.5:1 contrast, no horizontal scroll at 320px on all weather advisory pages
- [x] T041 Verify language switcher updates all `app.weather.*` strings across weather pages and history
- [x] T042 Run `npm run lint` and `npm run build` and fix any errors
- [x] T043 Run quickstart.md manual verification steps: register farm, view advisory, switch language, check history, verify alerts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 notification center but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1 forecast view but should be independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Depends on US1 advisory data but should be independently testable

### Within Each User Story

- API routes before UI components
- Core components before page integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup translation tasks (T003–T009) can run in parallel
- All Foundational library tasks (T011–T013) can run in parallel
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within each story, API routes and components can be built in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch API and UI tasks together:
Task: "Implement POST /api/weather/register route handler in app/api/weather/register/route.ts"
Task: "Implement GET /api/weather/forecast route handler in app/api/weather/forecast/route.ts"
Task: "Create AdvisoryCard component in components/weather/AdvisoryCard.tsx"
Task: "Create FarmSelector component in components/weather/FarmSelector.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
