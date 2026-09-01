# Implementation Plan: Satellite Monitoring

**Branch**: `002-mandi-price-tracker` | **Date**: 2026-08-30 | **Spec**: `specs/satellite-monitoring/spec.md`
**Input**: Feature specification from `specs/satellite-monitoring/spec.md`

---

## Summary

The satellite monitoring feature gives every farmer a color-coded NDVI heatmap of their field — drawn once as a polygon boundary, auto-fetched from Copernicus Data Space Sentinel-2 imagery, cached in Cloudinary, and served as a Leaflet image overlay on a hybrid basemap. A 12-week history strip and stats card surface health trends without requiring any GIS knowledge. The technical approach: server-side async background jobs triggered on boundary save and weekly via GitHub Actions cron; STAC API scene search + OData band download (B04/B08) + server-side NDVI computation + PNG rendering; all state persisted in Neon with `ndvi_jobs`, `field_boundaries`, and `ndvi_snapshots` tables.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24.x (Next.js 15)
**Primary Dependencies**: `leaflet ^1.9.4`, `react-leaflet ^5.0.0`, `leaflet-geoman-free` (new — polygon drawing), `sharp` (new — PNG NDVI rendering), `zod`, `react-hook-form`
**Storage**: Neon Lakebase PostgreSQL — `field_boundaries`, `ndvi_snapshots`, `ndvi_jobs` tables; Cloudinary CDN for PNG heatmap images
**Testing**: Zod schema unit tests in `lib/validation/satellite.test.ts`; route handler unit tests; manual UI acceptance run-through per AC-1–AC-33
**Target Platform**: Next.js 15 App Router, deployed on Vercel (serverless functions) or equivalent
**Performance Goals**: Boundary save p95 ≤ 500 ms; map initial load (boundary + basemap) ≤ 2 s on 4G; NDVI PNG CDN delivery ≤ 1 s after cache warm
**Constraints**: `export const maxDuration = 60` on NDVI background route handler (Copernicus worst-case 30 s + processing); one active `ndvi_jobs` row per farm at a time; Copernicus free tier 10 000 PU/month; image bytes never stored in DB or on disk
**Scale/Scope**: Hackathon demo scope — ~50 farmers, ~600 snapshots initial population; caching prevents PU blowout

---

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| Full-stack Next.js, Route Handlers only | ✅ PASS | All satellite API routes under `app/api/satellite/` |
| Neon Lakebase Postgres only | ✅ PASS | New tables in `db/migrations/0009_satellite_monitoring.sql` |
| One shared `lib/db.ts` client | ✅ PASS | All queries via existing `query()` / `queryOne()` / `withTransaction()` |
| TypeScript strict, zero escapes | ✅ PASS | All new code uses proper types; GeoJSON typed via `geojson` package |
| Chosen libraries only — new deps need approval | ⚠️ REQUIRES APPROVAL | `leaflet-geoman-free` (polygon drawing), `sharp` (PNG rendering), `geojson` (types). See Complexity Tracking. |
| Server-first components | ✅ PASS | Map component is `"use client"` only at the Leaflet boundary |
| Zod validation on all route inputs | ✅ PASS | `lib/validation/satellite.ts` with schemas for all endpoints |
| Uniform `{ error: { code, message } }` shape | ✅ PASS | New `ApiErrorCode` values: `"no_imagery"`, `"external_error"`, `"forbidden"` added to `lib/http.ts` |
| Translation keys for all 8 locales | ✅ PASS | All new strings inserted in Neon `translations` table before merge |
| Secrets in env vars only | ✅ PASS | `COPERNICUS_API_KEY`, `CRON_SECRET` in `.env.example`; never logged |
| Farmer-first, outdoor-mobile | ✅ PASS | Async load, visible skeleton, plain-language labels, touch targets ≥ 44×44 px |

---

## Project Structure

### Documentation (this feature)

```text
specs/satellite-monitoring/
├── plan.md              ← this file
├── research.md          ← Phase 0 (complete)
├── spec.md              ← source of truth (clarified)
├── data-model.md        ← Phase 1 (below)
├── quickstart.md        ← Phase 1 (below)
├── contracts/
│   ├── api.md           ← Phase 1 (below)
│   └── jobs.md          ← Phase 1 (below)
└── tasks.md             ← Phase 2 (/speckit-tasks command — NOT here)
```

### Source Code Layout

```text
app/
├── (farmer)/
│   └── (dashboard)/
│       └── satellite/
│           ├── page.tsx                    # Server Component — SSR farm list
│           ├── satellite-view.tsx          # "use client" shell — farm selector + state
│           ├── satellite-map.tsx           # "use client" — Leaflet map, boundary draw/edit
│           ├── ndvi-stats-card.tsx         # "use client" — snapshot date, mean NDVI, label
│           ├── history-strip.tsx           # "use client" — 12-week horizontal scroll
│           └── ndvi-legend.tsx             # pure component — color legend overlay
├── api/
│   └── satellite/
│       ├── boundaries/
│       │   └── route.ts                    # POST (save), GET (load for farm)
│       ├── boundaries/[id]/
│       │   └── route.ts                    # PATCH (edit), DELETE
│       ├── snapshots/
│       │   └── route.ts                    # GET list (history strip)
│       ├── snapshots/status/
│       │   └── route.ts                    # GET polling endpoint
│       └── cron/
│           └── refresh/
│               └── route.ts               # POST — GitHub Actions cron trigger

lib/
├── satellite/
│   ├── copernicus.ts                       # STAC search + OData band download
│   ├── ndvi.ts                             # B04/B08 → NDVI float array → colorised PNG Buffer
│   ├── cloudinary.ts                       # upload PNG Buffer → CDN URL
│   └── jobs.ts                             # ndvi_jobs table helpers (enqueue, poll, lock)
└── validation/
    ├── satellite.ts                        # Zod schemas for all satellite route inputs
    └── satellite.test.ts                   # Unit tests for schemas

db/migrations/
└── 0009_satellite_monitoring.sql           # field_boundaries, ndvi_snapshots, ndvi_jobs

.github/
└── workflows/
    └── satellite-cron.yml                  # Weekly cron → POST /api/satellite/cron/refresh
```

---

## Complexity Tracking

| New Dependency | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `leaflet-geoman-free` | Polygon draw mode with vertex snapping and close-polygon interaction on mobile | `leaflet.draw` is unmaintained (last release 2019), no touch support for polygon close; hand-rolling polygon drawing logic is out of scope |
| `sharp` | Server-side rendering of NDVI float array → colourised PNG Buffer | `canvas` npm package requires native Cairo bindings — won't build on Vercel serverless; `jimp` is pure-JS but 10× slower for pixel operations |
| `geojson` (types only) | TypeScript types for `GeoJSON.Polygon`, `GeoJSON.Feature` | `@types/geojson` provides these; no runtime cost |

---

## Phase 0: Research Resolution

All NEEDS CLARIFICATION items resolved via spec clarification sessions. Key decisions:

| Decision | Chosen | Rationale |
|---|---|---|
| Copernicus API surface | STAC search + OData band download | Free tier, no PU cost for band data, full control over NDVI computation |
| Authentication | `COPERNICUS_API_KEY` env var | Free Copernicus Data Space account; no OAuth2 required for OData access |
| NDVI computation | Server-side from B04 + B08 GeoTIFFs | Deterministic, no evalscript quota, controllable cloud masking |
| Image storage | Cloudinary CDN | Already in stack (detect feature); deterministic `public_id` prevents orphans |
| Map library | Leaflet + `leaflet-geoman-free` | Already installed; geoman replaces unmaintained `leaflet-draw` |
| Job persistence | Neon `ndvi_jobs` table | Survives cold starts; consistent with rest of data layer |
| Scheduled refresh | GitHub Actions weekly cron | No extra infrastructure; free on public/private repos |
| Cron failure handling | Structured log + next-run retry | Farmers see cached snapshot; no noise notification |
| Boundary save latency | ≤ 500 ms p95 | Boundary save is a simple DB write; Copernicus runs async |
| Observability | Structured JSON logs | Right-sized for hackathon; no OTel setup overhead |

> **Note on Process API vs STAC+OData:** The research.md recommends Sentinel Hub Process API (OAuth2 + evalscript). The clarification session chose STAC+OData raw band download instead. The STAC+OData approach is lower-level (requires manual band download + server-side computation with `sharp`) but avoids PU quota concerns for band data entirely. Both are valid; this plan follows the clarified decision.

---

## Phase 1: Data Model

See `specs/satellite-monitoring/data-model.md` (generated below).

---

## Phase 1: API Contracts

See `specs/satellite-monitoring/contracts/api.md` and `contracts/jobs.md` (generated below).
