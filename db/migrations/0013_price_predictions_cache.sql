-- 0013 — Align price_predictions cache with crop-level nightly forecasts.
--
-- The nightly cron (POST /api/cron/predict-prices) computes forecasts
-- per crop (aggregated across all mandis) and stores the full 14-point
-- series as a JSONB array, matching data-model.md §4.
--
-- The original 0008 schema required a NOT NULL mandi_id and a
-- (crop_id, mandi_id, calculated_at) unique constraint, which does not
-- fit the crop-level aggregation. This migration:
--   1. Makes mandi_id nullable so NULL can represent "crop-level aggregate".
--   2. Replaces the three-column unique constraint with a per-crop one
--      so the cron upserts a single latest forecast per crop.

alter table public.price_predictions
  alter column mandi_id drop not null;

-- Drop the auto-generated unique constraint from 0008.
alter table public.price_predictions
  drop constraint if exists price_predictions_crop_id_mandi_id_calculated_at_key;

-- One latest forecast per crop (NULL mandi_id = crop-level aggregate).
create unique index if not exists idx_price_predictions_crop_latest
  on public.price_predictions (crop_id);
