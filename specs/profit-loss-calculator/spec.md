# Feature Specification: Farm Profit / Loss Calculator & Forecast

**Feature Folder**: `specs/profit-loss-calculator/`  
**Status**: Draft — answers collected, ready for founder sign-off before clarify/plan

**Problem:** Farmers lack financial planning tools and often realize losses only after harvest.

**Solution:** Farmer inputs crop type, area, and investment details → system calculates expected cost of cultivation, yield, revenue, and profit/loss → provides real-time tracking as the season progresses.

---

## Goal

Give every logged-in farmer a season-level financial cockpit for each crop they grow. The system stores a pre-seeded per-acre cost model (sourced from CACP-style data), lets the farmer log actual expenses by category as they occur, compares actuals against the projection in real time, and at harvest connects mandi price data to forecast revenue. The dashboard renders a P&L statement, break-even analysis, ROI, and monthly expense-vs-revenue charts so the farmer can see whether they are ahead or behind before the season ends. Every API is gated by the app's own session JWT; forged, expired, missing, or wrong-type tokens never reach the database.

---

## User scenarios

1. **Farmer opens Profit/Loss page** → sees their active farming seasons as cards. If none, an empty state with "Start a new season" CTA.
2. **Farmer starts a new season** → selects a farm (from `/farms`), crop, season/year (Summer/Winter/Rainy/Dry + year range), and acres → system seeds the season with CACP per-acre cost projections → season card appears.
3. **Farmer views season detail** → sees P&L summary (total investment, projected revenue, actual revenue, net profit/loss, ROI %), break-even analysis, monthly chart, and a list of expense entries. Actuals are compared against projections with variance shown.
4. **Farmer logs an actual expense** → picks category (seed/fertilizer/labor/irrigation/transport/other), amount, date, optional note → saved → projections and variance update immediately.
5. **Farmer updates yield or expected price** → enters expected yield (mounds/bags per acre) and/or expected mandi price (PKR per Maund) → system recalculates projected revenue and profit/loss.
6. **Farmer marks season as harvested** → enters actual yield and actual selling price → system calculates actual revenue, final P&L, ROI, and break-even. Season status flips to "Completed".
7. **Farmer views charts** → monthly time-series chart showing cumulative projected vs actual expenses and revenue across the season; bar/pie chart of expense breakdown by category.
8. **Farmer deletes or archives a season** → archive hides the season from the list but preserves all data; hard delete removes it permanently.
9. **Unauthenticated visitor hits any profit-loss API** → server returns 401 with uniform error shape. Request never reaches the database.
10. **Farmer A directly requests Farmer B's season** → server validates session + ownership → returns 404. Never reveals the season exists.

---

## Functional requirements

### Season CRUD

- **FR1 Create season.** Fields: `farm_id` (dropdown of own non-archived farms, required), crop (required, from fixed list: Wheat/Cotton/Sugarcane/Maize/Rice), season (dropdown: Summer/Winter/Rainy/Dry, required), year (dropdown: current year ± 10 years, format "2024-25", required), acres (required, >0). On creation, server seeds the season with CACP per-acre cost projections for the selected crop and acres. `account_id` attached server-side from session. Zod validation on body.
- **FR2 List my seasons.** Returns only seasons where `account_id = session.account_id` and `archived_at IS NULL`. Sorted by `created_at DESC`. Each card shows: crop, farm name, season/year, acres, status (Active/Harvested/Completed), net profit/loss chip, ROI chip. Empty state when zero seasons.
- **FR3 Season detail.** Shows: P&L summary (total projected cost, total actual cost, projected revenue, actual revenue, net profit/loss, ROI %), break-even analysis, monthly chart, expense breakdown chart, expense entries list, yield/price inputs, and actions to log expense or mark harvested. All data scoped to the season.
- **FR4 Update season.** Editable: crop (if no expenses logged), acres, season/year (if no expenses logged), expected yield, expected mandi price. `account_id` cannot change. Zod validation.
- **FR5 Archive/delete season.** Archive sets `archived_at`, hiding from list but preserving all data. Hard delete blocked if any expenses or yield entries exist for that season. Returns clear message: "Delete all expenses and harvest data first."

### Expense Tracking

- **FR6 Create expense.** Fields: `season_id` (required, must belong to session owner), category (dropdown: seed/fertilizer/labor/irrigation/transport/other, required), amount (required, >0), date (required, ISO date), note (optional). `account_id` attached server-side. Zod validation. Expense stored with `type = 'actual'`.
- **FR7 List expenses for a season.** Returns expenses for the given season where season belongs to session owner and is not archived. Sorted by `date DESC`, then `created_at DESC`. Each entry shows: category icon, date, amount, note, variance against projected cost for that category (if any).
- **FR8 Edit expense.** Same fields as create. Only season owner can edit. `season_id`, `category`, and `date` cannot change.
- **FR9 Delete expense.** Hard delete. Only season owner can delete. Confirmation required in UI.

### Projected Cost Model

- **FR10 CACP-seeded projections.** On season creation, server seeds `projected_costs` rows for the selected crop and acres using pre-loaded CACP data. Categories: seed, fertilizer, labor, irrigation, transport. Each row stores `category`, `per_acre_cost_pkr`, `total_projected_pkr`. Farmer sees these as baseline projections.
- **FR11 Variance calculation.** Server computes variance per category: `actual_total - projected_total`. Displayed as absolute PKR and percentage. Positive variance (actual > projected) shown in red (over budget); negative variance (actual < projected) shown in green (under budget).
- **FR12 Actuals vs Projected.** The P&L summary shows total projected cost (sum of all projected rows), total actual cost (sum of all actual expenses), variance, projected revenue (expected_yield × expected_price), actual revenue (actual_yield × actual_price), net profit/loss, and ROI %.

### Revenue & Harvest

- **FR13 Yield entry.** Farmer enters expected yield in mounds/bags per acre. Stored on season. Used to calculate projected revenue: `expected_yield × expected_mandi_price_per_maund`. If farmer has a farm location registered, system can auto-suggest nearby mandi prices (from existing mandi-price-tracker data) but farmer can override.
- **FR14 Actual yield & price.** When marking season as harvested, farmer enters actual yield (mounds/bags) and actual selling price (PKR per Maund). System calculates actual revenue: `actual_yield × actual_price`. Season status flips to "Completed" and final P&L is locked.
- **FR15 Mandi price integration.** Revenue forecast uses existing `mandi_prices` data (feature #4). If no price data exists for the crop/district, farmer manually enters expected price. System never blocks revenue entry due to missing mandi data.

### Break-even Analysis

- **FR16 Break-even yield.** Calculated as: `total_investment_per_acre ÷ expected_mandi_price_per_maund`. Displayed in mounds/bags per acre. Shows how much the farmer must produce just to recover costs.
- **FR17 Break-even price.** Calculated as: `total_investment_per_acre ÷ expected_yield_per_acre`. Displayed in PKR per Maund. Shows the minimum price the farmer needs to break even.

### ROI

- **FR18 ROI calculation.** `ROI % = ((actual_revenue - total_actual_cost) ÷ total_actual_cost) × 100`. Displayed with color coding: green for positive ROI (profit), red for negative ROI (loss), yellow for near break-even (±5%).

### Charts

- **FR19 Monthly expense-vs-revenue chart.** Time-series chart showing cumulative projected expenses and cumulative actual expenses per month over the season. If revenue data is available, actual revenue line is overlaid. Uses Recharts (consistent with existing stack).
- **FR20 Expense breakdown chart.** Pie or bar chart showing expense distribution by category (seed/fertilizer/labor/irrigation/transport/other) for actual expenses.
- **FR21 Chart empty states.** If no actual expenses logged, chart shows projected line only. If no revenue data, revenue line is omitted with a message "Add yield and price to see revenue".

### Security & Authorization

- **FR22 API gate.** Every profit-loss route handler validates session on the first line: httpOnly cookie → JWT → signature verify (jose) → type `session` → expiry check → `account_id` lookup in `sessions` table (not revoked). Any failure → immediate `{ error: { code, message } }` with proper HTTP status. Request never reaches database queries.
- **FR23 Ownership enforcement.** After session validation, every query scopes to `account_id`. Season queries: `WHERE account_id = X AND archived_at IS NULL`. Expense queries: join through season ownership. Another farmer's season/expense → 404 response. Never reveals existence.
- **FR24 Uniform error shape.** Every auth/authorization failure returns `{ error: { code: string, message: string } }`. No ad-hoc formats. No info about which check failed.

### Validation

- **FR25 Zod on every input.** All route handlers validate request body and query params with Zod before any DB operation.
- **FR26 Acres rule.** Must be positive number. Zero or negative rejected.
- **FR27 Amount rule.** Expense amount must be positive number. Zero rejected.
- **FR28 Crop rule.** Crop must be one of: Wheat, Cotton, Sugarcane, Maize, Rice.
- **FR29 Season/year validation.** Season must be one of: Summer, Winter, Rainy, Dry. Year must be valid year range format (e.g., "2024-25").
- **FR30 Date rules.** Expense date: any valid ISO date allowed (past, present, future). Server rejects malformed dates.
- **FR31 Variance display.** Variance shown as PKR and percentage. Under budget (green), over budget (red), on budget (neutral).

### Farm Records Integration

- **FR32 Optional sync with farm records.** When a farmer creates a season from a farm, system can auto-populate crop and acres from the farm record if available. Harvest events from farm records can be optionally synced into the profit-loss season as actual yield entries, but this is not automatic — farmer must confirm the sync.

---

## Edge cases & rules

- No seasons yet: Profit/Loss page renders welcome empty state with primary CTA.
- Season with zero expenses: shows projected costs only, variance = 0.
- Concurrent expense creation: same season, simultaneous saves → all succeed, ordered by `date DESC`, then `created_at DESC`.
- Stale session: form open, session expires → submit returns 401 → UI redirects to `/login`.
- Stale tab: season detail open, season deleted elsewhere → 404 on next interaction.
- Delete season with expenses: blocked with clear message; farmer must delete expenses first. Archive option available.
- Future-dated expenses: allowed and visible in list; sorted by `date DESC`, then `created_at DESC`.
- Very long notes: visually clamped, full text available on expand.
- Missing mandi price data: farmer manually enters expected price; system never blocks revenue calculation.
- CACP data not available for a crop: farmer must enter all projected costs manually; system shows "No CACP data available — enter projections manually" message.
- Archived seasons: excluded from list by default; can be restored or permanently deleted. Expenses preserved through archive/restore cycle.
- Break-even with zero price or zero yield: system shows "Enter valid price and yield to calculate break-even" instead of dividing by zero.
- ROI with zero actual cost: system shows "N/A" instead of dividing by zero.

---

## UI Requirements

### Brand Colors

All UI colors MUST come from `--color-agro-*` CSS tokens defined in the project's theme. Never use inline hex values.

- Primary actions: `--agro-green`
- Harvest-gold conversion moments: `--agro-wheat` with dark forest text (`--agro-forest` or `--agro-ink`) for contrast
- Profit/positive: `--agro-leaf` or `--agro-green`
- Loss/negative/over-budget: `--agro-error` (`#B91C1C`)
- Warning/near break-even: `--agro-warning` (`#D4A843`)
- Text: dark forest (`--agro-forest` or `--agro-ink`) on light backgrounds; ensure ≥ 4.5:1 contrast
- Cards and section backgrounds: `--agro-paper`, `--agro-mint`, or `--agro-stone`

### Typography

- Headings: Playfair Display, roman, sentence case
- Body: DM Sans
- Data/monospace: IBM Plex Mono or JetBrains Mono
- All text at minimum 16px for outdoor-mobile readability

### Layout & Accessibility

- Touch targets ≥ 44×44px
- Visible focus rings, never animated in
- `prefers-reduced-motion` respected
- No horizontal scroll at 320px viewport
- Light mode only
- Season cards responsive: single column on mobile, 2–3 columns on desktop

### Charts

- Monthly expense-vs-revenue chart: line chart with projected and actual lines
- Expense breakdown: pie or bar chart by category
- Break-even visualization: simple bar or indicator showing current yield vs break-even yield
- ROI chip: color-coded (green/red/yellow) on season card and detail
- All charts use Recharts (consistent with existing stack)
- Chart legends use `--agro-slate` for labels; chart lines use `--agro-canopy` (projected) and `--agro-leaf` (actual)

---

## Out of scope

- Farm sharing or collaboration between farmers
- Photo/voice attachments on expenses
- Offline/PWA sync
- Soil health data, GPS boundaries, satellite field maps
- Admin bulk season or expense management
- Advanced financial modeling (sensitivity analysis, scenario planning)
- Multi-currency support
- Bank loan application integration (beyond data export readiness)
- PDF export (explicitly out of scope for this build; all data stored in DB for future PDF generation)
- Dark mode, RTL, multi-language translations
- SMS/WhatsApp alerts for financial milestones

---

## Acceptance criteria

- [ ] Create season with valid data → saved with `account_id` + CACP-seeded projected costs, appears in owner's list only
- [ ] Invalid season input → Zod 422 with field errors, nothing saved
- [ ] `/profit-loss` lists only logged-in farmer's non-archived seasons; empty state renders when zero seasons
- [ ] Season detail shows correct P&L summary + break-even + ROI + charts + expense list
- [ ] Create expense with valid data → saved with category + date, variance updates immediately
- [ ] Expenses list sorted by `date DESC`, then `created_at DESC`
- [ ] Edit expense → changes persist, only owner can edit
- [ ] Delete expense → removed from list after confirmation
- [ ] Archive season → hidden from list but data preserved; hard delete blocked if expenses/yield exist
- [ ] **No valid session → ALL profit-loss APIs return 401; request never reaches database**
- [ ] **Forged/expired/wrong-type JWT → rejected at signature/type/expiry check; uniform error shape**
- [ ] Farmer A directly accessing Farmer B's season → 404 (never reveals existence)
- [ ] Logout kills session; subsequent API calls return 401
- [ ] Future-dated expenses allowed and visible in list
- [ ] CACP-seeded projected costs appear on season creation for supported crops
- [ ] Variance calculated per category and displayed as PKR + percentage
- [ ] Break-even yield and break-even price calculated and displayed
- [ ] ROI percentage displayed with color coding (green/red/yellow)
- [ ] Monthly chart shows cumulative projected vs actual expenses
- [ ] Expense breakdown chart shows distribution by category
- [ ] Mandi price auto-suggestion available when price data exists; farmer can override
- [ ] Farm records sync is optional and requires farmer confirmation
- [ ] All colors from `--color-agro-*` tokens only; no inline hex
- [ ] `npm run lint` and `npm run build` pass
