---
id: 003
title: Plan Satellite Monitoring Feature
stage: plan
date: 2026-08-30
surface: agent
model: qoder
feature: satellite-monitoring
branch: 002-mandi-price-tracker
user: Sheikh Mohammad
command: /speckit-plan @specs/satellite-monitoring/
labels: ["plan","satellite","ndvi","leaflet","copernicus","cloudinary","github-actions"]
links:
  spec: specs/satellite-monitoring/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/satellite-monitoring/plan.md
  - specs/satellite-monitoring/data-model.md
  - specs/satellite-monitoring/contracts/api.md
  - specs/satellite-monitoring/contracts/jobs.md
  - specs/satellite-monitoring/quickstart.md
  - AGENTS.md
tests:
  - null
---

## Prompt

/speckit-plan @specs/satellite-monitoring/

## Response snapshot

Generated full implementation plan for the satellite monitoring feature. Phase 0 research resolved (all clarifications from previous sessions applied). Phase 1 artifacts produced:

- plan.md: technical context, constitution check, project structure, complexity tracking, phase 0 decisions
- data-model.md: field_boundaries, ndvi_snapshots, ndvi_jobs tables with full SQL, TypeScript types, entity relationships
- contracts/api.md: all 6 API endpoints with request/response shapes, Zod schemas, error codes
- contracts/jobs.md: background job lifecycle, function signatures for copernicus.ts/ndvi.ts/cloudinary.ts/jobs.ts, GitHub Actions workflow YAML, structured log event catalog
- quickstart.md: developer setup guide, build order, key implementation notes
- AGENTS.md: SPECKIT block updated to reference plan.md

Constitution check: PASS (with approved new dependencies: leaflet-geoman-free, sharp, geojson types).

## Outcome

- ✅ Impact: Full implementation blueprint ready; database schema, API contracts, job pipeline, and cron workflow all specified
- 🧪 Tests: No tests run (plan phase)
- 📁 Files: plan.md, data-model.md, contracts/api.md, contracts/jobs.md, quickstart.md, AGENTS.md
- 🔁 Next prompts: /speckit-tasks
- 🧠 Reflection: Key architectural note — research.md recommends Sentinel Hub Process API (OAuth2 + evalscript) but clarifications chose STAC+OData raw band download. Both valid; plan follows clarified decision and documents the divergence explicitly.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Proceed to /speckit-tasks
