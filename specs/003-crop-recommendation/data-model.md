# Data Model: Crop Recommendation Engine

**Feature**: 003-crop-recommendation
**Date**: 2026-08-30
**Status**: Complete

## Entities

### 1. Season (enum)

A Postgres enum type used as a column type across multiple tables.

```sql
CREATE TYPE season_enum AS ENUM (
  'summer', 'winter', 'autumn', 'spring', 'rainy', 'windy'
);
```

### 2. Soil Type (enum)

8 plain-language soil types plus a fallback value (`other`), translated via `translations` table.

```sql
CREATE TYPE soil_type_enum AS ENUM (
  'sandy', 'sandy_loam', 'loamy', 'clay_loam', 'clay', 'silty', 'saline', 'rocky', 'other'
);
```

`other` is the farmer's "Not sure / Other" fallback value.

### 3. Budget Bracket (enum)

```sql
CREATE TYPE budget_bracket_enum AS ENUM (
  'low', 'medium', 'high', 'very_high'
);
```

### 4. Irrigation Type (enum)

```sql
CREATE TYPE irrigation_type_enum AS ENUM (
  'rainfed', 'canal', 'tubewell', 'mixed'
);
```

### 5. Crop Category (enum)

```sql
CREATE TYPE crop_category_enum AS ENUM (
  'staple', 'cash', 'pulse', 'vegetable'
);
```

---

### 6. `crops` — Crop Catalogue

Reference table of commercially-traded Pakistani crops. Seeded via migration; admin-editable later.

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| name_en | text | no | — | English name (canonical) |
| name_key | text | no | — | i18n key in `translations` table (e.g., `app.crops.catalogue.wheat`) |
| category | crop_category_enum | no | — | staple / cash / pulse / vegetable |
| typical_yield_per_acre_kg | numeric(8,2) | no | — | > 0 |
| growing_duration_days | integer | no | — | > 0, typical days from sowing to harvest |
| season_windows | season_enum[] | no | — | Non-empty array of the 6 seasons in which this crop is planted |
| water_requirement_level | text | no | 'medium' | 'low' / 'medium' / 'high' — used for irrigation mismatch check (FR-018 edge case) |
| labour_cost_level | text | no | 'medium' | 'low' / 'medium' / 'high' |
| capital_requirement_per_acre_pkr | integer | no | — | Typical PKR per acre (seed + fertiliser + labour + irrigation) — used to filter by budget bracket |
| market_risk_baseline | text | no | 'medium' | 'low' / 'medium' / 'high' |
| notes | text | yes | — | Free-form agronomic notes |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Indexes**:
- `crops_name_en_key` UNIQUE on `(name_en)`
- `crops_category_idx` on `(category)`
- `crops_season_windows_gin` GIN index on `season_windows` for fast season-filter queries

**Validation rules**:
- `typical_yield_per_acre_kg > 0`
- `growing_duration_days > 0`
- `season_windows` is non-empty and every element is a member of `season_enum`
- `capital_requirement_per_acre_pkr > 0`

---

### 7. `crop_soil_compatibility` — crop × soil match matrix

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| crop_id | uuid | no | — | FK → crops(id) ON DELETE CASCADE |
| soil_type | soil_type_enum | no | — | |
| suitability_score | numeric(3,2) | no | — | 0.00 – 1.00 |
| ph_min | numeric(3,1) | yes | — | 0.0 – 14.0 |
| ph_max | numeric(3,1) | yes | — | 0.0 – 14.0; must be ≥ ph_min |
| notes | text | yes | — | |

**Indexes**:
- UNIQUE on `(crop_id, soil_type)`
- `crop_soil_crop_idx` on `(crop_id)`

---

### 8. `crop_rotation_rules` — ordered rotation pairs

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| previous_crop_id | uuid | no | — | FK → crops(id) ON DELETE CASCADE |
| next_crop_id | uuid | no | — | FK → crops(id) ON DELETE CASCADE |
| benefit | text | no | — | Short agronomic benefit description (English fallback) |
| reason_key | text | no | — | i18n key in `translations` (e.g., `app.crops.rotation.wheat_then_mung`) |
| suitability_score | numeric(3,2) | no | — | 0.00 – 1.00; used to rank rotation candidates |

**Indexes**:
- UNIQUE on `(previous_crop_id, next_crop_id)`
- `crop_rotation_prev_idx` on `(previous_crop_id)`

---

### 9. `soil_profiles` — district-to-soil-profile lookup

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| district | text | no | — | Administrative district name (English) |
| province | text | no | — | Punjab / Sindh / KP / Balochistan / GB / AJK |
| dominant_soil_type | soil_type_enum | no | — | |
| secondary_soil_type | soil_type_enum | yes | — | |
| ph_typical | numeric(3,1) | yes | — | |
| organic_matter_band | text | yes | — | 'low' / 'medium' / 'high' |
| notes | text | yes | — | |
| created_at | timestamptz | no | now() | |

**Indexes**:
- UNIQUE on `(district, province)`
- `soil_profiles_province_idx` on `(province)`

**Usage**: When the farmer selects "Not sure / Other" for soil type, the engine looks up the farm's `district` from its farm record and falls back to `dominant_soil_type` here. UI MUST disclose this to the farmer (FR-018 edge case).

---

### 10. `crop_price_trends` — static price-trend seed (demo fallback)

Used as a **demo-only fallback** for market price data when the Mandi Price Tracker feature (`002-mandi-price-tracker`) is not yet integrated. Replaced by a read-only view over mandi tables post-integration.

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| crop_id | uuid | no | — | FK → crops(id) ON DELETE CASCADE |
| observed_at | date | no | — | Date of observation |
| price_per_maan_pkr | numeric(10,2) | no | — | Typical mandi price in PKR per maan (~40 kg) |
| trend | text | no | 'stable' | 'up' / 'stable' / 'down' |
| volatility | numeric(4,3) | no | 0.100 | stddev / mean over recent window, 0.000 – 1.000 |

**Indexes**:
- `crop_price_trends_crop_date_idx` on `(crop_id, observed_at DESC)`

---

### 11. `crop_recommendation_requests` — farmer's input submission

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| account_id | uuid | no | — | FK → users(id) ON DELETE CASCADE |
| farm_id | uuid | no | — | FK → farms(id) ON DELETE CASCADE |
| target_season | season_enum | no | — | |
| target_year | integer | no | — | Gregorian year of the target season |
| soil_type | soil_type_enum | no | — | Includes `other` for fallback case |
| soil_is_regional_default | boolean | no | false | True when farmer chose `other` and engine used `soil_profiles` |
| irrigation_type | irrigation_type_enum | no | — | |
| budget_bracket | budget_bracket_enum | no | — | |
| weather_confidence | text | no | 'full' | 'full' / 'degraded' / 'missing' |
| market_confidence | text | no | 'full' | 'full' / 'degraded' / 'missing' |
| soil_confidence | text | no | 'full' | 'full' / 'degraded' / 'missing' |
| inputs_snapshot | jsonb | no | '{}' | Full input payload for audit |
| created_at | timestamptz | no | now() | |

**Indexes**:
- **UNIQUE** on `(farm_id, target_season, target_year)` — enforces FR-013
- `crop_rec_requests_account_idx` on `(account_id, created_at DESC)`
- `crop_rec_requests_farm_idx` on `(farm_id)`

**Lifecycle**:
- Created on a new recommendation request.
- Regenerated (deleted + recreated) when farmer explicitly regenerates.
- Archived/soft-deleted if farm is archived.

---

### 12. `crop_recommendations` — the 3 ranked outputs per request

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| request_id | uuid | no | — | FK → crop_recommendation_requests(id) ON DELETE CASCADE |
| rank | integer | no | — | 1, 2, or 3 |
| crop_id | uuid | no | — | FK → crops(id) |
| expected_revenue_per_acre_pkr | numeric(12,2) | no | — | Projection; UI MUST label as projection (FR-008) |
| revenue_confidence | text | no | 'medium' | 'high' / 'medium' / 'low' / 'unreliable' |
| reason_key | text | no | — | i18n key for plain-language reason (FR-017) |
| risk_factors | text[] | no | '{}' | Array of i18n keys |
| water_requirement_level | text | no | — | Mirrors `crops.water_requirement_level` |
| suitability_score | numeric(4,3) | no | — | 0.000 – 1.000 |
| weather_fit_score | numeric(4,3) | no | — | 0.000 – 1.000 |
| profitability_score | numeric(4,3) | no | — | 0.000 – 1.000 |
| risk_score | numeric(4,3) | no | — | 0.000 – 1.000 (higher = riskier) |
| sustainability_score | numeric(4,3) | no | — | 0.000 – 1.000 |
| final_score | numeric(4,3) | no | — | 0.000 – 1.000, weighted sum |
| data_sources_used | text[] | no | '{}' | e.g., `['weather','market','soil']` |
| data_fresheness_seconds | integer | no | — | Max age across data sources used |
| created_at | timestamptz | no | now() | |

**Indexes**:
- UNIQUE on `(request_id, rank)`
- `crop_recs_request_idx` on `(request_id)`
- `crop_recs_crop_idx` on `(crop_id)`

**Validation**:
- `rank` ∈ {1, 2, 3}
- `revenue_confidence` ∈ {'high','medium','low','unreliable'}
- `expected_revenue_per_acre_pkr ≥ 0`
- All score fields ∈ [0, 1]

**Revenue confidence band criteria** (resolves checklist CHK013 / CHK012-quality):
- `high`: all three sources (`weather`, `market`, `soil`) confidence = `full` AND price volatility < 0.15.
- `medium`: all sources present (confidence `full` or `degraded` but usable); volatility 0.15–0.30.
- `low`: exactly one source `missing`/`degraded`; volatility 0.30–0.40.
- `unreliable`: market source `missing` OR volatility > 0.40.

**Risk taxonomy** (resolves checklist CHK019 / CHK015-quality): `risk_factors` is drawn from a fixed set of i18n keys — `price_volatility`, `pest_pressure`, `weather`, `water_stress`, `input_cost`.

---

### 13. `farm_plan_entries` — saved recommendation per (farm, season, year)

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| account_id | uuid | no | — | FK → users(id) ON DELETE CASCADE |
| farm_id | uuid | no | — | FK → farms(id) ON DELETE CASCADE |
| recommendation_id | uuid | no | — | FK → crop_recommendations(id) ON DELETE CASCADE |
| target_season | season_enum | no | — | |
| target_year | integer | no | — | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Indexes**:
- **UNIQUE** on `(farm_id, target_season, target_year)` — enforces FR-011 "one saved crop per (farm, season, year)"
- `farm_plan_account_idx` on `(account_id, target_year DESC, target_season)`

---

### 14. `crop_rotation_suggestions` — 2–3 season rotation plan per saved entry

| Field | Type | Nullable | Default | Validation / Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | Primary key |
| farm_plan_entry_id | uuid | no | — | FK → farm_plan_entries(id) ON DELETE CASCADE |
| sequence_position | integer | no | — | 1, 2, 3 |
| target_season | season_enum | no | — | |
| target_year | integer | no | — | |
| crop_id | uuid | no | — | FK → crops(id) |
| reason_key | text | no | — | i18n key for plain-language reason (FR-012) |
| is_generic | boolean | no | false | True when farm has no past crop history |
| created_at | timestamptz | no | now() | |

**Indexes**:
- UNIQUE on `(farm_plan_entry_id, sequence_position)`
- `rotation_suggestions_entry_idx` on `(farm_plan_entry_id)`

---

## State Transitions

### Recommendation Request
- **Created** → engine produces 3 recommendations in the same transaction.
- **Regenerated** → original request row is deleted (cascade deletes its recommendations), a new one is inserted with the same `(farm_id, target_season, target_year)`.

### Farm Plan Entry
- **Created** when farmer taps "Save to farm plan".
- **Replaced** if farmer saves a different recommendation for the same `(farm, season, year)` (delete + insert, or upsert).
- **Deleted** if the underlying farm is archived/deleted (cascade).

### Crop Rotation Suggestion
- **Computed** at save-time (not on every view) and persisted for stability.
- **Regenerated** automatically when the underlying farm plan entry is replaced.

---

## Relationships

```
users ──< farms ──< crop_recommendation_requests ──< crop_recommendations
              │                                          │
              └──< farm_plan_entries ────────────────────┘
                         │
                         └──< crop_rotation_suggestions

crops ──< crop_soil_compatibility
     ──< crop_rotation_rules (as previous_crop or next_crop)
     ──< crop_recommendations
     ──< crop_price_trends
```

---

## Migration Ordering

`db/migrations/0009_crop_recommendation.sql`:
1. Create enums (`season_enum`, `soil_type_enum`, `budget_bracket_enum`, `irrigation_type_enum`, `crop_category_enum`).
2. Create reference tables (`crops`, `crop_soil_compatibility`, `crop_rotation_rules`, `soil_profiles`).
3. Create seed tables (`crop_price_trends`) — demo fallback.
4. Create transactional tables (`crop_recommendation_requests`, `crop_recommendations`, `farm_plan_entries`, `crop_rotation_suggestions`).
5. Seed the catalogue, soil profiles, and rotation rules for the ~12 demo crops and ~15 demo districts.

Migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING` on seed inserts).

## Translation Keys

All user-visible strings (soil-type labels, budget-bracket labels, crop names, rotation reasons, plain-language recommendation reasons) live in the `translations` table keyed under:
- `app.crops.soil.<soil_type>`
- `app.crops.budget.<bracket>`
- `app.crops.catalogue.<crop_name_en>`
- `app.crops.rotation.<previous>_<next>`
- `app.crops.reason.<reason_key>`

Seeded via `catalog/en.ts` (and 7 non-English catalog files) + `scripts/sync-translations.mts`.
