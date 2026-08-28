# Plan — Farm Records

> Status: DRAFT awaiting founder sign-off. Implements `spec.md` in this folder.
> Stack constraints honored: Next.js 16 App Router, Route Handlers as the API layer,
> Neon Lakebase Postgres via the shared `lib/db.ts` client, uniform
> `{ error: { code, message } }` shape, Zod at every boundary, no new dependencies
> outside the constitution's chosen-libraries table.

## Approach in one paragraph

Feature-scoped Route Handlers under `app/api/farms/` and `app/api/records/` own every
data mutation and query; the farmer-app pages stay thin server shells that pass typed
bundles to small client components for interactivity (forms, Leaflet map picker,
pagination). Ownership and session validity are enforced server-side before any DB
touch by reusing the existing `requireSessionApi()` guard; every failure returns the
uniform `{ error: { code, message } }` shape from `lib/http.ts`. The map layer is
Leaflet + OpenStreetMap tiles (no API key, per spec FR23); weather uses OpenWeatherMap
(current weather + historical lookup by lat/lon/date) with a server-side env key and
immutable snapshot stored on each record. Growth-stage auto-advance and health scoring
run in pure helpers so they are unit-testable and never leak UI concerns into handlers.

## Key decisions & trade-offs

| # | Decision | Chosen | Alternatives rejected (why) |
|---|---|---|---|
| K1 | Map provider | **Leaflet + OpenStreetMap tiles** (spec FR23, no API key). Pin saved as `{lat, lng}` JSONB on farm. | Google Maps JS API (requires key/billing; spec explicitly mandates OSM; adds latency + quota risk for a demo) |
| K2 | Weather provider | **OpenWeatherMap** — current weather for farm detail, historical/current by lat/lon + date for record creation (spec FR19–22). Key server-side only in `OPENWEATHER_API_KEY`. | Mock weather only (spec requires real auto-fetch with fallback); WeatherAPI / Open-Meteo (OpenWeatherMap already chosen elsewhere in repo; one provider keeps env small) |
| K3 | Session/authorization | Reuse **`requireSessionApi()`** from `lib/auth/guards.ts`. Every handler calls it first; scopes all queries to `account_id`. | New per-feature guard (duplicates tested logic); client-side checks (forbidden by constitution) |
| K4 | Validation | **Zod schemas** in `lib/validation/farms.ts` shared by forms and handlers. | Hand-rolled checks in handlers (drift risk); client-only validation (spec requires server boundary) |
| K5 | Map UI | **`react-leaflet`** wrapper + draggable marker in a client component embedded in farm create/edit forms. Height tokens: 300px mobile / 400px desktop. | Raw Leaflet imperative API inside RSC (violates server-first); Google Maps React (K1) |
| K6 | Growth stage storage | **JSONB map on `farms`**: `{ "wheat": "Sowing", "cotton": "Vegetative" }`. Updated by handler logic on record create; manual override writes directly. | Separate `farm_crop_stages` table (over-normalized for a 5-crop fixed list; more joins for every read) |
| K7 | Weather snapshot shape | **JSONB on `records`**: `{ condition, temp_c, humidity, fetched_at }`. Immutable after insert. | Separate `record_weather` table (1:1 with no lifecycle of its own; extra join on every timeline read) |
| K8 | Pagination | **Cursor-based**: `?cursor=<created_at>|<id>&dir=prev&limit=20`. Sorted `event_date DESC, created_at DESC`. | Offset pagination (skips on concurrent inserts; spec explicitly mandates cursor) |
| K9 | Health indicator | **Server-side computed chip**: `good` / `watch` derived from record recency + crop stage vs expected. Computed at read time, not stored. | Stored column (requires update trigger on every record change; computed is cheap and always fresh) |
| K10 | District list | **Static array in `lib/validation/farms.ts`** of all Pakistan districts, used both in Zod enum and UI `<datalist>` search. | DB table (migration overhead for static reference data; no admin edit requirement in spec) |

## Library parameters (fixed here per spec header)

- **zod** schemas in `lib/validation/farms.ts`: `createFarmSchema`, `updateFarmSchema`, `createRecordSchema`, `updateRecordSchema`, `listRecordsQuerySchema`. All dates as ISO strings validated by Zod.
- **react-hook-form + @hookform/resolvers** in client forms; schemas imported from `lib/validation/farms.ts` so client and server never drift.
- **react-leaflet** (new dependency — map UI is a hard spec requirement with no lighter alternative in the allowed set; already approved by founder for map needs).
- **OpenWeatherMap** endpoint: `/data/2.5/weather` for current; `/data/2.5/weather` with `dt` parameter for historical by date. Key from `OPENWEATHER_API_KEY` env var. Timeout 5 s; failure → farmer manually selects condition.

## Database schema — `db/migrations/0003_farm_records.sql`

```sql
-- 0003 — Farm Records schema (specs/farm-records/spec.md)

create table if not exists public.farms (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.users(id) on delete cascade,
  name          text not null,
  location      text not null,
  district      text not null,
  lat           numeric(9,6) not null,
  lng           numeric(9,6) not null,
  crops         jsonb not null default '[]'::jsonb,
  acres         numeric(6,2) not null check (acres > 0),
  growth_stages jsonb not null default '{}'::jsonb,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists farms_account_idx on public.farms (account_id, archived_at, created_at desc);

create table if not exists public.records (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms(id) on delete cascade,
  account_id    uuid not null references public.users(id) on delete cascade,
  type          text not null check (type in ('sowing','planting','irrigation','fertilizer','pesticide','disease','harvest')),
  season        text not null check (season in ('Summer','Winter','Rainy','Dry')),
  year          text not null,
  event_date    date not null,
  title         text,
  note          text,
  weather       jsonb not null default '{}'::jsonb,
  yield_qty     numeric(10,2),
  labor_cost     numeric(10,2),
  transport_cost numeric(10,2),
  created_at    timestamptz not null default now()
);
create index if not exists records_farm_idx on public.records (farm_id, event_date desc, created_at desc);
create index if not exists records_account_idx on public.records (account_id);
```

No RLS yet (all access flows through Route Handlers; tables are reached only
server-side).

## API routes (all under `app/api/farms/` or `app/api/records/`, all POST/PATCH/DELETE unless noted)

Uniform responses: success = JSON body relevant to caller; failure =
`{ error: { code, message } }` with status. Error codes pinned:
`validation_error` (400/422) · `unauthorized` (401) · `not_found` (404) · `server_error` (500).

### Farms

| Route | Method | Auth | Body/Query (Zod) | Behaviour pins |
|---|---|---|---|---|
| `/api/farms` | GET | session | `listFarmsQuerySchema` (none required) | Returns only `account_id = session.account_id AND archived_at IS NULL`, sorted `created_at DESC`. Each row includes computed `health` chip + aggregated season chips from records. Empty array when zero farms. |
| `/api/farms` | POST | session | `createFarmSchema` | Validates name, location, district, crops (array, min 1, from fixed list), acres (>0), lat/lng. Attaches `account_id` from session. Initializes `growth_stages` map with all crops at `"Sowing"`. Returns full farm row. |
| `/api/farms/[id]` | GET | session | – | Validates ownership via join (`farm.account_id = session.account_id AND farm.archived_at IS NULL`). Returns farm detail with computed `health`, current weather snapshot (fetched server-side via OpenWeatherMap from `lat/lng`), and last 5 records. |
| `/api/farms/[id]` | PATCH | session | `updateFarmSchema` | Editable: name, location, district, crops, acres, lat/lng, `growth_stages` (manual override per crop). `account_id` cannot change. Ownership check first. |
| `/api/farms/[id]/archive` | POST | session | – | Sets `archived_at = now()`. Farm disappears from list; records preserved. Idempotent. |
| `/api/farms/[id]/restore` | POST | session | – | Sets `archived_at = NULL`. |
| `/api/farms/[id]` | DELETE | session | – | If any records exist → `409` with message `"Delete all records first."`. If zero records → hard delete. Ownership check first. |

### Records

| Route | Method | Auth | Body/Query (Zod) | Behaviour pins |
|---|---|---|---|---|
| `/api/farms/[id]/records` | GET | session | `listRecordsQuerySchema` (cursor, limit, season?, year?) | Validates farm ownership + not archived. Paginated 20/page, cursor `created_at|id`. Sort `event_date DESC, created_at DESC`. Supports `season` + `year` filter. |
| `/api/records` | POST | session | `createRecordSchema` | Fields: farm_id, type, season, year, event_date, title, note, weather override dropdown, yield_qty/labor_cost/transport_cost (harvest only). Server attaches `account_id` + `farm_id`. Auto-fetches weather from OpenWeatherMap using farm lat/lng + event_date; farmer can override condition before save. Snapshot stored as JSONB. Auto-advances growth stage per FR16. |
| `/api/records/[id]` | PATCH | session | `updateRecordSchema` | Same fields as create minus farm/season/year/event_date/created_at (immutable per spec). Ownership enforced through farm ownership check. |
| `/api/records/[id]` | DELETE | session | – | Hard delete. Ownership enforced. |

### Weather helper

| Route | Method | Auth | Query | Behaviour pins |
|---|---|---|---|---|
| `/api/weather/current` | GET | session | `lat`, `lng` | Server-side OpenWeatherMap call. Returns `{ condition, temp_c, humidity, fetched_at }`. 5 s timeout; on failure returns `{ condition: null, ... }`. Used by farm detail page. |

## File map (new/edited)

```
lib/db.ts                                   EXISTS (shared client — reused as-is)
lib/http.ts                                EXISTS (errorResponse helpers — reused as-is)
lib/validation/farms.ts                    NEW  Zod schemas for farms + records + queries
lib/validation/farms.test.ts               NEW  schema validation tests
lib/farms/health.ts                        NEW  computeFarmHealth(farm, recentRecords) → "good" | "watch"
lib/farms/growth-stages.ts                 NEW  CROP_STAGES constant + autoAdvanceStage(map, type, crop) + computeCurrentStage(map, crop)
lib/farms/weather.ts                       NEW  fetchCurrentWeather(lat, lng) → OpenWeatherMap call
lib/farms/districts.ts                     NEW  PAKISTAN_DISTRICTS constant (all districts)
lib/farms/constants.ts                     NEW  CROPS, RECORD_TYPES, SEASONS, WEATHER_CONDITIONS, STAGE_SEQUENCES

db/migrations/0003_farm_records.sql         NEW  schema above

app/api/farms/route.ts                     NEW  GET list + POST create
app/api/farms/[id]/route.ts                NEW  GET detail + PATCH update + DELETE
app/api/farms/[id]/archive/route.ts        NEW  POST archive
app/api/farms/[id]/restore/route.ts        NEW  POST restore
app/api/farms/[id]/records/route.ts        NEW  GET list records
app/api/records/route.ts                   NEW  POST create
app/api/records/[id]/route.ts              NEW  PATCH update + DELETE
app/api/weather/current/route.ts           NEW  GET current weather proxy

app/(farmer)/(dashboard)/farms/page.tsx     EDIT  replace demoFarms with real API fetch
app/(farmer)/(dashboard)/farms/new/page.tsx EDIT  wire form to POST /api/farms; embed Leaflet map
app/(farmer)/(dashboard)/farms/new/farm-form.tsx EDIT react-hook-form + zodResolver + Leaflet picker
app/(farmer)/(dashboard)/farms/[id]/page.tsx EDIT  real detail with map, weather, records, actions
app/(farmer)/(dashboard)/farms/[id]/records/page.tsx EDIT real paginated records list
app/(farmer)/(dashboard)/records/new/record-form.tsx EDIT wire to POST /api/records; weather fetch + override; harvest fields
app/(farmer)/(dashboard)/farms/farms-bundle.ts EDIT extend with new copy keys for edit/archive/delete/records
app/(farmer)/(dashboard)/farms/demo-data.ts EDIT keep as fallback only; all pages prefer API data
```

## Behavior notes the plan pins down

- **Authorization order** (spec FR10/FR11): `requireSessionApi()` → ownership check → query. Any failure → identical `{ error: { code, message } }` response. Logs may say why; responses never do.
- **Map picker UX**: embedded Leaflet map centers Pakistan by default (`[30.3753, 69.3451]`, zoom 6); tap drops a pin; pin is draggable; form reads `{lat, lng}` from marker position on submit. No API key required (OSM tiles).
- **Weather auto-fetch on record create**: handler calls `fetchCurrentWeather(lat, lng)` with `dt` parameter set to record date. If OpenWeatherMap returns data → snapshot stored. If call fails or returns 404 for past date → server stores empty snapshot; UI shows override dropdown so farmer picks condition. Record save never fails due to weather.
- **Growth stage auto-advance**: happens inside `POST /api/records` handler after Zod validation. If `growth_stages[crop] === "Sowing"` and record type is `sowing|planting` → advance one stage. If `harvest` → set final stage. Manual override via `PATCH /api/farms/[id]` writes the map directly; subsequent record creates check the stored value and skip auto-advance if it differs from the default sequence.
- **Health chip**: computed server-side from two signals: (1) most recent record type per crop recency vs expected cadence, (2) whether any crop is behind its stage for the current season. `good` = all crops recent + on-track; `watch` = anything lagging. Computed on every detail read; not stored.
- **Archive/restore/delete cascade**: archive is soft (`archived_at`); restore clears it. Delete is hard only when `SELECT COUNT(*) FROM records WHERE farm_id = X` returns 0; otherwise 409 with spec-pinned message.
- **Farm detail weather**: server fetches current weather from OpenWeatherMap on each page load using farm lat/lng; returned as part of detail JSON. Client renders a small inline chip. Not cached server-side (spec FR21 says "cached from OpenWeatherMap" but clarifies it is fetched on page load; server-side caching is an optional future enhancement).
- **Concurrent creates**: no unique constraint on farm name per account; multiple tabs can create farms simultaneously. Record creates are similarly unrestricted.
- **Future-dated records**: allowed by schema (`event_date` is `date`, no CHECK against today); visible in timeline sorted by `event_date DESC` regardless of whether date is in the future.

## Build order (tasks follow after plan approval)

1. Migration `0003` applied + `lib/farms/constants.ts` + `lib/farms/districts.ts` + validation schemas + tests + commit.
2. `lib/farms/health.ts` + `lib/farms/growth-stages.ts` + unit tests + commit.
3. `lib/farms/weather.ts` + OpenWeatherMap integration tests (mock fetch) + commit.
4. Farms CRUD handlers (`route.ts`, `[id]/route.ts`, archive/restore) + handler tests via direct invocation + commit.
5. Records CRUD handlers (`records/route.ts`, `records/[id]/route.ts`) + growth-stage auto-advance wiring + handler tests + commit.
6. Weather proxy route + commit.
7. Farm form pages wired (new form, detail page, records page, archive/restore/delete UI) + manual smoke + commit.
8. Record form wired (new/edit) + weather override UI + harvest fields + manual smoke + commit.
9. Farms list page switched from demo data to API + empty state + commit.
10. `npm run lint && npm run test && npm run build` + final AC checklist + commit.

Commits stay atomic per task-group; feature branch `feat/farm-records`,
PR-reviewed by founder before merge.

## Risks

- **OpenWeatherMap free tier limits** (60 calls/min): acceptable for demo; farm detail + record create are the only callers. Burst-safe for single-judge demo. Move to cached server-side store if limits hit.
- **react-leaflet bundle size**: adds ~30 kB gzip. Justified because spec mandates embedded map; lighter alternatives would require custom Leaflet wiring that duplicates the library's value.
- **Concurrent tab creates**: no farm-name uniqueness, so simultaneous creates all succeed. If this becomes a UX problem, add a post-save redirect to the new farm's detail page.
- **Historical weather gaps**: OpenWeatherMap may not return data for very old dates. Spec FR19 already anticipates this with manual fallback; handler never blocks save on weather failure.
- **Pakistan district completeness**: list is static in code; if districts change, a migration-style update to `lib/farms/districts.ts` is needed. No admin UI for districts is in spec, so this is acceptable.
