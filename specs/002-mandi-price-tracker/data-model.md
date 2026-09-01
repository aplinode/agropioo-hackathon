# Data Model: Mandi Price Tracker & Predictor

## Entities & Database Schemas

All schemas flow strictly through Neon Lakebase Postgres using `lib/db.ts`.

---

### 1. `crops`

Stores standardized crop metadata and localized names across all 8 supported languages.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PRIMARY KEY | Unique crop slug (e.g. `wheat`, `cotton`, `rice-basmati`) |
| `name_en` | `TEXT` | NOT NULL | English crop name |
| `name_ur` | `TEXT` | NOT NULL | Urdu crop name |
| `name_pa` | `TEXT` | NOT NULL | Punjabi crop name |
| `name_ps` | `TEXT` | NOT NULL | Pashto crop name |
| `name_sd` | `TEXT` | NOT NULL | Sindhi crop name |
| `name_skr` | `TEXT` | NOT NULL | Saraiki crop name |
| `name_bal` | `TEXT` | NOT NULL | Balochi crop name |
| `name_hno` | `TEXT` | NOT NULL | Hindko crop name |
| `category` | `VARCHAR(32)` | NOT NULL | Category e.g. `grain`, `cash_crop`, `vegetable`, `fruit` |
| `unit` | `VARCHAR(16)` | DEFAULT 'Maund' | Standard unit (40 kg Maund) |
| `icon_svg` | `TEXT` | NULLABLE | SVG icon identifier or path |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

---

### 2. `mandis`

Stores metadata for all agricultural markets across Pakistan.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PRIMARY KEY | Mandi slug (e.g. `multan-grain-mandi`) |
| `name_en` | `TEXT` | NOT NULL | English market name |
| `name_ur` | `TEXT` | NOT NULL | Urdu market name |
| `district` | `VARCHAR(64)` | NOT NULL | District name (e.g. `multan`, `lahore`, `faisalabad`) |
| `province` | `VARCHAR(32)` | NOT NULL | Province (`punjab`, `sindh`, `khyber_pakhtunkhwa`, `balochistan`, `azad_kashmir`, `gilgit_baltistan`) |
| `bordering_districts` | `TEXT[]` | NOT NULL | Array of neighboring district slugs |
| `latitude` | `NUMERIC(9,6)` | NULLABLE | Geographic latitude |
| `longitude` | `NUMERIC(9,6)` | NULLABLE | Geographic longitude |
| `is_hub` | `BOOLEAN` | DEFAULT FALSE | True if major provincial market hub |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

---

### 3. `mandi_prices`

Stores daily market price entries per crop per market.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing primary key |
| `mandi_id` | `VARCHAR(64)` | REFERENCES `mandis(id)` | Foreign key to market |
| `crop_id` | `VARCHAR(64)` | REFERENCES `crops(id)` | Foreign key to crop |
| `date` | `DATE` | NOT NULL | Trading date |
| `modal_price` | `NUMERIC(10,2)` | NOT NULL | Prevailing market price (PKR/Maund) |
| `min_price` | `NUMERIC(10,2)` | NOT NULL | Minimum traded price (PKR/Maund) |
| `max_price` | `NUMERIC(10,2)` | NOT NULL | Maximum traded price (PKR/Maund) |
| `unit` | `VARCHAR(16)` | DEFAULT 'Maund' | Price measurement unit |
| `is_holiday` | `BOOLEAN` | DEFAULT FALSE | True if Mandi closed / market holiday |
| `source` | `VARCHAR(16)` | NOT NULL DEFAULT 'govt_api' | Ingestion source — single value `govt_api` (admin_manual is intentionally not supported in this build) |
| `source_code` | `VARCHAR(32)` | NOT NULL, CHECK (`source_code IN ('amis_pk','samis_pk','fmis_kp','bmis_balochistan','pbs_spi','seed_pk_initial')`) | Which portal produced the row |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Insertion timestamp |

*Indexes*: `(mandi_id, crop_id, date DESC)`, `(crop_id, date DESC)`, `(source_code, date DESC)`.

---

### 3a. `scraper_runs` *(new — migration 0009)*

Audit log for every `POST /api/prices/ingest` call. Retained 7 days, then pruned by a nightly maintenance job.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing primary key |
| `received_at` | `TIMESTAMPTZ` | DEFAULT NOW() | When the request landed |
| `source_code` | `VARCHAR(32)` | NOT NULL | Which portal reported |
| `status` | `VARCHAR(32)` | NOT NULL, CHECK (`status IN ('ok','partial','drift_suspected','rate_limited','unauthorized','server_error')`) | Outcome |
| `rows_written` | `INT` | NOT NULL DEFAULT 0 | Rows inserted/updated |
| `rows_rejected` | `INT` | NOT NULL DEFAULT 0 | Rows that failed Zod |
| `caller_ip` | `INET` | NULLABLE | Reverse-DNS-friendly IP of the GitHub Actions runner |
| `request_id` | `UUID` | NOT NULL DEFAULT gen_random_uuid() | Idempotency / de-dup key |

*Indexes*: `(received_at DESC)`, `(source_code, received_at DESC)`. Pruned via `DELETE FROM scraper_runs WHERE received_at < NOW() - INTERVAL '7 days';` in the nightly maintenance job.

---

### 3b. `mandi_holidays` *(new — migration 0009)*

Pre-flagged public holidays and weekly closures so the scraper's drift detector does not mistake a holiday for a portal-schema break.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing primary key |
| `mandi_id` | `VARCHAR(64)` | REFERENCES `mandis(id)`, NULLABLE | Specific mandi (NULL = applies to all mandis in a province) |
| `province` | `VARCHAR(32)` | NULLABLE | Province scope when `mandi_id` is NULL |
| `date` | `DATE` | NOT NULL | Holiday date |
| `label` | `TEXT` | NOT NULL | Human-readable reason (e.g. `Sunday`, `Eid-ul-Fitr`, `Independence Day`) |
| `source_code` | `VARCHAR(32)` | NOT NULL | Which scraper pre-flagged this row |
| UNIQUE | `(mandi_id, date)` | | Idempotent insert |

*Seeded* with all Sundays for the next 12 months and the official Pakistan federal holidays for the current year via `scripts/seed-mandi-prices.ts` extension.

---

### 4. `price_predictions`

Caches daily 14-day forecasts and recommendations produced by the nightly prediction cron job.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing primary key |
| `crop_id` | `VARCHAR(64)` | REFERENCES `crops(id)` | Target crop |
| `mandi_id` | `VARCHAR(64)` | REFERENCES `mandis(id)` | Target market |
| `calculated_at` | `TIMESTAMPTZ` | NOT NULL | When forecast was generated |
| `forecast_json` | `JSONB` | NOT NULL | Array of 14 points: `[{date, predicted_price, lower_bound, upper_bound}]` |
| `recommendation` | `VARCHAR(8)` | CHECK (`recommendation IN ('SELL', 'HOLD')`) | Final decision recommendation |
| `recommendation_reason` | `TEXT` | NOT NULL | Plain-language localized reasoning |
| `volatility_warning` | `BOOLEAN` | DEFAULT FALSE | True if high volatility / limited data confidence warning |
| `model_confidence` | `NUMERIC(4,3)` | NOT NULL | Confidence score (0.00 to 1.00) |

*Indexes*: `(crop_id, mandi_id, calculated_at DESC)`

---

### 5. `price_alerts`

Stores farmer price target settings for notifications.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY DEFAULT gen_random_uuid() | Unique alert ID |
| `user_id` | `UUID` | NOT NULL REFERENCES `users(id)` | Farmer user ID |
| `crop_id` | `VARCHAR(64)` | REFERENCES `crops(id)` | Target crop |
| `mandi_id` | `VARCHAR(64)` | NULLABLE REFERENCES `mandis(id)` | Market (NULL = all nearby markets) |
| `target_price_pkr` | `NUMERIC(10,2)` | NOT NULL | Sell-only threshold (PKR/Maund) |
| `status` | `VARCHAR(16)` | CHECK (`status IN ('active', 'paused')`) | Alert status |
| `last_triggered_at` | `TIMESTAMPTZ` | NULLABLE | Last timestamp notification was sent |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Alert creation date |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Alert modification date |

*Indexes*: `(user_id, status)`, `(crop_id, status)`

---

### 6. `user_crop_preferences`

Tracks favorite crops selected by farmers for dashboard widget mini-sparklines.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `UUID` | REFERENCES `users(id)` | Farmer user ID |
| `crop_id` | `VARCHAR(64)` | REFERENCES `crops(id)` | Favorite crop ID |
| `display_order` | `INT` | DEFAULT 0 | Display priority (top 3) |
| PRIMARY KEY | `(user_id, crop_id)` | | Composite primary key |

---

## State Transitions

### Alert Lifecycle
```
[ Created ] --> (status = 'active') 
     │
     ├── Market price >= target_price ──> [ Dispatches In-App & Email Alert ]
     │                                           │
     │                                           └──> Sets last_triggered_at = NOW()
     ├── Toggle Pause ──────────────────> [ status = 'paused' ]
     ├── Toggle Resume ─────────────────> [ status = 'active' ]
     └── Delete Alert ──────────────────> [ Removed ]
```
