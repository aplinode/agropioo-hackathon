-- Offline PWA: client-generated UUID for idempotent write replay (ADR-0014.10).
-- Adds nullable client_uuid to records, farms, and detect_scans so the
-- server can deduplicate replayed offline writes via ON CONFLICT (client_uuid)
-- DO NOTHING — no duplicate rows, no flicker on sync.
-- Idempotent: safe to run multiple times.
-- Migration 0015 for the offline-first PWA feature (specs/offline-pwa/spec.md §FR-7, §ADR-0014.10).

-- records: the primary target for offline-create (FR-7).
ALTER TABLE records
  ADD COLUMN IF NOT EXISTS client_uuid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_records_client_uuid
  ON records (client_uuid)
  WHERE client_uuid IS NOT NULL;

-- farms: offline edits use PATCH (row already exists), but new-farm creation
-- via offline sync path also needs idempotency (ADR-0014.10 mentions farms
-- get the column too, even though US-4 only covers editing existing farms).
ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS client_uuid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_farms_client_uuid
  ON farms (client_uuid)
  WHERE client_uuid IS NOT NULL;

-- detect_scans: offline photo uploads queue through POST /api/detect, which
-- runs the full HuggingFace + Cloudinary pipeline and persists a scan row.
-- Replays must be idempotent — same photo must not create duplicate scans.
ALTER TABLE detect_scans
  ADD COLUMN IF NOT EXISTS client_uuid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_detect_scans_client_uuid
  ON detect_scans (client_uuid)
  WHERE client_uuid IS NOT NULL;
