-- Satellite monitoring: field boundaries, NDVI snapshots, and background jobs.
-- Idempotent: safe to run multiple times.
-- Migration 0014 for the satellite monitoring feature.

CREATE TABLE IF NOT EXISTS field_boundaries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id    UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  geojson    JSONB NOT NULL,
  area_ha    NUMERIC(8,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- One active boundary per farm; old ones are soft-replaced.
  UNIQUE(farm_id)
);

CREATE INDEX IF NOT EXISTS idx_field_boundaries_farm   ON field_boundaries(farm_id);
CREATE INDEX IF NOT EXISTS idx_field_boundaries_account ON field_boundaries(account_id);

CREATE TABLE IF NOT EXISTS ndvi_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boundary_id  UUID NOT NULL REFERENCES field_boundaries(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  mean_ndvi    NUMERIC(4,3) NOT NULL,
  cloud_cover  BOOLEAN NOT NULL DEFAULT FALSE,
  image_url    TEXT NOT NULL,
  area_ha      NUMERIC(8,2),
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(boundary_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_ndvi_snapshots_boundary ON ndvi_snapshots(boundary_id);
CREATE INDEX IF NOT EXISTS idx_ndvi_snapshots_account  ON ndvi_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_ndvi_snapshots_date     ON ndvi_snapshots(snapshot_date DESC);

CREATE TABLE IF NOT EXISTS ndvi_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boundary_id  UUID NOT NULL REFERENCES field_boundaries(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  error_message TEXT,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ndvi_jobs_boundary ON ndvi_jobs(boundary_id);
CREATE INDEX IF NOT EXISTS idx_ndvi_jobs_status   ON ndvi_jobs(status);
