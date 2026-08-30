# Route Handler Contracts: Crop Recommendation Engine

**Feature**: 003-crop-recommendation
**Date**: 2026-08-30
**Status**: Complete

All routes require an authenticated farmer session via `requireSessionApi()`.
All request/response bodies are JSON. Errors follow the uniform shape: `{ error: { code, message } }` (constitution Principle V).

---

## POST `/api/crops`

Generate a new crop recommendation set (top-3) for a farm + target season.

**Request body**:
```json
{
  "farm_id": "uuid",
  "target_season": "winter",
  "target_year": 2026,
  "soil_type": "loamy",
  "irrigation_type": "canal",
  "budget_bracket": "medium",
  "regenerate": false
}
```

**Validation (Zod)**:
- `farm_id`: required uuid, must belong to the authenticated account.
- `target_season`: required, one of `summer | winter | autumn | spring | rainy | windy`.
- `target_year`: required integer, between current year − 1 and current year + 2.
- `soil_type`: required, one of the 8 `soil_type_enum` values (includes `other`).
- `irrigation_type`: required, one of `rainfed | canal | tubewell | mixed`.
- `budget_bracket`: required, one of `low | medium | high | very_high`.
- `regenerate`: optional boolean, default `false`.

**Behaviour**:
1. If a request already exists for `(farm_id, target_season, target_year)` and `regenerate=false` → return `409` with the existing `request_id`.
2. If `regenerate=true` → delete the existing request (cascades recommendations and rotation suggestions) before producing a new one.
3. Run the scoring engine; persist request + 3 recommendations; return the new request with its recommendations.

**Responses**:
- `201 Created` — new recommendation:
  ```json
  {
    "request": { "id": "uuid", "farm_id": "uuid", "target_season": "winter", "target_year": 2026, "soil_is_regional_default": false, "confidence": { "weather": "full", "market": "full", "soil": "full" } },
    "recommendations": [
      { "id": "uuid", "rank": 1, "crop": { "id": "uuid", "name_en": "Wheat" }, "expected_revenue_per_acre_pkr": 85000, "revenue_confidence": "high", "reason_key": "app.crops.reason.wheat_winter_loamy", "risk_factors": ["app.crops.risk.price_volatility"], "water_requirement_level": "medium", "scores": { "suitability": 0.92, "weather_fit": 0.88, "profitability": 0.81, "risk": 0.22, "sustainability": 0.70, "final": 0.83 }, "data_sources_used": ["weather","market","soil"] }
      // ... 2 more, ranks 2 and 3
    ]
  }
  ```
- `409 Conflict` — existing request for the same (farm, season, year): `{ error: { code: "recommendation_exists", message: "...", request_id: "uuid" } }`
- `401 Unauthorized` — no valid session
- `403 Forbidden` — farm not owned by the account
- `404 Not Found` — farm not found
- `422 Unprocessable Entity` — validation failure (includes Zod issues)
- `503 Service Unavailable` — weather forecast completely unavailable AND no cached advisory usable (spec edge case)

---

## GET `/api/crops`

List recommendation requests for a farm, or across the account's farms.

**Query params**:
- `farm_id` (optional, uuid) — if provided, only requests for that farm.
- `target_season` (optional, season_enum)
- `target_year` (optional, integer)
- `limit` (optional, integer, 1..50, default 20)
- `cursor` (optional, uuid) — for cursor pagination

**Responses**:
- `200 OK` — paginated list:
  ```json
  {
    "requests": [ { "id": "uuid", "farm_id": "uuid", "target_season": "winter", "target_year": 2026, "created_at": "2026-08-30T...", "recommendation_count": 3 } ],
    "next_cursor": "uuid or null"
  }
  ```
- `401 Unauthorized`
- `403 Forbidden` — farm not owned by the account
- `422 Unprocessable Entity` — invalid query params

---

## GET `/api/crops/[request_id]`

Fetch a single recommendation request with its 3 recommendations.

**Responses**:
- `200 OK` — full request + recommendations (same shape as POST 201 body)
- `401 Unauthorized`
- `403 Forbidden` — request belongs to another account
- `404 Not Found`

---

## DELETE `/api/crops/[request_id]`

Delete (regenerate-ready) a recommendation request. Used when the farmer wants to regenerate.

**Responses**:
- `204 No Content` — deleted
- `401 Unauthorized`
- `403 Forbidden` — request belongs to another account
- `404 Not Found`

---

## GET `/api/crops/catalogue`

Return the crop catalogue (used by the form's "which crop are you considering" dropdowns, and future admin UI).

**Query params**:
- `season` (optional, season_enum) — filter crops whose `season_windows` include this season.
- `category` (optional, crop_category_enum) — filter by category.
- `locale` (optional, string, default from session) — which locale to return translated names in.

**Responses**:
- `200 OK`:
  ```json
  {
    "crops": [
      { "id": "uuid", "name": "Wheat", "name_en": "Wheat", "category": "staple", "season_windows": ["winter"], "typical_yield_per_acre_kg": 800, "growing_duration_days": 120, "water_requirement_level": "medium" }
    ]
  }
  ```
- `401 Unauthorized`
- `422 Unprocessable Entity` — invalid query

---

## POST `/api/crops/save`

Save one recommended crop to the farmer's farm plan for the target (season, year). Creates a `farm_plan_entries` row and a set of `crop_rotation_suggestions`.

**Request body**:
```json
{
  "recommendation_id": "uuid"
}
```

**Validation**:
- `recommendation_id`: required uuid; must belong to a recommendation owned by the authenticated account.

**Behaviour**:
1. Upsert into `farm_plan_entries` keyed on `(farm_id, target_season, target_year)` — if one already exists, replace it.
2. Compute 2–3 rotation suggestions from `crop_rotation_rules` using the saved crop and the farm's past crop history; persist in `crop_rotation_suggestions`.
3. If no past crop history exists for the farm, set `is_generic=true` on the rotation rows and use generic rotation rules for the recommended crop.

**Responses**:
- `201 Created`:
  ```json
  {
    "farm_plan_entry": { "id": "uuid", "farm_id": "uuid", "recommendation_id": "uuid", "target_season": "winter", "target_year": 2026 },
    "rotation_suggestions": [
      { "sequence_position": 1, "target_season": "summer", "target_year": 2027, "crop": { "id": "uuid", "name": "Mung Bean" }, "reason_key": "app.crops.rotation.wheat_then_mung", "is_generic": false }
      // ... 1-2 more
    ]
  }
  ```
- `401 Unauthorized`
- `403 Forbidden` — recommendation belongs to another account
- `404 Not Found` — recommendation not found
- `422 Unprocessable Entity` — validation failure

---

## GET `/api/crops/save?farm_id=<uuid>&season=<season>&year=<year>`

Fetch the saved farm plan entry (with rotation suggestions) for a given (farm, season, year). Used by the farm records page to show what the farmer committed to planting.

**Query params**:
- `farm_id` (required uuid)
- `season` (required season_enum)
- `year` (required integer)

**Responses**:
- `200 OK` — entry + rotation suggestions, same shape as POST 201
- `404 Not Found` — no saved entry for that triple
- `401 Unauthorized`
- `403 Forbidden` — farm not owned by the account

---

## Error Shape (all routes)

```json
{ "error": { "code": "<machine_readable_code>", "message": "<human-readable message>" } }
```

Codes used: `unauthorized`, `forbidden`, `not_found`, `validation_error`, `recommendation_exists`, `service_unavailable`, `internal_error`.

## Rate Limiting

Add `cropsIp: { limit: 20, windowMs: HOUR_MS }` to `RATE_RULES` in `lib/auth/rate-limit.ts`. Applied to `POST /api/crops` and `POST /api/crops/save`.
