# Data Model: Smart Weather Advisory

**Feature**: 002-weather-advisory  
**Date**: 2026-08-30  
**Status**: Complete

## Entities

### 1. Farm Registration (extends `farms`)

The weather advisory feature extends the existing `farms` table rather than creating a separate registration table, because the constitution's reuse discipline prefers extending established domain objects when the semantics overlap.

| Field | Type | Nullable | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| id | uuid | no | gen_random_uuid() | Primary key (existing) |
| account_id | uuid | no | — | FK → users(id), on delete cascade (existing) |
| name | text | no | — | Farm name (existing) |
| location | text | no | — | Human-readable location (existing) |
| district | text | no | — | Administrative district (existing) |
| lat | numeric(9,6) | no | — | Latitude, -90..90 (existing) |
| lng | numeric(9,6) | no | — | Longitude, -180..180 (existing) |
| crops | jsonb | no | '[]' | Array of crop enums (existing, used by farm-records) |
| primary_crop | text | yes | — | Single crop type for weather advisory; derived from `crops[0]` if null |
| sowing_date | date | yes | — | Most recent sowing date for the primary crop |
| acres | numeric(6,2) | no | — | Area size, > 0 (existing) |
| soil_type | text | yes | — | e.g., clay, loam, sandy, silt |
| irrigation_method | text | yes | — | e.g., drip, flood, sprinkler, rainfed |
| growth_stages | jsonb | no | '{}' | Stage map keyed by crop name (existing) |
| archived_at | timestamptz | yes | — | Soft delete (existing) |
| created_at | timestamptz | no | now() | (existing) |
| updated_at | timestamptz | no | now() | (existing) |

**Indexes**:
- `farms_account_idx` (existing): `(account_id, archived_at, created_at DESC)`
- New: `farms_primary_crop_idx` on `(primary_crop)` for advisory rule lookups

**State transitions**:
- `archived_at IS NULL` → active
- `archived_at IS NOT NULL` → archived (soft delete)
- Advisory generation skips archived farms.

**Validation rules**:
- `primary_crop` must be a member of the existing `CROPS` enum when provided.
- `sowing_date` must be a valid date in the past.
- `soil_type` and `irrigation_method` are free text but constrained to known enumerations at the application layer.
- `acres > 0` (existing check).

---

### 2. Weather Advisory

Represents a single day's personalized recommendation for one farm.

| Field | Type | Nullable | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| id | uuid | no | gen_random_uuid() | Primary key |
| farm_id | uuid | no | — | FK → farms(id), on delete cascade |
| account_id | uuid | no | — | FK → users(id), denormalized for query simplicity |
| advisory_date | date | no | — | The date this advisory covers |
| forecast_snapshot | jsonb | no | '{}' | Cached weather data used to generate advice |
| growth_stage | text | yes | — | Computed stage at advisory_date (seedling, vegetative, flowering, maturation, harvest-ready) |
| advice_text | text | no | — | Localized actionable recommendation |
| advice_key | text | no | — | Translation key for `advice_text` |
| severity | text | no | 'info' | Check: `info`, `warning`, `critical` |
| acknowledged | boolean | no | false | Farmer marked as seen |
| acted_upon | boolean | no | false | Farmer marked as acted upon |
| created_at | timestamptz | no | now() | |

**Indexes**:
- `weather_advisories_farm_date_idx` on `(farm_id, advisory_date DESC)` for history queries.
- `weather_advisories_account_idx` on `(account_id, created_at DESC)` for farmer-scoped lists.

**State transitions**:
- New row → `acknowledged = false`, `acted_upon = false`
- Farmer views detail → `acknowledged = true`
- Farmer marks acted → `acted_upon = true`
- No update after 24h; new row created for next day.

**Uniqueness**: One advisory per `(farm_id, advisory_date)`.

---

### 3. Weather Alert

Represents a time-sensitive notification triggered by forecasted conditions.

| Field | Type | Nullable | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| id | uuid | no | gen_random_uuid() | Primary key |
| farm_id | uuid | no | — | FK → farms(id), on delete cascade |
| account_id | uuid | no | — | FK → users(id), denormalized |
| alert_type | text | no | — | e.g., `heavy_rain`, `frost`, `extreme_heat`, `disease_risk` |
| condition_met | jsonb | no | '{}' | The forecast values that triggered the alert |
| recommendation | text | no | — | Localized action recommendation |
| recommendation_key | text | no | — | Translation key for `recommendation` |
| severity | text | no | 'warning' | Check: `warning`, `critical` |
| sent_via | jsonb | no | '[]' | Array of delivery channels used: `["in_app", "email"]` |
| sent_at | timestamptz | yes | — | Populated after successful delivery |
| read_at | timestamptz | yes | — | Populated when farmer opens notification center |
| dismissed_at | timestamptz | yes | — | Populated when farmer dismisses alert |
| created_at | timestamptz | no | now() | |

**Indexes**:
- `weather_alerts_farm_idx` on `(farm_id, created_at DESC)` for per-farm alert lists.
- `weather_alerts_account_unread_idx` on `(account_id, read_at)` where `read_at IS NULL` for notification badges.

**State transitions**:
- Created → `sent_via = []`, `sent_at = NULL`
- After delivery → `sent_via` updated, `sent_at` set
- Farmer opens notification center → `read_at` set
- Farmer dismisses → `dismissed_at` set
- No re-alert for the same condition within 6 hours (idempotency window enforced by application logic).

**Uniqueness**: No strict uniqueness; same condition can re-alert after the idempotency window.

---

## Relationships

```
users (1) ──< farms (1) ──< weather_advisories
                │
                └──< weather_alerts
```

- A `user` (farmer) owns many `farms`.
- A `farm` has many `weather_advisories` (one per day).
- A `farm` has many `weather_alerts` over time.

All FKs use `on delete cascade` so removing a farm removes its advisories and alerts.

## Migration Plan

New migration file: `scripts/migrations/0008_weather_advisory.sql`

1. Add columns to `farms`: `primary_crop`, `sowing_date`, `soil_type`, `irrigation_method`.
2. Create `weather_advisories` table with indexes and uniqueness constraint.
3. Create `weather_alerts` table with indexes.
4. Backfill `primary_crop` from `crops[0]` for existing farms.

## Growth Stage Computation

Stored in `farms.growth_stages` as JSON. For weather advisory, compute current stage at runtime:

- If `primary_crop` is null or not in `growth_stages`, stage = `generic`.
- Otherwise, look up the crop's stage map and compare `sowing_date` to today.
- If `sowing_date` is null, stage = `generic`.
- Stage boundaries are fixed per crop duration (see `lib/farms/growth-stages.ts`).
