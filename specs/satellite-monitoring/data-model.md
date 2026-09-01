# Data Model: Satellite Monitoring

> Phase 1 artifact. Derived from `spec.md` clarifications and existing schema in `db/migrations/`.

---

## New Tables

### `field_boundaries`

Stores the single active GeoJSON polygon boundary per farm.

```sql
CREATE TABLE field_boundaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  geojson     JSONB NOT NULL,               -- GeoJSON Polygon { type, coordinates }
  area_ha     NUMERIC(10, 4) NOT NULL,      -- computed bounding-box area in hectares
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT field_boundaries_farm_unique UNIQUE (farm_id)   -- one boundary per farm
);

CREATE INDEX idx_field_boundaries_account ON field_boundaries (account_id);
CREATE INDEX idx_field_boundaries_farm    ON field_boundaries (farm_id);
```

**Constraints:**
- `farm_id` is UNIQUE — one active boundary per farm at a time. Replacing a boundary is a DELETE + INSERT wrapped in a transaction (FK cascade removes associated snapshots and jobs).
- `area_ha` is computed server-side before insert; server rejects > 500 ha.
- `geojson` is validated server-side with Zod before any DB write — not trusted from client.

---

### `ndvi_snapshots`

Stores one NDVI heatmap image per (boundary, week). Snapshots are immutable after insert.

```sql
CREATE TABLE ndvi_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boundary_id     UUID NOT NULL REFERENCES field_boundaries(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,            -- date of the Sentinel-2 pass used
  week_start      DATE NOT NULL,            -- Monday of the ISO week (for history strip grouping)
  image_url       TEXT,                     -- Cloudinary CDN URL; NULL if upload failed
  cloudinary_id   TEXT,                     -- deterministic public_id: boundary_{id}_{date}
  mean_ndvi       NUMERIC(5, 4),            -- field-level mean NDVI to 4 decimal places
  cloud_cover     BOOLEAN NOT NULL DEFAULT false,  -- true = no clear imagery this week
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ndvi_snapshots_boundary_week_unique UNIQUE (boundary_id, week_start)
);

CREATE INDEX idx_ndvi_snapshots_boundary   ON ndvi_snapshots (boundary_id, week_start DESC);
CREATE INDEX idx_ndvi_snapshots_account    ON ndvi_snapshots (account_id);
```

**Constraints:**
- One snapshot per (boundary, week) — `week_start` is always the Monday of the ISO week.
- `image_url = NULL` when Cloudinary upload failed (E10 fallback — display cloud-cover state).
- `cloud_cover = true` rows have no `image_url` or `mean_ndvi` (set to NULL).
- Snapshots are deleted atomically when their `boundary_id` is deleted (CASCADE).

---

### `ndvi_jobs`

Tracks the lifecycle of background NDVI fetch jobs. One active job per farm at a time.

```sql
CREATE TABLE ndvi_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id       UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  boundary_id   UUID NOT NULL REFERENCES field_boundaries(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,                       -- populated on status = 'failed'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ndvi_jobs_farm_status ON ndvi_jobs (farm_id, status);
CREATE INDEX idx_ndvi_jobs_boundary    ON ndvi_jobs (boundary_id);
```

**Status lifecycle:**
```
pending → processing → completed
                    ↘ failed
```

**One-job-per-farm rule:** Before inserting a new job, the server checks for any row with `farm_id = $1 AND status IN ('pending', 'processing')`. If found, the new job is not inserted — the existing job completes first. The cron refresh and boundary-save code both respect this rule.

---

## Modified Tables

### `accounts` (no change)
### `farms` (no change — lat/lng columns used only to centre the map)

---

## Schema Migration

**File**: `db/migrations/0009_satellite_monitoring.sql`

The migration creates all three tables above plus adds two new `ApiErrorCode` values (handled in application code, not DB):
- `"no_imagery"` — no clear Sentinel-2 pass found in 14-day window
- `"external_error"` — Copernicus API unreachable or returned error

---

## TypeScript Types

```typescript
// lib/satellite/types.ts

export interface FieldBoundary {
  id: string;
  farmId: string;
  accountId: string;
  geojson: GeoJSON.Polygon;
  areaHa: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NdviSnapshot {
  id: string;
  boundaryId: string;
  accountId: string;
  snapshotDate: string;       // ISO date string "YYYY-MM-DD"
  weekStart: string;           // ISO date string "YYYY-MM-DD"
  imageUrl: string | null;
  cloudinaryId: string | null;
  meanNdvi: number | null;
  cloudCover: boolean;
  createdAt: Date;
}

export interface NdviJob {
  id: string;
  farmId: string;
  boundaryId: string;
  accountId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NdviHealthLabel = 'Healthy' | 'Moderate' | 'Stressed';

export function ndviHealthLabel(meanNdvi: number): NdviHealthLabel {
  if (meanNdvi > 0.5) return 'Healthy';
  if (meanNdvi >= 0.2) return 'Moderate';
  return 'Stressed';
}
```

---

## Entity Relationships

```
accounts (1) ─────── (N) farms
farms    (1) ─────── (0..1) field_boundaries    [UNIQUE farm_id]
field_boundaries (1) ── (N) ndvi_snapshots      [CASCADE DELETE]
field_boundaries (1) ── (N) ndvi_jobs           [CASCADE DELETE]
farms    (1) ─────── (N) ndvi_jobs
```
