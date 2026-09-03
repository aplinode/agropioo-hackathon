# Feature Specification: Farm Profit / Loss Calculator & Forecast

**Feature Folder**: `specs/profit-loss-calculator/`  
**Status**: Draft — answers collected, ready for founder sign-off before clarify/plan

**Problem:** Farmers lack financial planning tools and often realize losses only after harvest.

**Solution:** Farmer inputs crop type, area, and investment details → system calculates expected cost of cultivation, yield, revenue, and profit/loss → provides real-time tracking as the season progresses.

---

## Goal

Give every logged-in farmer a season-level financial cockpit for each crop they grow. The system fetches per-acre cost projections from an external CACP-style API on season creation, lets the farmer log actual expenses by category as they occur, compares actuals against the projection in real time, and at harvest connects mandi price data to forecast revenue. The dashboard renders a P&L statement, break-even analysis, ROI, and monthly expense-vs-revenue charts so the farmer can see whether they are ahead or behind before the season ends. Every API is gated by the app's own session JWT; forged, expired, missing, or wrong-type tokens never reach the database.

---

## User scenarios

1. **Farmer opens Profit/Loss page** → sees their active farming seasons as cards. If none, an empty state with "Start a new season" CTA.
2. **Farmer starts a new season** → selects a farm (from `/farms`), crop (from existing `crops` table via API), season/year (Summer/Winter/Rainy/Dry + year range), and acres → system auto-derives season start date from season type (Summer = May 1, Winter = Nov 1, Rainy = Jul 1, Dry = Jan 1), fetches CACP per-acre cost projections from external API, seeds the season with projections → season card appears.
3. **Farmer views season detail** → sees P&L summary (total investment, projected revenue, actual revenue, net profit/loss, ROI %), break-even analysis, monthly chart, and a list of expense entries. Actuals are compared against projections with variance shown.
4. **Farmer logs an actual expense** → picks category (seed/fertilizer/labor/irrigation/transport/other), amount, date, optional note → saved → projections and variance update immediately.
5. **Farmer updates yield or expected price** → enters expected yield (crop unit per acre) and/or expected mandi price (PKR per unit) → system recalculates projected revenue and profit/loss.
6. **Farmer marks season as harvested** → enters actual yield and actual selling price → system calculates actual revenue, final P&L, ROI, and break-even. Season status flips to "Completed".
7. **Farmer views charts** → monthly time-series chart showing cumulative projected vs actual expenses and revenue across the season; bar/pie chart of expense breakdown by category.
8. **Farmer deletes, archives, or restores a season** → archive hides the season from the list but preserves all data; restore returns it to active; hard delete removes it permanently.
9. **Unauthenticated visitor hits any profit-loss API** → server returns 401 with uniform error shape. Request never reaches the database.
10. **Farmer A directly requests Farmer B's season** → server validates session + ownership → returns 404. Never reveals the season exists.
11. **Farmer restores an archived season** → taps restore on archived season card → season returns to active list with all data intact.

---

## Data Model

All schemas flow strictly through Neon Lakebase Postgres using `lib/db.ts`.

### 1. `seasons`

Represents a single farming season for one crop on one farm.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY DEFAULT gen_random_uuid() | Unique season ID |
| `account_id` | `uuid` | NOT NULL REFERENCES users(id) ON DELETE CASCADE | Season owner |
| `farm_id` | `uuid` | NOT NULL REFERENCES farms(id) ON DELETE CASCADE | Linked farm |
| `crop_id` | `varchar(64)` | NOT NULL REFERENCES crops(id) | Crop slug from crops table |
| `season` | `text` | NOT NULL CHECK (season IN ('Summer','Winter','Rainy','Dry')) | Season type |
| `year` | `text` | NOT NULL | Year range format e.g. '2024-25' |
| `start_date` | `date` | NOT NULL | Auto-derived from season type: Summer=May 1, Winter=Nov 1, Rainy=Jul 1, Dry=Jan 1 |
| `acres` | `numeric(6,2)` | NOT NULL CHECK (acres > 0) | Farm area in acres |
| `status` | `text` | NOT NULL DEFAULT 'active' CHECK (status IN ('active','harvested','completed')) | Season status |
| `expected_yield` | `numeric(10,2)` | NULLABLE | Expected yield in crop unit per acre |
| `expected_price` | `numeric(10,2)` | NULLABLE | Expected mandi price PKR per unit |
| `actual_yield` | `numeric(10,2)` | NULLABLE | Actual yield recorded at harvest |
| `actual_price` | `numeric(10,2)` | NULLABLE | Actual selling price at harvest |
| `archived_at` | `timestamptz` | NULLABLE | Soft delete timestamp |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Record creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | Record update timestamp |

*Indexes*: `(account_id, archived_at, created_at DESC)`, `(farm_id, season, year)`.

### 2. `expenses`

Individual expense entries logged by the farmer.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY DEFAULT gen_random_uuid() | Unique expense ID |
| `season_id` | `uuid` | NOT NULL REFERENCES seasons(id) ON DELETE CASCADE | Parent season |
| `account_id` | `uuid` | NOT NULL REFERENCES users(id) ON DELETE CASCADE | Denormalized for query simplicity |
| `category` | `text` | NOT NULL CHECK (category IN ('seed','fertilizer','labor','irrigation','transport','other')) | Expense category |
| `amount` | `numeric(10,2)` | NOT NULL CHECK (amount > 0) | Expense amount in PKR |
| `date` | `date` | NOT NULL | Expense date (past/present/future allowed) |
| `note` | `text` | NULLABLE | Optional farmer note |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Record creation timestamp |

*Indexes*: `(season_id, date DESC, created_at DESC)`, `(account_id)`.

### 3. `projected_costs`

CACP-sourced per-category cost projections seeded on season creation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY DEFAULT gen_random_uuid() | Unique projection ID |
| `season_id` | `uuid` | NOT NULL REFERENCES seasons(id) ON DELETE CASCADE | Parent season |
| `category` | `text` | NOT NULL CHECK (category IN ('seed','fertilizer','labor','irrigation','transport')) | Cost category |
| `per_acre_cost_pkr` | `numeric(10,2)` | NOT NULL | CACP per-acre projected cost |
| `total_projected_pkr` | `numeric(10,2)` | NOT NULL | Calculated: per_acre_cost_pkr × season.acres |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Record creation timestamp |

*Indexes*: `(season_id, category)`.

### CACP Data Source

CACP projections are fetched from an external API at season creation time. The API returns per-acre cost breakdowns by category (seed, fertilizer, labor, irrigation, transport) for the requested crop and region. If the API fails or returns no data for a crop, the system shows "No CACP data available — enter projections manually" and the farmer enters projected costs manually.

### Mandi Price Integration

Revenue forecast uses the existing `mandi_prices` table from feature #4. The `crops` table stores standard units per crop (default: Maund). Auto-suggestion pulls the latest `modal_price` for the crop from mandis near the farm's district. Farmer can override any suggested price.

---

## Functional requirements

### Season CRUD

- **FR1 Create season.** Fields: `farm_id` (dropdown of own non-archived farms, required), `crop_id` (required, from existing `crops` table), season (dropdown: Summer/Winter/Rainy/Dry, required), year (dropdown: current year ± 10 years, format "2024-25", required), acres (required, >0). On creation, server auto-derives `start_date` from season type (Summer = May 1, Winter = Nov 1, Rainy = Jul 1, Dry = Jan 1) and fetches CACP per-acre cost projections from external API for the selected crop and acres. `account_id` attached server-side from session. Zod validation on body.
- **FR2 List my seasons.** Returns only seasons where `account_id = session.account_id` and `archived_at IS NULL`. Sorted by `created_at DESC`. Each card shows: crop, farm name, season/year, acres, status (Active/Harvested/Completed), net profit/loss chip, ROI chip. Empty state when zero seasons.
- **FR3 Season detail.** Shows: P&L summary (total projected cost, total actual cost, projected revenue, actual revenue, net profit/loss, ROI %), break-even analysis, monthly chart, expense breakdown chart, expense entries list, yield/price inputs, and actions to log expense or mark harvested. All data scoped to the season.
- **FR4 Update season.** Editable: crop (if no expenses logged), acres, season/year (if no expenses logged), expected yield, expected mandi price. `account_id` cannot change. Zod validation.
- **FR5 Archive/restore/delete season.** Archive sets `archived_at`, hiding from list but preserving all data. Restore clears `archived_at`, returning the season to the active list with all data intact. Hard delete blocked if any expenses or yield entries exist for that season. Returns clear message: "Delete all expenses and harvest data first."
- **FR5a Restore season.** Clears `archived_at` for an archived season. Season returns to active list with all expenses and projected costs intact. Only season owner can restore.

### Expense Tracking

- **FR6 Create expense.** Fields: `season_id` (required, must belong to session owner), category (dropdown: seed/fertilizer/labor/irrigation/transport/other, required), amount (required, >0), date (required, ISO date), note (optional). `account_id` attached server-side. Zod validation. Expense stored with `type = 'actual'`.
- **FR7 List expenses for a season.** Returns expenses for the given season where season belongs to session owner and is not archived. Sorted by `date DESC`, then `created_at DESC`. Each entry shows: category icon, date, amount, note, variance against projected cost for that category (if any).
- **FR8 Edit expense.** Same fields as create. Only season owner can edit. `season_id`, `category`, and `date` cannot change.
- **FR9 Delete expense.** Hard delete. Only season owner can delete. Confirmation required in UI.

### Projected Cost Model

- **FR10 CACP-seeded projections.** On season creation, server fetches per-acre cost projections from external CACP API for the selected crop and acres. If API returns data, server seeds `projected_costs` rows: categories seed, fertilizer, labor, irrigation, transport. Each row stores `category`, `per_acre_cost_pkr`, `total_projected_pkr`. If CACP API returns no data for a crop, system shows "No CACP data available — enter projections manually" and farmer must enter projected costs manually. Farmer sees these as baseline projections.
- **FR11 Variance calculation.** Server computes variance per category: `actual_total - projected_total`. Displayed as absolute PKR and percentage. Positive variance (actual > projected) shown in red (over budget); negative variance (actual < projected) shown in green (under budget).
- **FR12 Actuals vs Projected.** The P&L summary shows total projected cost (sum of all projected rows), total actual cost (sum of all actual expenses), variance, projected revenue (expected_yield × expected_price), actual revenue (actual_yield × actual_price), net profit/loss, and ROI %.

### Revenue & Harvest

- **FR13 Yield entry.** Farmer enters expected yield in the crop's standard unit per acre (from `crops.unit`, default Maund). Stored on season. Used to calculate projected revenue: `expected_yield × expected_mandi_price_per_unit`. If farmer has a farm location registered, system can auto-suggest nearby mandi prices (from existing mandi-price-tracker data) but farmer can override.
- **FR14 Actual yield & price.** When marking season as harvested, farmer enters actual yield (in crop's standard unit) and actual selling price (PKR per unit). System calculates actual revenue: `actual_yield × actual_price`. Season status flips to "Completed" and final P&L is locked.
- **FR15 Mandi price integration.** Revenue forecast uses existing `mandi_prices` data (feature #4). If no price data exists for the crop/district, farmer manually enters expected price. System never blocks revenue entry due to missing mandi data.

### Break-even Analysis

- **FR16 Break-even yield.** Calculated as: `total_investment ÷ expected_price_per_unit`. Displayed in crop's standard unit for the entire farm (total expected_yield × acres). Shows how much the farmer must produce in total to recover costs.
- **FR17 Break-even price.** Calculated as: `total_investment ÷ (expected_yield × acres)`. Displayed in PKR per unit. Shows the minimum price the farmer needs per unit to break even on the whole farm.

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
- **FR28 Crop rule.** Crop must exist in the `crops` table. Server validates `crop_id` against `crops.id` on creation and update.
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
- Category with actual expense but no CACP projection: projected cost treated as 0; variance shows 100% over budget (actual amount) in red.
- Archived seasons: excluded from list by default; can be restored or permanently deleted. Expenses preserved through archive/restore cycle.
- Restored season: returns to active list with all expenses, projected costs, and yield data intact. `archived_at` cleared.
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
