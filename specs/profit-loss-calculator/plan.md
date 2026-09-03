# Plan: Farm Profit/Loss Calculator (Feature #7)

**Spec**: `specs/profit-loss-calculator/spec.md`  
**Status**: Implementation-ready  
**Migration**: `db/migrations/0014_profit_loss_calculator.sql`

---

## 1. Database Migration

**File**: `db/migrations/0014_profit_loss_calculator.sql`

Create three tables following the existing migration style (see `0003_farm_records.sql`):

- `seasons` — core season entity with `start_date`, `status`, yield/price fields, `archived_at`
- `expenses` — actual expense entries with category, amount, date, note
- `projected_costs` — CACP-sourced per-category projections with `per_acre_cost_pkr` and `total_projected_pkr`

Indexes:
- `seasons`: `(account_id, archived_at, created_at DESC)`, `(farm_id, season, year)`
- `expenses`: `(season_id, date DESC, created_at DESC)`, `(account_id)`
- `projected_costs`: `(season_id, category)`

---

## 2. Shared Libraries

### 2.1 Validation — `lib/validation/profit-loss.ts`

Zod schemas matching existing pattern (`lib/validation/farms.ts`):

- `createSeasonSchema` — farm_id, crop_id, season, year, acres
- `updateSeasonSchema` — optional crop, acres, season/year, expected_yield, expected_price
- `createExpenseSchema` — season_id, category, amount, date, note
- `updateExpenseSchema` — amount, date, note (season_id/category/date immutable)
- `createProjectedCostSchema` — category, per_acre_cost_pkr
- `listSeasonsQuerySchema` — cursor, limit (default 20)
- `listExpensesQuerySchema` — cursor, limit (default 20)

Reuse enums from `lib/farms/constants.ts` where possible (SEASONS, YEAR_OPTIONS).

### 2.2 Calculations — `lib/calculations/profit-loss.ts`

Pure functions for all financial math (no DB calls):

- `computePL(season, expenses, projectedCosts)` → P&L summary object
- `computeBreakEven(totalInvestment, expectedPrice, expectedYieldPerAcre, acres)` → { yield, price }
- `computeROI(actualRevenue, totalActualCost)` → number | null (null when cost = 0)
- `computeVariance(actualTotal, projectedTotal)` → { absolute, percentage }
- `getSeasonStartDate(season)` → date (Summer=May 1, Winter=Nov 1, Rainy=Jul 1, Dry=Jan 1)
- `getCropUnit(cropId)` → string (from crops table lookup)

### 2.3 CACP Client — `lib/cacp/client.ts`

Service layer for external CACP API:

- `fetchCACPProjections(cropId, acres)` → `ProjectedCostRow[] | null`
- Timeout: 5s, fail gracefully to null
- Returns null on any error (network, 404, timeout) — caller shows manual entry mode

**Open question**: Which external CACP API endpoint to use? The spec says "external API" but no URL is specified. Recommend: start with a configurable `CACP_API_URL` env var + mock fallback so the feature works without the real API.

---

## 3. API Routes

All routes follow the existing pattern: `requireSessionApi()` → Zod validation → DB query → uniform error shape.

### 3.1 `app/api/profit-loss/route.ts`

**GET** — List seasons
- Query: `?cursor=&limit=`
- Returns: `{ seasons, nextCursor }` scoped to `account_id`, `archived_at IS NULL`
- Enrich each season with: crop name (join `crops`), farm name (join `farms`), computed P&L chip, ROI chip

**POST** — Create season
- Body: `createSeasonSchema`
- Server-side: derive `start_date`, fetch CACP projections, seed `projected_costs`
- If CACP fails: return 201 with `cacp_fallback: true`, farmer enters projections manually
- Zod 422 on invalid input

### 3.2 `app/api/profit-loss/[id]/route.ts`

**GET** — Season detail
- Ownership check via `account_id`
- Returns: season + farm + crop + expenses + projected_costs + computed P&L + break-even + ROI

**PATCH** — Update season
- Body: `updateSeasonSchema`
- Validates: crop/acres/season/year only editable when `status = 'active'` AND no expenses exist
- Zod 422 on invalid input

**DELETE** — Hard delete
- Blocked if expenses or `actual_yield`/`actual_price` exist (return 409)
- Otherwise hard delete with cascade to expenses/projected_costs

### 3.3 `app/api/profit-loss/[id]/archive/route.ts`

**POST** — Archive season
- Sets `archived_at = now()` where `account_id = X AND archived_at IS NULL`

### 3.4 `app/api/profit-loss/[id]/restore/route.ts`

**POST** — Restore season
- Sets `archived_at = NULL` where `account_id = X AND archived_at IS NOT NULL`

### 3.5 `app/api/profit-loss/[id]/expenses/route.ts`

**GET** — List expenses
- Query: `?cursor=&limit=`
- Returns: `{ expenses, nextCursor }` sorted by `date DESC, created_at DESC`
- Each expense enriched with category variance against projected_costs

**POST** — Create expense
- Body: `createExpenseSchema`
- Server attaches `season_id`, `account_id`
- Zod 422 on invalid input

### 3.6 `app/api/profit-loss/[id]/expenses/[expenseId]/route.ts`

**PATCH** — Update expense
- Body: `updateExpenseSchema`
- Only amount, date, note editable
- Ownership check through season → account_id

**DELETE** — Delete expense
- Hard delete, only season owner

### 3.7 `app/api/profit-loss/[id]/projected-costs/route.ts`

**POST** — Manual projected cost entry (CACP fallback)
- Body: `createProjectedCostSchema`
- Used when CACP API returns no data
- Allows farmer to enter projections manually per category

---

## 4. UI Pages & Components

### 4.1 Pages

- `app/(farmer)/(dashboard)/profit-loss/page.tsx` — Season list + empty state + "New Season" CTA
- `app/(farmer)/(dashboard)/profit-loss/new/page.tsx` — Season creation form
- `app/(farmer)/(dashboard)/profit-loss/[id]/page.tsx` — Season detail with P&L, charts, expense list, yield/price inputs, harvest form

### 4.2 Server Components (data fetching)

Each page is a Server Component that fetches data via the API routes above, following the existing pattern (`page.tsx` calls `fetch()` to internal routes).

### 4.3 Client Components

- `components/profit-loss/season-card.tsx` — Card showing crop, farm, season/year, acres, status, P&L chip, ROI chip
- `components/profit-loss/pl-summary.tsx` — P&L statement grid
- `components/profit-loss/break-even-display.tsx` — Break-even yield + price display
- `components/profit-loss/expense-form.tsx` — Create/edit expense form (use react-hook-form + zod)
- `components/profit-loss/expense-list.tsx` — Expense entries with variance chips
- `components/profit-loss/charts/expense-time-series.tsx` — Monthly cumulative projected vs actual (SVG, follow `comparison-chart.tsx` pattern)
- `components/profit-loss/charts/expense-breakdown.tsx` — Pie/bar chart by category (SVG)
- `components/profit-loss/charts/break-even-bar.tsx` — Current yield vs break-even yield bar

**Chart approach**: Use custom SVG following the existing `comparison-chart.tsx` pattern. Do NOT install Recharts (not in dependencies, project uses SVG). Update spec FR19-FR21 to match this.

### 4.4 Crop dropdown

Source from existing `/api/crops` endpoint (already exists at `app/api/crops/route.ts`). No new crop API needed.

---

## 5. Key Decisions

| Decision | Chosen Approach | Rationale |
|---|---|---|
| Charts | Custom SVG (existing pattern) | Recharts not installed; project already uses SVG charts |
| CACP API | Configurable env var + graceful fallback | External API not yet specified; feature must work without it |
| Crop list | Dynamic from `crops` table via `/api/crops` | Aligns with spec FR28; avoids hardcoding |
| Yield units | Per-crop from `crops.unit` (default Maund) | Matches existing mandi-price-tracker data model |
| Break-even scope | Total farm (not per acre) | Per user answer; more useful for farmers |
| Season dates | Auto-derived from season type | Per user answer; no date picker needed |
| Projections for unknown categories | Zero projection → 100% variance | Per user answer; simple and clear |

---

## 6. Open Questions (Resolved)

All spec gaps were resolved via Q&A. No remaining blockers.

---

## 7. Validation Plan

Per acceptance criteria in spec:

1. **Unit tests** (vitest) for `lib/calculations/profit-loss.ts` — cover P&L, break-even, ROI, variance edge cases (zero cost, zero yield, missing projections)
2. **Route handler tests** — auth gating (401), ownership (404), Zod validation (422), CRUD happy paths
3. **Manual run-through** — create season → see CACP projections → add expenses → check variance → mark harvested → verify final P&L
4. **`npm run lint` and `npm run build`** must pass

---

## 8. Execution Order

1. Migration `0014_profit_loss_calculator.sql`
2. `lib/validation/profit-loss.ts`
3. `lib/calculations/profit-loss.ts`
4. `lib/cacp/client.ts`
5. API routes (7 files)
6. Shared components (7 components)
7. Pages (3 pages)
8. Tests + lint + build

---

## 9. Risks

- **CACP API undefined**: If no external API is available, the manual entry fallback must be polished. Recommend building a simple admin endpoint to bulk-insert CACP data later.
- **Chart complexity**: SVG charts require more manual work than Recharts. Keep them simple (line chart, pie chart, bar) to stay within scope.
- **Season date derivation**: Fixed dates (May 1, Nov 1, etc.) are approximations. Pakistani agriculture varies by region. Acceptable for v1; can be made region-aware later.
