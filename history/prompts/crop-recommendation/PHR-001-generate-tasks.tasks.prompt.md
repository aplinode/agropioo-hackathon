---
id: PHR-001
title: Generate Tasks for Crop Recommendation
stage: tasks
date: 2026-08-30
surface: agent
model: unknown
feature: crop-recommendation
branch: 003-crop-recommendation
user: mustafashahzad845
command: /speckit-tasks @specs/003-crop-recommendation/
labels: ["crop-recommendation","tasks","003"]
links:
  spec: specs/003-crop-recommendation/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-crop-recommendation/tasks.md
tests:
  - null
---

## Prompt

/speckit-tasks @specs/003-crop-recommendation/

## Response snapshot

Generated `specs/003-crop-recommendation/tasks.md` with 36 tasks organized across 6 phases:

- **Phase 1 (Setup)**: 5 tasks — migration, Zod schemas, i18n keys, rate limiting
- **Phase 2 (Foundational)**: 7 tasks — core lib modules (catalogue, soil profiles, scoring, reasons, rotation, engine orchestration, API types)
- **Phase 3 (US1 — MVP)**: 11 tasks — 5 route handlers, landing page, form, recommendation list, detail page, duplicate-detection flow
- **Phase 4 (US2)**: 3 tasks — comparison table, revenue chart, wiring
- **Phase 5 (US3)**: 4 tasks — save route, rotation display, save button wiring
- **Phase 6 (Polish)**: 6 tasks — nav link, RTL, accessibility, quickstart validation, lint/build, translation sync

Tasks organized by user story for independent implementation and testing. Parallel opportunities identified across all phases. MVP scope is US1 only.

## Outcome

- Impact: 36 actionable tasks generated in dependency order, ready for /speckit.implement
- Tests: No test tasks (not explicitly requested in spec); manual acceptance per constitution
- Files: 1 file created (specs/003-crop-recommendation/tasks.md)
- Next prompts: /speckit.implement to execute tasks; /speckit.analyze to cross-check consistency
- Reflection: Charting library approval (T025) is a blocking dependency that needs founder sign-off before US2 work begins.

## Evaluation notes (flyflywheel)

- Task granularity matches plan.md file paths
- All FR-* traced through to implementation tasks
- Edge cases (soil fallback, stale market data, duplicate season) covered in engine.ts and route handler tasks
