# Route Handler Contracts: Smart Weather Advisory

**Feature**: 001-weather-advisory  
**Date**: 2026-08-30  
**Status**: Complete

All routes require an authenticated session via `requireSessionApi()`.  
All request/response bodies are JSON. Errors follow the uniform shape: `{ error: { code, message } }`.

---

## POST `/api/weather/register`

Register or update a farm's weather advisory profile (primary crop, sowing date, soil, irrigation).

**Request body**:
```json
{
  "farm_id": "uuid",
  "primary_crop": "wheat",
  "sowing_date": "2026-08-15",
  "soil_type": "loam",
  "irrigation_method": "drip"
}
```

**Validation**:
- `farm_id`: required, uuid, must belong to the authenticated account.
- `primary_crop`: required, string, must be a valid `CROPS` enum value.
- `sowing_date`: required, ISO date string, must be in the past.
- `soil_type`: required, string.
- `irrigation_method`: required, string.

**Responses**:
- `200 OK` — updated profile
- `422 Unprocessable Entity` — validation failure: `{ error: { code: "validation_error", message: "Invalid input", issues: [...] } }`
- `401 Unauthorized` — no valid session
- `404 Not Found` — farm not found or not owned by account
- `500 Internal Server Error` — server error

---

## GET `/api/weather/forecast`

Return a 7-day forecast with daily advice for a specific farm.

**Query params**:
- `farm_id` (required, uuid)

**Responses**:
- `200 OK`:
  ```json
  {
    "farm_id": "uuid",
    "farm_name": "North Field",
    "days": [
      {
        "date": "2026-08-31",
        "weather": { "temp_max": 34, "temp_min": 22, "precip_mm": 0, "humidity": 45, "description": "sunny" },
        "growth_stage": "flowering",
        "advice_key": "app.weather.advisory.recommendation.irrigation",
        "severity": "info"
      }
    ]
  }
  ```
- `401 Unauthorized`
- `404 Not Found` — farm not found or not owned
- `500 Internal Server Error`

**Degradation**: If weather provider is unavailable, returns last cached advisory with `weather_data_unavailable: true` in the response envelope.

---

## GET `/api/weather/alerts`

Return active (unread, unsent) critical alerts for the authenticated farmer.

**Query params**: none

**Responses**:
- `200 OK`:
  ```json
  {
    "alerts": [
      {
        "id": "uuid",
        "farm_id": "uuid",
        "farm_name": "North Field",
        "alert_type": "heavy_rain",
        "recommendation_key": "app.weather.alerts.heavyRain",
        "severity": "warning",
        "created_at": "2026-08-30T10:00:00Z",
        "read": false
      }
    ]
  }
  ```
- `401 Unauthorized`
- `500 Internal Server Error`

---

## POST `/api/weather/alerts/[id]/read`

Mark an alert as read.

**Responses**:
- `204 No Content`
- `401 Unauthorized`
- `404 Not Found`
- `500 Internal Server Error`

---

## GET `/api/weather/history`

Return paginated advisory history for a farm.

**Query params**:
- `farm_id` (required, uuid)
- `limit` (optional, integer, default 20, max 100)
- `cursor` (optional, string) — opaque cursor for pagination

**Responses**:
- `200 OK`:
  ```json
  {
    "items": [ /* Weather Advisory rows */ ],
    "next_cursor": "opaque-string-or-null"
  }
  ```
- `401 Unauthorized`
- `404 Not Found`
- `500 Internal Server Error`

---

## POST `/api/weather/history/[id]/acknowledge`

Mark an advisory as acknowledged or acted upon.

**Request body**:
```json
{ "action": "acknowledged" }
```
or
```json
{ "action": "acted_upon" }
```

**Responses**:
- `204 No Content`
- `422 Unprocessable Entity` — invalid action
- `401 Unauthorized`
- `404 Not Found`
- `500 Internal Server Error`

---

## POST `/api/weather/alerts/trigger` (internal/cron)

Internal endpoint to scan forecasts and enqueue alerts. Protected by cron secret, not user session.

**Auth**: `Authorization: Bearer <CRON_SECRET>`

**Responses**:
- `200 OK` — `{ "scanned": 3, "alerts_created": 1 }`
- `401 Unauthorized` — missing/invalid cron secret
- `500 Internal Server Error`
