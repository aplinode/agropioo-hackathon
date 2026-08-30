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

## 5. Daily Price Ingestion & Prediction Trigger (Cron / Admin)

**Endpoint**: `POST /api/prices/ingest` (Protected by secret `CRON_SECRET` header or admin session)

### Response `200 OK`
```json
{
  "success": true,
  "records_ingested": 142,
  "alerts_evaluated": 38,
  "alerts_triggered": 5,
  "ingested_at": "2026-08-30T06:00:00Z"
}
```
