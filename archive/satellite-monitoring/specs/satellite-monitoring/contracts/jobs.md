# Background Job Contract: Satellite NDVI Fetch

> Phase 1 artifact. Describes the internal contract for `lib/satellite/jobs.ts` and the NDVI processing pipeline.

---

## Job Lifecycle

```
Trigger (boundary save / cron)
  └─ enqueueNdviJob(farmId, boundaryId, accountId)
       └─ INSERT INTO ndvi_jobs (status='pending')
            └─ processNdviJob(jobId)
                 ├─ UPDATE status → 'processing'
                 ├─ searchSentinel2Scene(geojson, dateRange)   [STAC API]
                 ├─ downloadBands(sceneId, bbox)               [OData/S3]
                 ├─ computeNdvi(b04Buffer, b08Buffer)          [server-side]
                 ├─ renderPng(ndviArray, width, height)        [sharp]
                 ├─ uploadToCloudinary(pngBuffer, publicId)    [Cloudinary]
                 ├─ INSERT INTO ndvi_snapshots
                 └─ UPDATE status → 'completed' | 'failed'
```

---

## `lib/satellite/jobs.ts` — Function Signatures

```typescript
// Enqueue a new job for a farm. Returns null if an active job already exists (one-per-farm rule).
export async function enqueueNdviJob(
  farmId: string,
  boundaryId: string,
  accountId: string
): Promise<NdviJob | null>

// Check if an active job (pending/processing) exists for a farm.
export async function getActiveJob(farmId: string): Promise<NdviJob | null>

// Get the latest job for a farm regardless of status (for polling).
export async function getLatestJob(farmId: string): Promise<NdviJob | null>

// Main processing function. Called after enqueue. Runs async (no await from the boundary save handler).
export async function processNdviJob(jobId: string, boundary: FieldBoundary): Promise<void>
```

---

## `lib/satellite/copernicus.ts` — Function Signatures

```typescript
// Search the Copernicus STAC API for the least-cloudy Sentinel-2 L2A scene
// covering the given bounding box in the given date range.
// Returns null if no scene with cloud_cover ≤ 30% is found.
export async function findClearScene(
  bbox: [number, number, number, number],   // [minLng, minLat, maxLng, maxLat]
  dateRange: { from: string; to: string }   // ISO date strings
): Promise<SentinelScene | null>

export interface SentinelScene {
  sceneId: string;
  date: string;           // ISO date of the pass
  cloudCoverPct: number;  // 0–100
  b04Url: string;         // OData download URL for B04 GeoTIFF
  b08Url: string;         // OData download URL for B08 GeoTIFF
}

// Download a single band GeoTIFF as a Buffer.
export async function downloadBand(url: string, apiKey: string): Promise<Buffer>
```

---

## `lib/satellite/ndvi.ts` — Function Signatures

```typescript
// Decode two GeoTIFF band Buffers, compute NDVI pixel-by-pixel,
// colourise according to the FR-5.1 scale, and return a PNG Buffer.
export async function computeAndRenderNdvi(
  b04Buffer: Buffer,
  b08Buffer: Buffer,
  width: number,
  height: number
): Promise<{ pngBuffer: Buffer; meanNdvi: number }>

// NDVI colour scale (fixed, per FR-5.1):
// NDVI < 0     → #1a1a2e  (dark — water/shadow)
// 0 to 0.2     → #e74c3c  (red — bare/stressed)
// 0.2 to 0.5   → #f39c12  (yellow — moderate)
// > 0.5        → #27ae60  (green — healthy)
```

---

## `lib/satellite/cloudinary.ts` — Function Signatures

```typescript
// Upload a PNG Buffer to Cloudinary under the satellite/ folder.
// Uses a deterministic public_id so re-uploads overwrite the same asset.
export async function uploadNdviImage(
  pngBuffer: Buffer,
  boundaryId: string,
  snapshotDate: string   // "YYYY-MM-DD"
): Promise<{ secureUrl: string; publicId: string }>
// public_id: "satellite/boundary_{boundaryId}_{snapshotDate}"
```

---

## Error Handling in `processNdviJob`

| Step | Failure | Behaviour |
|---|---|---|
| STAC scene search | No clear scene found | Store `cloud_cover = true` snapshot; set job `status = 'completed'` (not failed) |
| STAC scene search | API unreachable | Set job `status = 'failed'`; log structured error |
| Band download | Network error / timeout | Set job `status = 'failed'`; log structured error |
| NDVI computation | Invalid band data | Set job `status = 'failed'`; log structured error |
| Cloudinary upload | Upload fails | Store snapshot with `image_url = null`; set job `status = 'completed'` (E10 fallback) |
| Neon insert | DB error | Set job `status = 'failed'`; log structured error |

---

## GitHub Actions Workflow

**File**: `.github/workflows/satellite-cron.yml`

```yaml
name: Satellite NDVI Refresh

on:
  schedule:
    - cron: '0 3 * * 1'   # Every Monday at 03:00 UTC

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger NDVI refresh
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/satellite/cron/refresh" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail-with-body
```

**Required GitHub Actions secrets:**
- `APP_URL` — the deployed app URL (e.g. `https://agropioo.vercel.app`)
- `CRON_SECRET` — matches the `CRON_SECRET` env var in the deployment

---

## Structured Log Events

All log lines are JSON written to `stdout`. Format: `{ "event": "...", "ts": "ISO", ...fields }`.

| Event | Fields |
|---|---|
| `satellite.boundary.save` | `farmId`, `boundaryId`, `areaHa`, `durationMs` |
| `satellite.job.enqueued` | `jobId`, `farmId`, `boundaryId` |
| `satellite.job.skipped` | `farmId`, reason: `"active_job_exists"` |
| `satellite.copernicus.search.start` | `jobId`, `bbox`, `dateFrom`, `dateTo` |
| `satellite.copernicus.search.end` | `jobId`, `sceneId`, `cloudCoverPct`, `durationMs` |
| `satellite.copernicus.search.no_scene` | `jobId`, `dateFrom`, `dateTo` |
| `satellite.copernicus.search.error` | `jobId`, `statusCode`, `message` |
| `satellite.ndvi.processing` | `jobId`, `durationMs` |
| `satellite.cloudinary.upload.success` | `jobId`, `publicId`, `durationMs` |
| `satellite.cloudinary.upload.error` | `jobId`, `message` |
| `satellite.job.completed` | `jobId`, `meanNdvi`, `cloudCover`, `totalDurationMs` |
| `satellite.job.failed` | `jobId`, `step`, `message` |
| `satellite.cron.triggered` | `enqueued`, `skipped` |
| `satellite.cron.error` | `message`, `statusCode` |
| `satellite.snapshot.cache_hit` | `farmId`, `boundaryId`, `weekStart` |
