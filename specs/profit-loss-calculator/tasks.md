# Tasks: Farm Profit/Loss Calculator (Feature #7)

**Spec**: `specs/profit-loss-calculator/spec.md`  
**Plan**: `specs/profit-loss-calculator/plan.md`  
**Migration**: `db/migrations/0014_profit_loss_calculator.sql`

---

## Task 1: Database Migration

- [ ] Create `db/migrations/0014_profit_loss_calculator.sql`
- [ ] Run migration against local/dev database
- [ ] Verify tables `seasons`, `expenses`, `projected_costs` exist with correct columns and indexes

---

## Task 2: Shared Libraries

### 2a. Validation Schemas
- [ ] Create `lib/validation/profit-loss.ts`
- [ ] Add `createSeasonSchema`, `updateSeasonSchema`, `createExpenseSchema`, `updateExpenseSchema`, `createProjectedCostSchema`
- [ ] Add list query schemas with cursor/limit
- [ ] Reuse `SEASONS` and `YEAR_OPTIONS` from `lib/farms/constants.ts`

### 2b. Calculation Helpers
- [ ] Create `lib/calculations/profit-loss.ts`
- [ ] Implement `computePL()` — P&L summary
- [ ] Implement `computeBreakEven()` — total farm basis
- [ ] Implement `computeROI()` — null-safe for zero cost
- [ ] Implement `computeVariance()` — absolute + percentage
- [ ] Implement `getSeasonStartDate()` — season type to date mapping
- [ ] Implement `getCropUnit()` — crop unit lookup helper

### 2c. CACP Client
- [ ] Create `lib/cacp/client.ts`
- [ ] Add `fetchCACPProjections(cropId, acres)` with 5s timeout
- [ ] Add graceful fallback returning `null` on any error
- [ ] Add `CACP_API_URL` env var support
- [ ] Add mock/static fallback data for offline development

---

## Task 3: API Routes

### 3a. Season Routes
- [ ] Create `app/api/profit-loss/route.ts` — GET list + POST create
- [ ] Create `app/api/profit-loss/[id]/route.ts` — GET detail + PATCH update + DELETE hard delete
- [ ] Create `app/api/profit-loss/[id]/archive/route.ts` — POST archive
- [ ] Create `app/api/profit-loss/[id]/restore/route.ts` — POST restore
- [ ] Add auth gating (`requireSessionApi`) to all routes
- [ ] Add Zod validation to all write routes
- [ ] Add ownership checks to all `[id]` routes
- [ ] Add uniform error shape for all failure paths

### 3b. Expense Routes
- [ ] Create `app/api/profit-loss/[id]/expenses/route.ts` — GET list + POST create
- [ ] Create `app/api/profit-loss/[id]/expenses/[expenseId]/route.ts` — PATCH update + DELETE
- [ ] Add cursor-based pagination (default 20)
- [ ] Add variance enrichment on list response
- [ ] Add ownership checks through season → account_id

### 3c. Projected Costs Route
- [ ] Create `app/api/profit-loss/[id]/projected-costs/route.ts` — POST manual entry
- [ ] Validate category is one of: seed, fertilizer, labor, irrigation, transport
- [ ] Ensure duplicate category per season is rejected or upserted

---

## Task 4: UI Pages

### 4a. Season List Page
- [ ] Create `app/(farmer)/(dashboard)/profit-loss/page.tsx`
- [ ] Fetch seasons via internal `/api/profit-loss`
- [ ] Render season cards or empty state with CTA
- [ ] Add "New Season" button linking to `/profit-loss/new`

### 4b. Season Creation Page
- [ ] Create `app/(farmer)/(dashboard)/profit-loss/new/page.tsx`
- [ ] Add form with farm dropdown, crop dropdown (from `/api/crops`), season/year, acres
- [ ] Use react-hook-form + zod resolver
- [ ] Show CACP fallback message when API fails
- [ ] Redirect to season detail on success

### 4c. Season Detail Page
- [ ] Create `app/(farmer)/(dashboard)/profit-loss/[id]/page.tsx`
- [ ] Fetch season detail via internal `/api/profit-loss/[id]`
- [ ] Render P&L summary, break-even, ROI, charts, expense list
- [ ] Add yield/price input form
- [ ] Add expense creation form
- [ ] Add harvest form (actual yield + price)
- [ ] Add archive/restore/delete actions with confirmations

---

## Task 5: Shared Components

- [ ] Create `components/profit-loss/season-card.tsx`
- [ ] Create `components/profit-loss/pl-summary.tsx`
- [ ] Create `components/profit-loss/break-even-display.tsx`
- [ ] Create `components/profit-loss/expense-form.tsx`
- [ ] Create `components/profit-loss/expense-list.tsx`
- [ ] Create `components/profit-loss/charts/expense-time-series.tsx` — SVG line chart
- [ ] Create `components/profit-loss/charts/expense-breakdown.tsx` — SVG pie/bar chart
- [ ] Create `components/profit-loss/charts/break-even-bar.tsx` — SVG bar indicator
- [ ] Ensure all colors use `--color-agro-*` tokens only
- [ ] Ensure all touch targets are ≥ 44×44px

---

## Task 6: Tests & Verification

- [ ] Write unit tests for `lib/calculations/profit-loss.ts`
  - [ ] P&L with all values present
  - [ ] Break-even with zero price/yield (should return null/message)
  - [ ] ROI with zero actual cost (should return null)
  - [ ] Variance with zero projection (100% over budget)
- [ ] Write route handler tests
  - [ ] Auth gating returns 401 without session
  - [ ] Ownership check returns 404 for other farmer's season
  - [ ] Zod validation returns 422 on invalid input
  - [ ] CRUD happy paths create/read/update/delete correctly
- [ ] Run `npm run lint` — must pass
- [ ] Run `npm run build` — must pass
- [ ] Manual run-through: create season → add expenses → mark harvested → verify P&L

---

## Task 7: Acceptance Criteria Checklist

Per `specs/profit-loss-calculator/spec.md`:

- [ ] Create season with valid data → saved with `account_id` + CACP-seeded projected costs, appears in owner's list only
- [ ] Invalid season input → Zod 422 with field errors, nothing saved
- [ ] `/profit-loss` lists only logged-in farmer's non-archived seasons; empty state renders when zero seasons
- [ ] Season detail shows correct P&L summary + break-even + ROI + charts + expense list
- [ ] Create expense with valid data → saved with category + date, variance updates immediately
- [ ] Expenses list sorted by `date DESC`, then `created_at DESC`
- [ ] Edit expense → changes persist, only owner can edit
- [ ] Delete expense → removed from list after confirmation
- [ ] Archive season → hidden from list but data preserved; hard delete blocked if expenses/yield exist
- [ ] Restore archived season → returns to active list with all data intact
- [ ] **No valid session → ALL profit-loss APIs return 401; request never reaches database**
- [ ] **Forged/expired/wrong-type JWT → rejected at signature/type/expiry check; uniform error shape**
- [ ] Farmer A directly accessing Farmer B's season → 404 (never reveals existence)
- [ ] Logout kills session; subsequent API calls return 401
- [ ] Future-dated expenses allowed and visible in list
- [ ] CACP-seeded projected costs appear on season creation for supported crops
- [ ] CACP API failure → manual entry mode shown; season still creates successfully
- [ ] Variance calculated per category and displayed as PKR + percentage
- [ ] Category with actual but no projection shows 100% variance (over budget)
- [ ] Break-even yield and break-even price calculated and displayed for total farm
- [ ] ROI percentage displayed with color coding (green/red/yellow)
- [ ] Monthly chart shows cumulative projected vs actual expenses
- [ ] Expense breakdown chart shows distribution by category
- [ ] Mandi price auto-suggestion available when price data exists; farmer can override
- [ ] Farm records sync is optional and requires farmer confirmation
- [ ] All colors from `--color-agro-*` tokens only; no inline hex
- [ ] `npm run lint` and `npm run build` pass
