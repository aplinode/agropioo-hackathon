# API Contracts: Satellite Monitoring

> Phase 1 artifact. All endpoints live under `/api/satellite/`. All require a valid `agro_session` cookie unless stated otherwise.

---

## Standard Response Shapes

**Success:**
```json
{ "data": { ... } }
```

**Error:**
```json
{ "error": { "code": "<ApiErrorCode>", "message": "<human-readable>" } }
```

**New `ApiErrorCode` values** (add to `lib/http.ts`):
- `"no_imagery"` — no clear Sentinel-2 pass found in the 14-day window
- `"external_error"` — Copernicus API unreachable or returned an error
- `"forbidden"` — authenticated but does not own the resource (use instead of `not_found` per FR-9.2)

---

## Endpoints

### `POST /api/satellite/boundaries`

Save a new field boundary for a farm. Responds immediately; triggers async NDVI fetch.

**Auth**: Required (session cookie)

**Request body:**
```json
{
  "farmId": "uuid",
  "geojson": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
  }
}
```

**Validation (Zod — `lib/validation/satellite.ts`):**
- `farmId`: `z.string().uuid()`
- `geojson.type`: must equal `"Polygon"`
- `geojson.coordinates[0]`: array of `[number, number]`, min 4 pairs, first = last
- Server computes `area_ha` from bounding box; rejects if > 500 ha
- Server validates all coordinates within Pakistan bbox: lat 23–37°N, lng 60–77°E

**Success `201`:**
```json
{
  "data": {
    "boundary": {
      "id": "uuid",
      "farmId": "uuid",
      "geojson": { ... },
      "areaHa": 12.34,
      "createdAt": "2026-08-30T10:00:00Z"
    },
    "job": {
      "id": "uuid",
      "status": "pending"
    }
  }
}
```

**Error responses:**
| Status | Code | When |
|---|---|---|
| 400 | `validation_error` | Invalid GeoJSON, < 4 coords, > 500 ha, outside Pakistan |
| 401 | `unauthorized` | No valid session |
| 403 | `forbidden` | `farmId` does not belong to authenticated farmer |
| 409 | `conflict` | Farm already has a boundary (use PATCH or DELETE first) — *Note: spec FR-4.5 says replace atomically; the client must show a confirmation dialog and then call DELETE + POST or use PATCH* |

**Side effects:** Atomically replaces existing boundary if one exists (DELETE old + INSERT new + DELETE old snapshots, all in one transaction). Enqueues an `ndvi_jobs` row with `status = 'pending'`.

---

### `GET /api/satellite/boundaries?farmId=<uuid>`

Load the active field boundary for a farm.

**Auth**: Required

**Query params:** `farmId` (required, UUID)

**Success `200`:**
```json
{
  "data": {
    "boundary": {
      "id": "uuid",
      "farmId": "uuid",
      "geojson": { ... },
      "areaHa": 12.34,
      "createdAt": "2026-08-30T10:00:00Z",
      "updatedAt": "2026-08-30T10:00:00Z"
    }
  }
}
```
Returns `{ "data": { "boundary": null } }` when no boundary exists for the farm.

**Error responses:**
| Status | Code | When |
|---|---|---|
| 400 | `validation_error` | `farmId` missing or not a UUID |
| 401 | `unauthorized` | No valid session |
| 403 | `forbidden` | `farmId` does not belong to authenticated farmer |

---

### `PATCH /api/satellite/boundaries/[id]`

Update (replace) an existing boundary's GeoJSON. Deletes all existing snapshots and jobs for this boundary.

**Auth**: Required

**Path param:** `id` — boundary UUID

**Request body:** Same as POST (only `geojson` field; `farmId` inferred from the boundary row)

**Success `200`:**
```json
{
  "data": {
    "boundary": { "id": "uuid", "geojson": { ... }, "updatedAt": "..." },
    "job": { "id": "uuid", "status": "pending" }
  }
}
```

**Error responses:** Same as POST.

---

### `DELETE /api/satellite/boundaries/[id]`

Delete a field boundary and all its associated snapshots and jobs.

**Auth**: Required

**Path param:** `id` — boundary UUID

**Success `200`:**
```json
{ "data": { "deleted": true } }
```

**Error responses:**
| Status | Code | When |
|---|---|---|
| 401 | `unauthorized` | No valid session |
| 403 | `forbidden` | Boundary does not belong to authenticated farmer |
| 404 | `not_found` | Boundary ID does not exist — note: return 403 if the ID exists but belongs to another user |

---

### `GET /api/satellite/snapshots?boundaryId=<uuid>&weeks=12`

Fetch the history strip — up to 12 weekly snapshot entries for a boundary.

**Auth**: Required

**Query params:**
- `boundaryId` (required, UUID)
- `weeks` (optional, integer 1–12, default 12)

**Success `200`:**
```json
{
  "data": {
    "snapshots": [
      {
        "id": "uuid",
        "weekStart": "2026-08-25",
        "snapshotDate": "2026-08-24",
        "imageUrl": "https://res.cloudinary.com/...",
        "meanNdvi": 0.47,
        "cloudCover": false
      },
      {
        "id": "uuid",
        "weekStart": "2026-08-18",
        "snapshotDate": null,
        "imageUrl": null,
        "meanNdvi": null,
        "cloudCover": true
      }
    ]
  }
}
```
Ordered most-recent first. Cloud-cover weeks included with `cloudCover: true` and null image/NDVI fields.

---

### `GET /api/satellite/snapshots/status?farmId=<uuid>`

Polling endpoint — returns the status of the latest active NDVI job for a farm.

**Auth**: Required

**Query params:** `farmId` (required, UUID)

**Success `200`:**
```json
{
  "data": {
    "job": {
      "id": "uuid",
      "status": "processing",
      "updatedAt": "2026-08-30T10:05:00Z"
    }
  }
}
```
Returns `{ "data": { "job": null } }` when no active job exists (i.e. status is `completed` or `failed`, or no job at all).

**Client polling behaviour:** Poll every 5 seconds while `status` is `"pending"` or `"processing"`. Stop polling when `status` transitions to `"completed"` or `"failed"`, or when `job` is `null`. On `"completed"`, fetch the latest snapshot from the snapshots endpoint to load the overlay.

---

### `POST /api/satellite/cron/refresh`

Protected internal endpoint called by the GitHub Actions weekly cron workflow. Enqueues NDVI fetch jobs for all farms with an active boundary.

**Auth**: `CRON_SECRET` header (not session cookie — this is a machine-to-machine call)

**Headers:**
```
x-cron-secret: <CRON_SECRET env var value>
```

**Request body:** Empty

**Success `200`:**
```json
{
  "data": {
    "enqueued": 12,
    "skipped": 3
  }
}
```
`enqueued` = farms where a new job was created. `skipped` = farms that already had an active job (pending/processing).

**Error responses:**
| Status | Code | When |
|---|---|---|
| 401 | `unauthorized` | Missing or incorrect `x-cron-secret` header |

---

## Zod Schemas (`lib/validation/satellite.ts`)

```typescript
export const SaveBoundarySchema = z.object({
  farmId: z.string().uuid(),
  geojson: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(
      z.array(z.tuple([z.number(), z.number()])).min(4)
    ).length(1),  // outer ring only (no holes)
  }),
});

export const BoundaryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const SnapshotsQuerySchema = z.object({
  boundaryId: z.string().uuid(),
  weeks: z.coerce.number().int().min(1).max(12).default(12),
});

export const StatusQuerySchema = z.object({
  farmId: z.string().uuid(),
});

export const FarmIdQuerySchema = z.object({
  farmId: z.string().uuid(),
});
```
