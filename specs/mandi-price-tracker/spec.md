# Feature Specification: Mandi Price Tracker

**Feature Branch**: `002-mandi-price-tracker`  
**Created**: 2026-08-30  
**Updated**: 2026-09-01 (Playwright whole-Pakistan scraper; admin panel removed)  
**Status**: Draft — awaiting founder sign-off before clarify/plan

**Problem:** Farmers sell crops at low prices due to lack of market intelligence and price volatility.

**Solution:** Daily mandi prices scraped from official government portals for every province of Pakistan, displayed for nearby markets, plus a 7–14 day forecast that powers sell/hold guidance and target-price alerts.

**How It Works (No Hardware):**
- On the `/prices` page, a farm-selector dropdown lists every farm registered to the logged-in farmer. Selecting a farm immediately recontextualizes the entire price tracker — nearby mandis, weather, recommendations, best-crop suggestions, and predictions all switch to that farm's district and location. The last-selected farm is persisted in the session and restored on revisit; if the farmer has zero farms, the selector is hidden and the page falls back to the nearest provincial market hub with the existing setup banner.
- Playwright-based daily scraper pulls wholesale mandi prices from four provincial portals (Punjab AMIS, Sindh SAMIS, KP FMIS, Balochistan BMIS) plus a federal cross-check (PBS Weekly SPI XLSX).
- Scraped rows are POSTed to a single authenticated Route Handler that writes to the existing `mandi_prices` table (`source = 'govt_api'`).
- Prices are displayed in PKR per Maund (40 kg) with 7–14 day Holt-Winters forecasts and confidence bands.
- Sell/hold recommendation + email/in-app alerts fire when the market price reaches the farmer's target.

## Clarifications

### Session 2026-09-01 (Playwright whole-Pakistan; admin panel removed)

- Q: How should we source daily mandi prices for every district of Pakistan for free? → A: Scrape four provincial official portals (Punjab AMIS, Sindh SAMIS, KP FMIS, Balochistan BMIS) with Playwright on the existing free GitHub Actions cron; use PBS Weekly SPI XLSX as a federal cross-check; existing seed data covers any remaining gaps.
- Q: Should there be an admin web panel for manual price entry/correction? → A: No admin panel in this build. The data path is scraper-only; out-of-scope manual overrides and `admin_manual` source rows are not built.
- Q: Where does the scraper run? → A: Inside the existing free `.github/workflows/mandi-cron.yml` GitHub Actions schedule (Ubuntu runner), invoking Playwright with full Chromium. The scraper is never imported by the Next.js app.
- Q: How do we keep the schema honest now that `admin_manual` is removed? → A: `mandi_prices.source` is constrained to a single value (`'govt_api'`); scraper rows additionally carry a `source_code` (e.g. `amis_pk`, `samis_pk`, `fmis_kp`, `bmis_balochistan`, `pbs_spi`) so we can debug or de-list a portal without losing the rest of the data.
- Q: How should we harden `POST /api/prices/ingest` beyond the bearer secret? → A: Layered — (1) bearer token `PRICES_CRON_SECRET` required on every request, (2) per-IP rate limit of 10 requests/minute with HTTP 429 on exceed, (3) every request writes an audit row to a `scraper_runs` log table (timestamp, source_code, rows_written, status, caller_ip) retained for 7 days for debugging and abuse review.
- Q: When every provincial scraper fails on the same cron run, what should the system do? → A: The cron run exits non-zero so GitHub sends the default workflow-failure notification to repo maintainers; no silent green-light when nothing was ingested. Per-source partial success is still acceptable — exit non-zero only when zero rows are written across all sources.
- Q: What happens if a provincial portal is down on a given day? → A: The scraper skips the affected source, logs the failure, and leaves the market's last known price in place; the UI shows the prominent `"Updated X days ago"` badge. No partial-merge writes.
- Q: What is the minimum freshness + history bar before the Holt-Winters forecaster is allowed to emit a prediction? → A: At least 3 historical rows for that crop AND the most recent row within the last 7 days; otherwise the prediction chart shows a clear "Not enough data" state and no forecast points are rendered (US3 acceptance #3/#4 still hold).
- Q: Is the existing seed still part of the build? → A: Yes. The seed (`scripts/seed-mandi-prices.ts`) provides the initial dataset on first deploy so the UI is non-empty before the first cron run; it is treated as `source = 'govt_api'` from `seed_pk_initial`.
- Q: When multiple alerts trigger for the same farmer on the same daily price update, how should the notifications be grouped? → A: A single daily in-app digest notification ("N target prices reached today") plus one separate email per triggered alert (each email identifies the crop + mandi + target + current price + deep-link). Per-alert emails are required because the farmer can forward them; the in-app digest prevents the feed from being dominated by a single day with many triggers.
- Q: Should we add a hard performance SLA for `GET /api/prices`? → A: Yes — p95 < 200ms measured at the Vercel edge for an authenticated farmer with district + bordering districts. Captured in SC-013.
- Q: When a portal's HTML changes and a scraper returns 0 rows, how should we detect schema drift? → A: Each portal's selectors live in a single file (`lib/prices/scrapers/selectors.ts`) keyed by `source_code`. If a scraper returns 0 rows AND that source has historical rows for the same weekday, the run is marked as failed (drift suspected), the source is logged with `status = 'drift_suspected'` in the `scraper_runs` audit table, and the cron exits non-zero. Public holidays must be pre-flagged in `mandi_holidays` to avoid false positives.

### Session 2026-08-30

- Q: Should price alerts be delivered via in-app notifications only, SMS + in-app, or in-app with optional SMS opt-in? → A: In-app notifications + Email alerts (via nodemailer SMTP)
- Q: When a farmer first opens the price tracker, should the system automatically show prices for markets near their registered farm location, or require them to manually select a district/market first? → A: Auto-load from farm location
- Q: Should the recommendation stay farmer-focused with sell/hold only, include buy/sell/hold for all users, or keep sell/hold with an optional trader mode? → A: Sell/hold only
- Q: What threshold should determine when price predictions are shown? → A: Any data with confidence warning
- Q: Should launch focus on Punjab districts only, include one district from each province, or start with whatever district the farmer is in and expand from there? → A: Every district of Pakistan
- Q: How should price alert trigger conditions be handled for target prices? → A: Sell-only alert (triggers strictly when market price reaches or exceeds target price >= PKR X)
- Q: What primary unit of measurement should be used for Mandi price displays and storage? → A: Standardized per Maund (40 kg / Pakistani Mann)
- Q: What is the re-triggering policy when market price remains above a farmer's target price across multiple daily updates? → A: Send notification on every new daily price update where price exceeds target
- Q: How should the system handle missing or delayed daily mandi price data from government sources? → A: Show last known recorded price with a prominent "Updated X days ago" badge
- Q: How should "nearby markets" be determined for a farmer's farm location? → A: Mandis in the farmer's district plus immediately adjacent bordering districts
- Q: When a user has not set a registered farm location, what should be displayed on initial load? → A: Default to nearest major provincial market hub (e.g. Lahore/Multan) with a banner prompting location setup
- Q: How should crop names be displayed in market price listings and search? → A: Display crop names strictly according to the user's active UI language setting
- Q: How should transport cost implications be shown in market comparisons (User Story 2)? → A: Display distance in km from farm location to each mandi AND an estimated transport cost in PKR calculated using a flat per-km rate (calibrated to local freight norms for a 40kg Maund load).
- Q: How should recommendations be rendered when price prediction confidence is low or volatile? → A: Show sell/hold recommendation accompanied by a prominent "High Volatility / Low Data" warning badge
- Q: How should price alert management work for existing alerts? → A: Allow in-place target price editing and active/paused state toggling directly on existing alerts
- Q: How detailed should daily mandi price data storage and display be for each crop? → A: Store and display Modal (prevailing) price along with Minimum and Maximum traded prices per day
- Q: How and when should ML price predictions (Prophet/LSTM) be generated and cached? → A: Scheduled Nightly Cron Job runs prediction pipelines in the background and caches results in Postgres
- Q: Should there be a limit on the number of active price alerts a farmer can set? → A: Unlimited active alerts allowed per farmer
- Q: What should be the default time range when opening the Price History chart (User Story 6)? → A: Default to 3 Months view with date range selector toggles (1M, 3M, 6M, 12M)
- Q: How should Sundays and official market holidays be represented in daily price listings? → A: Display a distinct "Mandi Closed / Market Holiday" status badge on market trading holiday dates
- Q: How should daily price trends/changes be formatted on mandi price cards? → A: Display both change percentage and PKR difference (e.g., "+3.2% (+150 PKR/Maund)")
- Q: How should the 14-day ML price prediction chart be visualized? → A: Render 14 discrete daily predicted price points with an upper/lower confidence band shaded area
- Q: How should farmers search for markets outside their nearby district? → A: Allow farmers to search and select any mandi or crop across all districts of Pakistan via a global search bar
- Q: How should Mandi Price Tracker be integrated into the main AgriPioo dashboard (/dashboard)? → A: Display top 3 favorite/tracked crop prices with 7-day trend mini-sparklines in a dashboard summary widget
- Q: How should price alert notifications be presented in the in-app notification center? → A: Highlight price target alert notifications with a distinct green badge and pin at the top of the in-app notification feed
- Q: How should mandi price data ingestion be handled behind the scenes? → A: Automated daily Playwright scraper from the four free official provincial portals plus PBS Weekly SPI cross-check (replaces prior "admin web panel" answer — admin panel removed from this build)
- Q: What action link should be included in price alert email notifications? → A: Direct "View Mandi Prices" deep-link button linking to /prices?crop=X&mandi=Y in the email
- Q: How should the price tracker behave when the farmer is offline / low connectivity? → A: Cache last viewed price list and history charts in browser local storage for offline viewing
- Q: When should price alert evaluations and email/in-app dispatches be executed? → A: Evaluate all active price alerts immediately after the daily price ingestion pipeline completes
- Q: Should historical price data export (CSV / PDF) be included? → A: Out of scope for launch (viewing and visual charts only)
- Q: How should farmers manage their favorite/tracked crops for the dashboard widget? → A: A star icon appears on every crop container across the price tracker; tapping it toggles the crop into/out of the farmer's favorites list. A dedicated `/favourites` route (and `/api/favourites` endpoint) shows the full favorites list with add/remove controls. The dashboard widget always shows the top 3 favorited crops.
- Q: What formula should be used for the estimated transport cost shown in market comparisons? → A: A flat per-km rate (Rs X per km per 40kg Maund, stored as a configurable constant in `lib/prices/transport.ts` and calibrated to local freight norms). The market comparison card shows both the distance in km and the estimated transport cost in PKR.
- Q: After how many days of no fresh data should a market be marked as "data not available" instead of showing the last known price? → A: Up to 7 days the last known price is shown with the "Updated X days ago" badge; after 7 days the UI shows a "data not available" state for that market.
- Q: How should the system prevent duplicate rows when the scraper runs twice in one day? → A: The `mandi_prices` table carries a UNIQUE constraint on `(mandi_id, crop_id, date, source_code)`. The ingest Route Handler uses an upsert so a second batch for the same key overwrites the earlier rows idempotently.
- Q: What should the dashboard price widget show when the farmer has no registered farms? → A: The widget falls back to the nearest provincial market hub and shows the existing setup banner prompting farm registration; the widget does not show a farm selector itself — farm selection happens on `/prices`.

## Out of Scope

- **SMS notifications**: Price target alerts are delivered via in-app notifications and email (nodemailer SMTP); SMS alerts remain out of scope for this release.
- **Trader / Buyer purchasing mode**: The feature remains strictly farmer-focused with sell/hold recommendations. Buy orders or trader trading modes are excluded.
- **Admin web panel for manual price entry/correction**: Intentionally excluded from this build. The data path is scraper-only; there is no `admin_manual` source channel.
- **Voice input/output**: Text UI and visual charts only (voice interaction is handled under separate future specs).
- **CSV / PDF Data Export**: Downloading raw price spreadsheets or PDF exports is excluded for launch; viewing and interactive charts only.
- **Paid commercial data sources**: Zarai Mandi subscription and PAR Daily Commodity Prices are not integrated; only free official portals are used.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - View Current Market Prices (Priority: P1)

A farmer opens the price tracker to see what crops are selling for today across nearby mandis.

**Why this priority**: This is the core value — without knowing current prices, the rest of the feature has no foundation. It delivers immediate, actionable market intelligence.

**Independent Test**: A farmer can open the price tracker, select their crop and location, and see a list of current prices from nearby markets. They can make a more informed selling decision than before.

**Acceptance Scenarios**:

1. **Given** a logged-in farmer on the price tracker page with at least one registered farm, **When** they open the page, **Then** a farm-selector dropdown is visible and pre-selected to their last-chosen farm (or the first farm if none was previously chosen), and prices auto-load for that farm's nearby markets without requiring manual selection.
2. **Given** a logged-in farmer on the price tracker page with zero registered farms, **When** they open the page, **Then** the farm selector is hidden and the page falls back to the nearest provincial market hub with the existing setup banner prompting farm registration.
3. **Given** the price tracker is displaying market prices, **When** a market has no data available for the selected day, **Then** that market is shown with a clear "no data available" indicator rather than a blank or broken display.
4. **Given** a farmer is viewing prices, **When** they switch between crops, **Then** the price list updates to show prices for the newly selected crop without requiring a page reload.

---

### User Story 1.5 - Switch Farm Context (Priority: P1)

A farmer switches between their registered farms to view market prices, weather, recommendations, and best-crop insights specific to each farm's location.

**Why this priority**: Many farmers manage multiple farms in different districts. The price tracker must adapt to whichever farm they are currently interested in, without losing context.

**Independent Test**: A farmer with two farms selects each farm in turn and sees the entire price tracker page (markets, weather, predictions, recommendations, best crops) update to reflect the selected farm's district and location.

**Acceptance Scenarios**:

1. **Given** a logged-in farmer with multiple registered farms, **When** they open the farm-selector dropdown, **Then** every registered farm is listed and selectable.
2. **Given** the farmer selects a different farm from the dropdown, **When** the selection is made, **Then** prices, weather, recommendations, predictions, and best-crop suggestions all refresh immediately to reflect the new farm's location and district context.
3. **Given** the farmer selects a farm, **When** they close and reopen the price tracker in a later session, **Then** the same farm remains selected (persisted in session/localStorage).
4. **Given** the farmer is viewing price alerts, **When** they switch farms, **Then** alerts remain visible and global to the farmer (not filtered by farm district), and the nearby-market list updates to the new farm's district.
5. **Given** the farmer selects a farm, **When** the system evaluates best crops for that farm, **Then** the evaluation uses the existing daily cron-scraped data already present in `mandi_prices` (no on-demand Playwright run is triggered by farm selection).

---

### User Story 2 - Compare Prices Across Markets (Priority: P2)

A farmer compares prices for the same crop across multiple nearby markets to decide where to sell, within the context of their currently selected farm.

**Why this priority**: Market comparison is what transforms raw price data into a selling decision. It directly addresses the "which mandi should I go to" question.

**Independent Test**: A farmer selects one crop and sees a side-by-side view of prices from different markets, with clear highlighting of the best price. They can identify the most profitable market at a glance.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing prices for a crop, **When** they look at the market comparison view, **Then** markets are sorted by price with the highest price clearly highlighted.
2. **Given** a farmer wants to compare markets, **When** they select their home market and two nearby markets, **Then** the view shows all three with the price difference and approximate transport cost implication.
3. **Given** price data is available for multiple dates, **When** the farmer views the comparison, **Then** they can see how today's prices compare to the previous 7 days for each market.

---

### User Story 3 - See Price Trend Predictions (Priority: P2)

A farmer views predicted price movements for the next 7–14 days to plan their selling strategy, based on the district and crops relevant to their currently selected farm.

**Why this priority**: Predictions give farmers forward-looking intelligence, turning reactive price-checking into proactive decision-making. This is the feature's unique value beyond a simple price list.

**Independent Test**: A farmer selects a crop and sees a chart showing predicted prices for the next two weeks alongside recent historical prices. They can see whether prices are expected to rise or fall.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing a crop's price page, **When** predictions are available, **Then** a chart displays both historical prices and predicted prices for the next 7–14 days.
2. **Given** predictions are displayed, **When** the farmer views the chart, **Then** each predicted data point includes a confidence range showing the likely price band.
3. **Given** a crop has no prediction available, **When** the farmer tries to view predictions, **Then** a clear message explains that predictions are not yet available for this crop and suggests checking back later.
4. **Given** the prediction model has insufficient historical data for a crop, **When** predictions are requested, **Then** the system shows historical prices without predictions and indicates that more data is needed.

---

### User Story 4 - Receive Sell/Hold Recommendation (Priority: P2)

A farmer gets a clear recommendation on whether to sell now or hold for later based on current prices and predicted trends for their selected farm's nearby markets.

**Why this priority**: Farmers need guidance, not just data. A recommendation translates complex price analysis into a simple, actionable instruction.

**Independent Test**: A farmer looks at a crop's price page and sees a prominent recommendation (sell or hold) with a brief explanation of why. They can act on this recommendation without needing to interpret charts themselves.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing a crop's price analysis, **When** the system has data available, **Then** a clear recommendation appears: sell now or hold for better prices.
2. **Given** a recommendation is shown, **When** the farmer looks at the details, **Then** a short plain-language explanation accompanies the recommendation (e.g., "Prices are rising and expected to peak in 5 days — consider holding").
3. **Given** there is insufficient data for a recommendation, **When** the farmer views the page, **Then** no recommendation is shown and the system explains that more market data is needed.

---

### User Story 5 - Manage Favorite Crops (Priority: P3)

A farmer marks crops as favorites so they appear as quick-access tiles on the dashboard widget and can be managed from a dedicated favorites page.

**Why this priority**: Personalization increases daily engagement. The dashboard widget is most useful when it shows the crops the farmer actually sells.

**Independent Test**: A farmer taps the star icon on three crop cards, visits the dashboard, and sees those three crops with mini-sparklines. Removing a star updates the dashboard within the same session.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing any crop in the price tracker, **When** they tap the star icon on that crop's card, **Then** the crop is added to their favorites list and the star toggles to a filled state.
2. **Given** a crop is already a favorite, **When** the farmer taps the star again, **Then** the crop is removed from favorites and the star returns to an outline state.
3. **Given** a farmer has favorited crops, **When** they view the dashboard, **Then** the price widget shows up to 3 favorited crops with 7-day mini-sparklines, ordered by the farmer's display preference.
4. **Given** a farmer visits the `/favourites` route, **When** the page loads, **Then** all favorited crops are listed with the ability to remove each one.
5. **Given** a farmer removes a crop from favorites on the `/favourites` page, **When** the removal is confirmed, **Then** the dashboard widget updates on next load to reflect the new favorites list.

---

### User Story 6 - Set Price Alerts (Priority: P3)

A farmer sets a target price for a crop and receives an alert when the market price reaches or exceeds that target. Alerts are global to the farmer and not tied to a specific farm selection.

**Why this priority**: Alerts automate the monitoring process, so farmers don't need to check prices daily. This is a convenience feature that increases the feature's daily utility.

**Independent Test**: A farmer sets a target price for wheat (e.g., PKR 5,000 per maund), and when the mandi price reaches that level, they receive a notification in the app.

**Acceptance Scenarios**:

1. **Given** a logged-in farmer is viewing a crop's prices, **When** they set a target price, **Then** the alert is saved and confirmed with a message showing the target and crop.
2. **Given** a farmer has an active price alert, **When** the market price crosses their target, **Then** they receive an in-app notification AND an email alert (via nodemailer SMTP) containing crop name, market location, target price, and current market price.
3. **Given** a farmer has multiple active alerts, **When** one triggers, **Then** they receive a notification that identifies the specific crop and market.
4. **Given** a farmer no longer wants an alert, **When** they delete the alert, **Then** it is removed and no further notifications are sent for that target.

---

### User Story 7 - View Price History (Priority: P3)

A farmer reviews historical price trends for a crop to understand seasonal patterns and make better future decisions, scoped to the markets relevant to their currently selected farm.

**Why this priority**: Historical context helps farmers understand whether current prices are good or bad relative to seasonal norms, improving their overall market intuition.

**Independent Test**: A farmer selects a crop and views a chart showing prices over the past 3–12 months. They can identify seasonal highs and lows.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing a crop, **When** they open the price history view, **Then** a chart shows daily prices for the past 3 months.
2. **Given** the history view is open, **When** the farmer selects a longer date range, **Then** the chart updates to show prices for the selected period.
3. **Given** historical data has gaps, **When** the chart is rendered, **Then** gaps are handled gracefully without breaking the chart display.

---

### Edge Cases

- What happens when a market has no price data for the selected date?
- How does the system handle a farmer setting a target price below the current market price?
- What happens when price data is delayed or missing for an entire region?
- How does the system handle extremely volatile prices that change multiple times per day?
- What happens when a farmer sets alerts for multiple crops and all trigger simultaneously?
- How does the system handle crops with very little historical data for predictions?
- What happens when the prediction model's confidence is very low?
- What happens when one of the scraper's source portals is down on a given day?
- What happens when the GitHub Actions cron fails before POSTing any rows to `/api/prices/ingest`?
- What happens when the cron partial-succeeds (one source scraped, another failed)?
- What happens when the farmer selects a farm that has no nearby mandis with price data?
- How does the system behave when the farmer switches farms while a prediction chart or alert list is already loading?
- What happens when the farmer's last-selected farm is deleted or becomes inaccessible?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST display current crop prices for markets within the farmer's registered district and immediately bordering districts (or default to the nearest regional provincial market hub with a setup banner if no farm location is registered), standardized in PKR per Maund (40 kg).
- **FR-002**: System MUST show prices for at least 5 nearby markets for each crop view.
- **FR-003**: System MUST refresh displayed prices at least once per trading day by scraping four official Pakistani provincial portals — Punjab AMIS (`amis.pk`), Sindh SAMIS (`new-theme.staging-amis.com`), KP FMIS (`fmis.kp.gov.pk`), and Balochistan BMIS (`amisbalochistan.org`) — plus a federal PBS Weekly SPI XLSX cross-check; runs on the existing free GitHub Actions cron; each scrape batch authenticates to `POST /api/prices/ingest` with a bearer token, and the Route Handler is the single write path into `mandi_prices`. Sundays and official market holidays render a distinct `"Mandi Closed / Market Holiday"` status badge. If a source is down, the market's last known price is kept and a prominent `"Updated X days ago"` badge is shown; no partial writes.
- **FR-004**: System MUST allow farmers to select which crop they want to view prices for, displaying crop names strictly according to the user's active UI language setting.
- **FR-005**: System MUST sort market prices from highest to lowest, highlighting the best available price and displaying daily price changes as both percentage and absolute PKR difference (e.g., "+3.2% (+150 PKR/Maund)").
- **FR-006**: System MUST display historical price data defaulting to a 3-month view for each crop, supporting custom date range selector toggles (1M, 3M, 6M, 12M up to 12 months).
- **FR-007**: System MUST show price trends as a visual chart for the selected time period.
- **FR-008**: System MUST predict price movements for the next 7–14 days for all crops with available historical data, displaying a prominent confidence warning badge when prediction data is limited.
- **FR-009**: System MUST display predicted prices for 14 discrete daily forecast points with a shaded upper and lower confidence range band.
- **FR-010**: System MUST provide a sell/hold recommendation whenever data is available, accompanied by a prominent "High Volatility / Low Data" warning badge when prediction confidence is low.
- **FR-011**: System MUST explain each recommendation in plain language alongside the recommendation.
- **FR-012**: System MUST allow farmers to set unlimited sell-only target price alerts for any crop (triggering when market price reaches or exceeds target price).
- **FR-013**: System MUST notify farmers in the app AND via email (using nodemailer + SMTP) on every daily price update where a market price reaches or exceeds their target. Notifications follow a dual pattern: (1) a single daily in-app digest pinned at the top of the feed summarising all triggered alerts for that day ("N target prices reached today"), and (2) one separate HTML email per triggered alert, each containing crop name, market location, target price, current market price, and a direct "View Mandi Prices" deep-link button (`/prices?crop=X&mandi=Y`). In-app alert notifications are highlighted with a green badge and pinned to the top of the feed.
- **FR-014**: System MUST allow farmers to view, edit target prices in-place, toggle active/paused status, and delete their price alerts.
- **FR-015**: System MUST allow farmers to compare prices and view distance in km AND an estimated transport cost in PKR (using a flat per-km rate) from their farm location across multiple selected markets on a single view.
- **FR-016**: System MUST handle markets with missing daily price updates from government APIs by showing the last recorded price with a prominent "Updated X days ago" badge for up to 7 days; after 7 days without fresh data the market must show a "data not available" state.
- **FR-017**: System MUST ensure price displays, history charts, and trend predictions are tailored to the farmer's selected crops and district context.
- **FR-018**: System MUST handle historical price data rendering seamlessly across custom date ranges up to 12 months without breaking visual charts.
- **FR-019**: System MUST only show prices and predictions relevant to the farmer's selected crops and region.
- **FR-020**: System MUST refresh and cache predictions daily via a scheduled nightly background cron job when new price data becomes available.
- **FR-021**: System MUST provide a global search bar allowing farmers to search and select any mandi or crop across all districts of Pakistan.
- **FR-022**: System MUST render a summary widget on the main dashboard (`/dashboard`) displaying top 3 tracked/favorite crops with 7-day price trend mini-sparklines.
- **FR-023**: System MUST cache the last viewed price list and history charts in browser local storage to enable offline viewing when connectivity is lost.
- **FR-024**: System MUST ensure that every new or updated user interface string (including page headers, button labels, badge texts, alert notifications, chart legend labels, and search placeholders) has corresponding translation keys and translated strings inserted into the Neon database `translations` table across all 8 supported Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) using Neon MCP or `scripts/sync-translations.mts` before the feature is marked complete.
- **FR-025**: System MUST mark every `mandi_prices` row with `source = 'govt_api'` and additionally tag the originating portal via `source_code` (`amis_pk` | `samis_pk` | `fmis_kp` | `bmis_balochistan` | `pbs_spi` | `seed_pk_initial`); `admin_manual` is intentionally NOT supported in this build.
- **FR-026**: System MUST render a farm-selector dropdown on the `/prices` page that lists every farm registered to the logged-in farmer. If the farmer has zero farms, the selector MUST be hidden and the page MUST fall back to the nearest provincial market hub with the existing setup banner.
- **FR-027**: System MUST persist the last-selected farm in the farmer's session/localStorage and restore it on subsequent visits to the `/prices` page.
- **FR-028**: System MUST recontextualize the entire price tracker — nearby mandis, weather, recommendations, predictions, and best-crop suggestions — immediately upon farm selection, without requiring a manual refresh or page reload.
- **FR-029**: System MUST keep price alerts global to the farmer regardless of which farm is selected; switching farms MUST NOT filter, pause, or delete existing alerts.
- **FR-030**: System MUST derive "best crops" and on-page crop suggestions from the existing daily cron-scraped data already present in `mandi_prices`; farm selection MUST NOT trigger an on-demand Playwright scrape run.

### Key Entities *(include if feature involves data)*

- **Crop Price**: A recorded price entry for a specific crop at a specific market on a specific date. Includes Modal (prevailing) price, Minimum traded price, Maximum traded price in PKR per Maund (40 kg), price unit, and market source.
- **Market**: A physical or virtual mandi/market where crops are traded. Includes market name, location, district, bordering districts, and crops traded.
- **Price Prediction**: A forecast of future prices for a crop, generated from historical data via a scheduled nightly background cron job and cached in Postgres. Includes predicted values per Maund, confidence bounds, prediction date range, and confidence status indicator.
- **Price Alert**: A farmer's target price setting for a specific crop. Includes target price in PKR per Maund, crop ID, target condition (`>= target`), creation date, active/paused status, and trigger history.
- **Farmer Crop Preference**: The set of crops a farmer is interested in tracking, used to personalize the price tracker experience.
- **Price Source**: One of the official portals the scraper knows how to talk to — Punjab AMIS, Sindh SAMIS, KP FMIS, Balochistan BMIS, or PBS Weekly SPI XLSX. Each has a stable `source_code` used for logging, debugging, and per-source enable/disable toggles.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Farmers can view current prices for their selected crop across nearby markets within 3 taps from the dashboard.
- **SC-002**: For every market that reported on the most recent trading day, the price shown is from that day; if no fresh row exists, the UI shows the last known price plus a visible "Updated X days ago" badge. (The freshness contract is bounded by the daily cron, not by 24h SLA — see SC-011.)
- **SC-003**: Farmers can identify the best nearby market to sell at within 10 seconds of opening the price comparison view.
- **SC-004**: Price predictions cover a 14-day forward horizon with visible confidence ranges on the chart.
- **SC-005**: A farmer can set a price alert in under 30 seconds.
- **SC-006**: Price alerts are dispatched (in-app + email) within the same daily cron run that ingests the price row that crossed the target.
- **SC-007**: The price tracker supports at least 10 major crop types commonly grown in Pakistan.
- **SC-008**: 90% of farmers can find the price they need and understand the recommendation without assistance.
- **SC-009**: Price data is available for markets in every district of Pakistan at launch — initially from the seed for provinces whose portals are not yet wired into the cron, and from the scraper once the corresponding source is enabled.
- **SC-010**: Historical price charts display data spanning at least 3 months for each supported crop.
- **SC-011**: The free GitHub Actions cron successfully ingests prices from at least the Punjab AMIS source daily; the run completes in under 15 minutes and POSTs all collected rows to `/api/prices/ingest` in a single authenticated batch.
- **SC-012**: When a provincial portal (e.g. SAMIS) is unreachable, the cron logs the failure, leaves the existing rows untouched, and no user-visible price is wiped or set to zero.
- **SC-013**: `GET /api/prices` responds with p95 latency < 200ms at the Vercel edge for a farmer session with district + bordering districts selected (measured on a 14-day rolling window via Vercel Analytics).
- **SC-014**: When a logged-in farmer with multiple farms opens `/prices`, the farm selector is visible and the page auto-loads data for the persisted or first farm within 2 seconds on a 4G connection.
- **SC-015**: Switching farms via the dropdown refreshes prices, weather, recommendations, predictions, and best-crop suggestions in under 3 seconds without a full page reload.
