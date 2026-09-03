# API Contracts: Mandi Price Tracker & Predictor

All API handlers live in Next.js App Router under `app/api/prices/` and return the uniform error shape on failure:
`{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }`

---

## 1. Get Current Mandi Prices

**Endpoint**: `GET /api/prices`

### Request Query Parameters
- `crop_id` *(optional, string)*: Filter by specific crop slug (e.g. `wheat`).
- `district` *(optional, string)*: Filter by district slug (e.g. `multan`).
- `query` *(optional, string)*: Global search term for crop or market name across all Pakistan.
- `include_bordering` *(optional, boolean)*: Include bordering district prices (default: `true`).

### Zod Validation Schema
```ts
export const getPricesQuerySchema = z.object({
  crop_id: z.string().optional(),
  district: z.string().optional(),
  query: z.string().optional(),
  include_bordering: z.coerce.boolean().default(true),
});
```

### Response `200 OK`
```json
{
  "success": true,
  "district": "multan",
  "is_fallback_hub": false,
  "prices": [
    {
      "mandi_id": "multan-grain-mandi",
      "mandi_name": "Multan Grain Mandi",
      "district": "multan",
       "distance_km": 12.5,
       "transport_cost_pkr": 187.50,
      "crop_id": "wheat",
      "crop_name": "Wheat (گندم)",
      "date": "2026-08-30",
      "modal_price": 4250.00,
      "min_price": 4150.00,
      "max_price": 4300.00,
      "unit": "Maund",
      "change_pct": 3.2,
      "change_pkr": 150.00,
      "is_best_price": true,
      "is_holiday": false,
      "updated_days_ago": 0
    }
  ]
}
```

---

## 2. Get Price History

**Endpoint**: `GET /api/prices/history`

### Request Query Parameters
- `crop_id` *(required, string)*: Crop identifier.
- `mandi_id` *(optional, string)*: Specific market identifier.
- `range` *(optional, enum: `'1M' | '3M' | '6M' | '12M'`, default: `'3M'`)*.

### Zod Validation Schema
```ts
export const getPriceHistoryQuerySchema = z.object({
  crop_id: z.string().min(1, "crop_id is required"),
  mandi_id: z.string().optional(),
  range: z.enum(['1M', '3M', '6M', '12M']).default('3M'),
});
```

### Response `200 OK`
```json
{
  "crop_id": "wheat",
  "range": "3M",
  "history": [
    {
      "date": "2026-06-01",
      "modal_price": 3950.00,
      "min_price": 3900.00,
      "max_price": 4000.00
    }
  ]
}
```

---

## 3. Get Price Predictions & Recommendations

**Endpoint**: `GET /api/prices/predictions`

### Request Query Parameters
- `crop_id` *(required, string)*: Crop identifier.
- `mandi_id` *(optional, string)*: Market identifier.

### Response `200 OK`
```json
{
  "crop_id": "wheat",
  "mandi_id": "multan-grain-mandi",
  "calculated_at": "2026-08-30T02:00:00Z",
  "recommendation": "HOLD",
  "recommendation_reason": "Prices are rising and expected to peak in 5 days — consider holding.",
  "volatility_warning": false,
  "model_confidence": 0.92,
  "predictions": [
    {
      "date": "2026-08-31",
      "predicted_price": 4300.00,
      "lower_bound": 4220.00,
      "upper_bound": 4380.00
    }
  ]
}
```

---

## 4. Price Alerts CRUD

**Endpoints**:
- `GET /api/prices/alerts`: List farmer's price target alerts.
- `POST /api/prices/alerts`: Create a new price target alert.
- `PUT /api/prices/alerts`: Update an alert (target price or status).
- `DELETE /api/prices/alerts?id={id}`: Remove a price alert.

### Zod Validation Schemas
```ts
export const createPriceAlertSchema = z.object({
  crop_id: z.string().min(1),
  mandi_id: z.string().optional(),
  target_price_pkr: z.number().positive(),
});

export const updatePriceAlertSchema = z.object({
  id: z.string().uuid(),
  target_price_pkr: z.number().positive().optional(),
  status: z.enum(['active', 'paused']).optional(),
});
```

---

## 5. Favourite Crops CRUD

**Endpoints**:
- `GET /api/favourites`: List farmer's favorite crop IDs with display order.
- `POST /api/favourites`: Add a crop to favorites (or reorder).
- `DELETE /api/favourites`: Remove a crop from favorites.

### Zod Validation Schemas
```ts
export const favouriteCropSchema = z.object({
  crop_id: z.string().min(1),
  display_order: z.number().int().nonnegative().optional(),
});
```

### Response `200 OK` (GET)
```json
{
  "favourites": [
    { "crop_id": "wheat", "display_order": 0 },
    { "crop_id": "cotton", "display_order": 1 },
    { "crop_id": "rice-basmati", "display_order": 2 }
  ]
}
```

---

## 6. Daily Price Ingestion (Scraper → DB)

**Endpoint**: `POST /api/prices/ingest`
**Authentication**: `Authorization: Bearer ${PRICES_CRON_SECRET}` (required, 401 on mismatch)
**Rate limit**: 10 requests/minute/IP (429 on exceed; resets each calendar minute)

### Request Body (Zod-validated)

```ts
export const ingestBatchSchema = z.object({
  source_code: z.enum(['amis_pk','samis_pk','fmis_kp','bmis_balochistan','pbs_spi']),
  scraped_at: z.string().datetime(), // ISO 8601 UTC
  rows: z.array(z.object({
    mandi_external_id: z.string().min(1),
    crop_external_id: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    modal_price: z.number().positive(),
    min_price: z.number().positive(),
    max_price: z.number().positive(),
    unit: z.literal('Maund'),
    is_holiday: z.boolean().default(false),
  })).min(1).max(5000),
});
```

The handler looks up `mandis` and `crops` by external ID (mapped via `scripts/seed-mandi-prices.ts`) and upserts into `mandi_prices` with `source='govt_api'` and `source_code` echoed from the body. Every accepted request also writes an audit row to `scraper_runs` regardless of row count.

### Response `200 OK`
```json
{
  "success": true,
  "request_id": "0d7e1d12-...-...",
  "rows_written": 142,
  "rows_rejected": 0,
  "ingested_at": "2026-08-30T06:00:00Z"
}
```

### Response — Errors
| Status | Code | When |
|---|---|---|
| 401 | `unauthorized` | Bearer missing or wrong |
| 429 | `rate_limited` | >10 req/min from same IP |
| 400 | `validation_error` | Body fails Zod |
| 500 | `server_error` | DB write failed; rollback returns row counts from before attempt |

---

## 7. Scraper Health (Operator-Facing)

**Endpoint**: `GET /api/prices/health`
**Authentication**: None (public, no PII)

### Response `200 OK`
```json
{
  "last_successful_run": "2026-08-30T05:42:11Z",
  "last_run_age_hours": 14.2,
  "sources": {
    "amis_pk":         { "status": "ok",   "last_success": "2026-08-30T05:42:11Z", "rows": 84 },
    "samis_pk":        { "status": "ok",   "last_success": "2026-08-30T05:43:01Z", "rows": 27 },
    "fmis_kp":         { "status": "drift_suspected", "last_success": "2026-08-29T05:50:01Z", "rows": 31 },
    "bmis_balochistan":{ "status": "ok",   "last_success": "2026-08-30T05:55:00Z", "rows": 11 },
    "pbs_spi":         { "status": "ok",   "last_success": "2026-08-26T05:30:00Z", "rows": 50 }
  }
}
```
