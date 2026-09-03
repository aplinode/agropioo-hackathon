# Research: Farm Profit/Loss Calculator (Feature #7)

## CACP Data Source Research

### Finding: No Public REST API Available

The Commission for Agricultural Costs and Prices (CACP) publishes cost of cultivation data through:
- **India**: data.gov.in open data portal (CSV/JSON downloads only)
- **Pakistan**: No direct CACP equivalent with a public REST API was found

There is no authenticated or public REST endpoint that returns per-acre cost projections by crop in JSON format suitable for direct consumption.

### Decision

Following the implementation plan, the `lib/cacp/client.ts` service layer uses a configurable `CACP_API_URL` env var plus a static fallback dataset for demo/development mode. The fallback covers the 5 main crops (Wheat, Cotton, Sugarcane, Maize, Rice) with approximate per-acre cost breakdowns by category (seed, fertilizer, labor, irrigation, transport).

If `CACP_API_URL` is set in the environment, the client attempts to fetch from that endpoint. On any failure (network, 404, timeout, invalid response), it returns `null` and the UI shows manual entry mode.

### Static Fallback Data (PKR per acre)

| Crop | Seed | Fertilizer | Labor | Irrigation | Transport |
|---|---|---|---|---|---|
| wheat | 1200 | 3500 | 4500 | 1800 | 800 |
| cotton | 2500 | 6000 | 5500 | 3500 | 1500 |
| sugarcane | 3500 | 8000 | 7000 | 4000 | 2000 |
| maize | 1000 | 3000 | 3500 | 1500 | 700 |
| rice | 1500 | 4500 | 5000 | 2500 | 1200 |

## Mandi Price Integration

The existing `mandi_prices` table (feature #4) is used for revenue forecasting. Revenue = actual_yield × actual_price. The system queries the latest `modal_price` for a crop by district/mandi via the existing `/api/prices` endpoint. No new price API is built.

## Implementation Notes

- Custom SVG charts follow `comparison-chart.tsx` pattern; Recharts is NOT installed.
- All colors use `--color-agro-*` CSS tokens.
- Zod validates all inputs.
- Session gating via `requireSessionApi()`.
- Uniform error shape `{ error: { code, message } }`.
