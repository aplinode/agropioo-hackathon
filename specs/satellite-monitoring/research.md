# Satellite Monitoring — Research Findings

> Phase 1 artifact. No design proposals or code. Feeds `spec.md`.

---

## Area 1: How NDVI Field Monitoring Is Typically Implemented in Agri-Tech Apps

### The Core Farmer Journey (Industry Standard)

Every serious agri-tech product (EOS Crop Monitoring, OneSoil, Cropin, Planet Pulse) converges on the same four-step loop:

1. **Field registration** — Farmer draws or imports a polygon boundary. The polygon, not a pin, is the fundamental primitive because NDVI is a field-level aggregate.
2. **Automatic periodic fetch** — The system fetches satellite passes on a schedule (Sentinel-2 revisits Pakistani latitudes every 7–10 days after cloud filtering). Farmers never initiate an imagery request manually — they just check the latest available.
3. **Color-coded health map** — NDVI is painted as a heatmap overlay inside the field boundary. Universal color convention: red (stressed/bare, NDVI < 0.2) → yellow (moderate, 0.2–0.5) → green (healthy, > 0.5). Farmers already know red = bad, green = good.
4. **Time-series history strip** — A horizontally scrollable row of thumbnail cards (date + mean NDVI) lets the farmer scroll back in time. This is the most-used feature after the map — farmers confirm fertilizer improved health 2 weeks later, track post-flood recovery.

### UX Patterns Farmers Actually Use

- **Color and label over number.** NDVI as a 0.00–1.00 decimal is not inherently meaningful. The color and a plain label ("Healthy" / "Stressed") carry the actual communication. Numbers are secondary.
- **Cloud cover communicated explicitly.** Dates with > ~30% cloud cover are shown with a cloud icon and lower opacity. Farmers learn quickly that cloudy weeks produce useless imagery when it is communicated clearly — they are not surprised.
- **Date selector strip, not calendar picker.** Sentinel-2 does not produce clean imagery on a fixed weekly schedule. A calendar implies availability that does not exist. Apps that show calendars create confusion when farmers pick a date and get nothing. A strip of available imagery dates is the correct pattern.
- **Stats card below map.** Mean NDVI, snapshot date, health label, and an interpreted message sit below the map. Health label shown large; numeric NDVI shown small.
- **Pakistan-specific:** Farmers are mobile-first, often on mid-range Android devices with intermittent 4G. Loading a 2 MB NDVI PNG on page entry without a skeleton produces poor retention. Best pattern: show the map basemap and field boundary immediately (fast), then load the NDVI overlay asynchronously with a spinner inside the field boundary area specifically — not a full-page loader.

### Anti-patterns to Avoid

- Sub-field zone/prescription maps — too complex for the first feature.
- GeoTIFF download — no demand at this user level.
- SMS/push alerts for NDVI drops — secondary to the core viewing experience.
- Other indices (EVI, SAVI) — NDVI is the one index farmers in developing markets understand by name.

---

## Area 2: Technical Approaches and Trade-offs

### The Three Copernicus APIs

#### Option A: OGC WMS Endpoint
You configure a named layer in the Sentinel Hub dashboard and add it to Leaflet as `L.tileLayer.wms()`. The `INSTANCE_ID` in the URL acts as the API key.

**Trade-offs:**
- Pro: trivially easy to wire into Leaflet (one layer call).
- Con: `INSTANCE_ID` is exposed in client-side JS — anyone can consume your quota.
- Con: no application-level cache — every map tile re-render hits Copernicus and burns PUs.
- Con: `TIME` parameter is a heuristic — you cannot guarantee a specific date.
- Con: no cloud cover metadata in the response.
- **Verdict: correct for prototyping, wrong for production.**

#### Option B: Process API (Recommended)
`POST https://sh.dataspace.copernicus.eu/api/v1/process` — you send a JSON body with input (data source, bounding box, time range), output (PNG, dimensions), and an evalscript (pixel-level NDVI computation). Returns raw PNG binary.

Authentication: OAuth2 client credentials — POST to the Copernicus token endpoint with `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET`, receive an access token (~10 min TTL), pass as `Authorization: Bearer <token>` on each call.

**Trade-offs:**
- Pro: credentials are never client-side — call is made in a server-side route handler.
- Pro: deterministic output for a specific bounding box and date range.
- Pro: upload PNG to Cloudinary once, cache URL in Neon — subsequent requests cost zero PUs.
- Pro: evalscript is fully controllable, including the colormap and cloud mask band.
- Con: not a tile service — you request the full field bounding box as one image, rendered via `L.imageOverlay`, not `L.tileLayer`.
- Con: first fetch has OAuth + image generation latency (2–8 s typical, 30 s worst case).
- **Verdict: correct production approach for this app's architecture.**

#### Option C: Statistical API
Returns numeric NDVI statistics (mean, min, max, percentiles) for a polygon over a date range without an image. Complements the Process API — use it to populate the stats card and sparkline without a separate image decode step.

### Rendering Approach Comparison

| Approach | Leaflet integration | PU cost | Mobile suitability |
|---|---|---|---|
| **PNG overlay via `L.imageOverlay`** | Single `imageOverlay(cloudinaryUrl, bounds)` | 1 call per unique (boundary, date), cached forever | Excellent — 50–200 KB static PNG |
| Tiled WMS via `L.tileLayer.wms` | One layer call | 1 PU per tile per zoom per pan — multiplies with users | Poor for quota |
| GeoTIFF + client-side Canvas decode | Download TIFF, decode with `geotiff.js` | 1 call per (boundary, date) | Poor — CPU intensive on mid-range Android |

**PNG overlay is the correct choice.** One server-side fetch, cached in Cloudinary, rendered as a static image by Leaflet. Farmers need health signal, not GIS precision.

### Processing Unit Cost Math

- Free tier: **10,000 PUs/month**.
- ~3–5 PUs per 512×512 NDVI PNG.
- With caching: 50 farmers × 12 weekly snapshots × 4 PUs = ~2,400 PUs for initial population. Repeat visits are free.
- Risk: if caching breaks between the Copernicus response and the Neon insert, the same date re-fetches on every visit, multiplying consumption rapidly.

---

## Area 3: Codebase Constraints

### Established API Pattern (Must Follow)
Every route handler follows:
1. `const session = await requireSessionApi();` — if null, return 401.
2. Zod validate input (schemas in `lib/validation/`).
3. Query Neon via `query()` / `queryOne()` from `lib/db.ts`.
4. Return via `jsonResponse()` / `errorResponse()` from `lib/http.ts`.

The `ApiErrorCode` union in `lib/http.ts` does not currently include satellite-specific codes (`no_imagery`, `external_error`). These either need to be added or mapped to `server_error` with a specific message.

### Farm Schema (Critical Constraint)
Farms store `lat` and `lng` as individual numeric columns — no polygon, no GeoJSON, no PostGIS. The satellite feature must add a new `field_boundaries` table from scratch. Existing farm coordinates are used only to center the map on initial load.

### Leaflet Setup
- Already installed: `leaflet ^1.9.4`, `react-leaflet ^5.0.0`.
- Existing pattern: `"use client"` component, dynamically imported with `ssr: false` to avoid SSR errors.
- Icon URL hack already applied in `farm-map.tsx`.
- Current tile layer: Google Maps roads (`lyrs=m`). Satellite page needs hybrid (`lyrs=y`).
- `L.imageOverlay` is already in the base `leaflet` package — no new install needed.
- `leaflet-geoman-free` is **not installed** — needs to be added for polygon drawing.

### Auth
- `agro_session` cookie is `SameSite=Lax` — automatically sent on same-origin requests. No manual token passing needed from client components.
- Boundary ownership check (`WHERE account_id = $2`) must be applied to every read and mutation, matching the pattern in farms routes.

### Cloudinary
- Already installed and used in the disease detection feature.
- Pattern: upload a `Buffer`, store the resulting URL in Neon.
- For NDVI: use a deterministic `public_id` based on `boundary_id` + `snapshot_date` so re-uploads overwrite rather than accumulate orphans.

### Navigation Shell
- `components/shell/app-sidebar.tsx` and `components/shell/bottom-tab-bar.tsx` read from an i18n bundle (`getShellBundle`).
- Adding `/satellite` requires: new icon in `components/icons.tsx`, new translation key in all 8 locale catalog files, new entry in navigation arrays.

---

## Area 4: Failure Modes and Edge Cases

### Cloud Cover (Dominant Operational Failure)
- Pakistan's Kharif season (May–October) coincides with the monsoon. Cloud cover over Punjab and Sindh in July–September routinely exceeds 70–90% on individual Sentinel-2 passes. A cotton farmer checking in August may see cloud icons for 3–4 consecutive weeks with no usable data.
- Rabi (November–April) is substantially clearer.
- Copernicus Process API does not automatically return the nearest cloud-free image — it returns imagery for the specified date range whether cloudy or not.
- Detection: add a `CLM` (cloud mask) band to the evalscript to compute the cloudy pixel fraction server-side before storing the snapshot.
- UX: always show the most recent *clear* snapshot as the default view, not today's date. Show a banner if today's snapshot is unavailable.

### Free Tier Quota Exhaustion
- 10,000 PUs/month. ~3–5 PUs per fetch. Caching prevents repeated consumption, but a caching failure causes every page visit to re-fetch.
- Mitigation: atomic DB insert immediately after Copernicus response; use deterministic Cloudinary `public_id`.
- Concurrent requests: Copernicus limits to 2 concurrent connections. Server-side token caching helps (one token reused). Per-user rate limiting on the fetch route prevents accidental quota bleed.

### First Fetch After Boundary Creation
- A newly saved boundary that triggers an NDVI fetch for "today" will often find no recent clear imagery (common in Kharif, or simply because no pass occurred today).
- The fetch should search the previous 14 days, not just today. The Process API `timeRange` supports a date range; the evalscript `mosaicking` can select the least-cloudy image in the range.
- If even a 14-day lookback finds nothing usable, show a "imagery expected within 5–10 days" message — not an error.

### Copernicus Request Latency
- Typical: 2–8 seconds. Worst case: 30+ seconds under load.
- Next.js route handlers deployed as serverless functions may have a 10-second default timeout. The route file must set `export const maxDuration = 60` if deployed on Vercel.
- Client-side: show a loading skeleton over the field polygon bounds while the fetch is in progress; surface a timeout error state after 30 seconds without crashing the page.

### OAuth Token Expiry
- ~10-minute TTL. In-memory token cache must store expiry time and refresh proactively (when < 60 seconds remaining) — not reactively after a 401. Reactive refresh doubles latency on cache miss.
- In multi-instance deployments: each worker maintains its own cache. This multiplies token requests but does not meaningfully exceed auth rate limits.

### Polygon Validation
- GeoJSON polygon requires ≥ 4 coordinate pairs (first = last to close the ring). Self-intersections, coordinates outside Pakistan's bounding box (~23°N–37°N, ~60°E–77°E), and very large polygons (covering a whole province) are all possible.
- Very large polygons inflate PU cost (output pixel dimensions scale with BBOX area). A maximum area limit must be enforced server-side.
- PostGIS topology checks are not available since boundaries are stored as `jsonb`. Zod `superRefine` must implement ring closure and minimum coordinate count checks.
- `leaflet-geoman` does not prevent self-intersecting polygons client-side.

### Cloudinary Upload / DB Insert Consistency
- If Cloudinary upload succeeds but the Neon insert fails, the image is orphaned in Cloudinary and the next request re-fetches from Copernicus.
- Mitigation: wrap upload and insert in a `try/catch`; use deterministic `public_id` so re-uploads overwrite the same asset.

### Mobile Performance
- A 512×512 NDVI PNG is 50–200 KB. On 2G/edge (rural Pakistan): 5–15 second load. `L.imageOverlay` fires `load`/`error` events — listen to them and show a skeleton until `load` fires.
- History strip: 12 thumbnails loading simultaneously spikes network. Lazy-load thumbnails that are outside the visible scroll viewport.
- Google Maps hybrid tiles (`lyrs=y`) load more data per tile than roads tiles. Consider whether the satellite basemap is worth it on mobile; alternatively, switch to hybrid only when an NDVI overlay is displayed.

---

## Key Decisions Informed by This Research

1. **Use the Process API, not WMS.** Credentials stay server-side; caching is application-controlled; cost is bounded.
2. **PNG overlay via `L.imageOverlay`.** Simplest Leaflet integration, best mobile performance, no additional libraries.
3. **Cache aggressively in Neon + Cloudinary.** Each unique (boundary, date) costs PUs exactly once.
4. **Show available imagery dates, not a calendar.** Sentinel-2 is not a fixed schedule.
5. **Default view = most recent clear snapshot, not today.** Especially critical during Kharif.
6. **Cloud cover detection in the evalscript.** Store `cloud_cover = true` so the app knows not to re-fetch.
7. **14-day lookback on first fetch.** Prevents blank state for newly created boundaries.
8. **Per-user rate limiting on the NDVI fetch route.** Prevents quota bleed from bugs or abuse.
