# Quickstart: Satellite Monitoring Feature

> Developer guide for implementing the satellite monitoring feature. Read `plan.md`, `data-model.md`, and `contracts/api.md` first.

---

## Prerequisites

1. **Copernicus Data Space account** — Register free at [dataspace.copernicus.eu](https://dataspace.copernicus.eu). Generate an API key under your account settings.

2. **Environment variables** — Add to your `.env.local`:
   ```bash
   COPERNICUS_API_KEY=your_key_here
   CRON_SECRET=generate_with_node_crypto   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Cloudinary vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are already in use — confirm they are set.

3. **New packages to install** (after approval per constitution):
   ```bash
   npm install leaflet-geoman-free sharp
   npm install --save-dev @types/leaflet-geoman-free
   ```

---

## Database Migration

Run the new migration:
```bash
npx tsx scripts/migrate.ts
# or however existing migrations are applied in this project
```

Migration file: `db/migrations/0009_satellite_monitoring.sql`

Creates: `field_boundaries`, `ndvi_snapshots`, `ndvi_jobs` tables.

---

## Build Order (follow task decomposition in tasks.md)

1. **Migration** → `0009_satellite_monitoring.sql`
2. **Types + validation** → `lib/satellite/types.ts`, `lib/validation/satellite.ts`
3. **Lib modules** → `copernicus.ts`, `ndvi.ts`, `cloudinary.ts`, `jobs.ts` (in this order — each depends on the previous)
4. **API routes** → boundaries POST/GET → boundaries PATCH/DELETE → snapshots GET → snapshots/status GET → cron/refresh POST
5. **UI components** → `ndvi-legend.tsx` → `ndvi-stats-card.tsx` → `history-strip.tsx` → `satellite-map.tsx` → `satellite-view.tsx` → `page.tsx`
6. **Navigation** → add satellite icon + nav entry to sidebar and bottom tab bar
7. **Translations** → insert all new string keys into Neon `translations` table for all 8 locales
8. **GitHub Actions workflow** → `.github/workflows/satellite-cron.yml`
9. **Tests** → `lib/validation/satellite.test.ts`, route handler tests

---

## Key Implementation Notes

### Leaflet Map Component

- Dynamically import with `ssr: false` (same pattern as `farm-map.tsx`).
- Use `leaflet-geoman-free` for polygon drawing (`map.pm.enableDraw('Polygon')`).
- Switch tile layer to hybrid: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`.
- NDVI overlay: `L.imageOverlay(snapshot.imageUrl, bounds, { opacity: 0.7 })`. Listen to `load` and `error` events to replace the skeleton.

### NDVI Background Job

- In the boundary save route handler, after the DB insert, fire `processNdviJob()` without `await` — do not block the response.
- Set `export const maxDuration = 60` at the top of any route file that directly calls Copernicus (or the background processing module).
- The polling endpoint (`/api/satellite/snapshots/status`) is lightweight — just a DB read.

### Copernicus STAC Search

- Endpoint: `https://catalogue.dataspace.copernicus.eu/stac/v1/search`
- Filter: `collections: ["SENTINEL-2"]`, `datetime`, `intersects` (field GeoJSON polygon)
- Sort by `cloud_cover` ascending to get the least-cloudy scene first.
- Authentication: `Authorization: ApiKey <COPERNICUS_API_KEY>` header.

### Band Download

- After finding a scene via STAC, download B04 and B08 GeoTIFFs via the OData API or the S3-compatible endpoint listed in the STAC item's `assets`.
- Parse GeoTIFF with a library like `geotiff.js` (`npm install geotiff`) to extract the raw pixel array.

### NDVI PNG Rendering with `sharp`

```typescript
// Pseudocode
const ndviPixels = computeNdvi(b04Array, b08Array);  // Float32Array
const rgbaBuffer = ndviToRgba(ndviPixels);            // Uint8ClampedArray (R,G,B,A per pixel)
const png = await sharp(Buffer.from(rgbaBuffer.buffer), {
  raw: { width, height, channels: 4 }
}).png().toBuffer();
```

### Deterministic Cloudinary `public_id`

```typescript
const publicId = `satellite/boundary_${boundaryId}_${snapshotDate.replace(/-/g, '')}`;
// e.g. "satellite/boundary_550e8400..._20260824"
// Re-uploading the same ID overwrites the asset — no orphans.
```

---

## Testing Checklist

Run through AC-1 to AC-33 manually after implementation. Key stubs for automated tests:

- Stub Copernicus to return a known scene → verify snapshot row is created with correct `mean_ndvi`.
- Stub Copernicus to return 500 → verify job reaches `failed` status; page shows cached overlay.
- Stub Cloudinary upload failure → verify snapshot stored with `image_url = null`; no crash.
- Stub 35-second Copernicus delay → verify client shows timeout state after 30 s.
- Submit polygon > 500 ha → verify 400 response.
- Submit polygon outside Pakistan bbox → verify 400 response.

---

## GitHub Actions Setup

After deploying:
1. In the GitHub repo → Settings → Secrets and variables → Actions.
2. Add `APP_URL` (your deployed URL) and `CRON_SECRET` (same value as the deployment env var).
3. The workflow in `.github/workflows/satellite-cron.yml` fires every Monday at 03:00 UTC.
