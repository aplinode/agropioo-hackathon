# Feature Specification: Mandi Price Tracker

**Feature Branch**: `002-mandi-price-tracker`  
**Created**: 2026-08-30  
**Status**: Draft  
**Input**: User description: "Now lets start building this feature Mandi Price Tracker & Predictor

**Problem:** Farmers sell crops at low prices due to lack of market intelligence and price volatility.

**Solution:** Real-time mandi prices displayed for nearby markets + ML model predicts price trends for next 7-14 days → alerts farmer when to sell for maximum profit.

**How It Works (No Hardware):**
- System scrapes/fetches daily mandi prices from government APIs
- Prices displayed on dashboard with market-wise comparison
- LSTM or Facebook Prophet model trained on historical price data
- Price trend shown as chart with buy/sell/hold recommendation
- SMS/app alerts when price crosses farmer's target threshold"

## Clarifications

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
- Q: How should transport cost implications be shown in market comparisons (User Story 2)? → A: Display distance in km from farm location to each mandi without calculating PKR transport costs
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
- Q: How should mandi price data ingestion be handled behind the scenes? → A: Automated daily scraper from government APIs, plus an admin web panel for manual price entry/correction
- Q: What action link should be included in price alert email notifications? → A: Direct "View Mandi Prices" deep-link button linking to /prices?crop=X&mandi=Y in the email
- Q: How should the price tracker behave when the farmer is offline / low connectivity? → A: Cache last viewed price list and history charts in browser local storage for offline viewing
- Q: When should price alert evaluations and email/in-app dispatches be executed? → A: Evaluate all active price alerts immediately after the daily price ingestion pipeline completes
- Q: Should historical price data export (CSV / PDF) be included? → A: Out of scope for launch (viewing and visual charts only)

## Out of Scope

- **SMS notifications**: Price target alerts are delivered via in-app notifications and email (nodemailer SMTP); SMS alerts remain out of scope for this release.
- **Trader / Buyer purchasing mode**: The feature remains strictly farmer-focused with sell/hold recommendations. Buy orders or trader trading modes are excluded.
- **Hardware sensors or manual field price reporting**: Data is sourced via API/scraping integration only.
- **Voice input/output**: Text UI and visual charts only (voice interaction is handled under separate future specs).
- **CSV / PDF Data Export**: Downloading raw price spreadsheets or PDF exports is excluded for launch; viewing and interactive charts only.

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

1. **Given** a logged-in farmer on the price tracker page, **When** they open the page, **Then** the system automatically loads current prices for markets near their registered farm location without requiring manual selection.
2. **Given** the price tracker is displaying market prices, **When** a market has no data available for the selected day, **Then** that market is shown with a clear "no data available" indicator rather than a blank or broken display.
3. **Given** a farmer is viewing prices, **When** they switch between crops, **Then** the price list updates to show prices for the newly selected crop without requiring a page reload.

---

### User Story 2 - Compare Prices Across Markets (Priority: P2)

A farmer compares prices for the same crop across multiple nearby markets to decide where to sell.

**Why this priority**: Market comparison is what transforms raw price data into a selling decision. It directly addresses the "which mandi should I go to" question.

**Independent Test**: A farmer selects one crop and sees a side-by-side view of prices from different markets, with clear highlighting of the best price. They can identify the most profitable market at a glance.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing prices for a crop, **When** they look at the market comparison view, **Then** markets are sorted by price with the highest price clearly highlighted.
2. **Given** a farmer wants to compare markets, **When** they select their home market and two nearby markets, **Then** the view shows all three with the price difference and approximate transport cost implication.
3. **Given** price data is available for multiple dates, **When** the farmer views the comparison, **Then** they can see how today's prices compare to the previous 7 days for each market.

---

### User Story 3 - See Price Trend Predictions (Priority: P2)

A farmer views predicted price movements for the next 7–14 days to plan their selling strategy.

**Why this priority**: Predictions give farmers forward-looking intelligence, turning reactive price-checking into proactive decision-making. This is the feature's unique value beyond a simple price list.

**Independent Test**: A farmer selects a crop and sees a chart showing predicted prices for the next two weeks alongside recent historical prices. They can see whether prices are expected to rise or fall.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing a crop's price page, **When** predictions are available, **Then** a chart displays both historical prices and predicted prices for the next 7–14 days.
2. **Given** predictions are displayed, **When** the farmer views the chart, **Then** each predicted data point includes a confidence range showing the likely price band.
3. **Given** a crop has no prediction available, **When** the farmer tries to view predictions, **Then** a clear message explains that predictions are not yet available for this crop and suggests checking back later.
4. **Given** the prediction model has insufficient historical data for a crop, **When** predictions are requested, **Then** the system shows historical prices without predictions and indicates that more data is needed.

---

### User Story 4 - Receive Sell/Hold Recommendation (Priority: P2)

A farmer gets a clear recommendation on whether to sell now or hold for later based on current prices and predicted trends.

**Why this priority**: Farmers need guidance, not just data. A recommendation translates complex price analysis into a simple, actionable instruction.

**Independent Test**: A farmer looks at a crop's price page and sees a prominent recommendation (sell or hold) with a brief explanation of why. They can act on this recommendation without needing to interpret charts themselves.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing a crop's price analysis, **When** the system has data available, **Then** a clear recommendation appears: sell now or hold for better prices.
2. **Given** a recommendation is shown, **When** the farmer looks at the details, **Then** a short plain-language explanation accompanies the recommendation (e.g., "Prices are rising and expected to peak in 5 days — consider holding").
3. **Given** there is insufficient data for a recommendation, **When** the farmer views the page, **Then** no recommendation is shown and the system explains that more market data is needed.

---

### User Story 5 - Set Price Alerts (Priority: P3)

A farmer sets a target price for a crop and receives an alert when the market price reaches or exceeds that target.

**Why this priority**: Alerts automate the monitoring process, so farmers don't need to check prices daily. This is a convenience feature that increases the feature's daily utility.

**Independent Test**: A farmer sets a target price for wheat (e.g., PKR 5,000 per maund), and when the mandi price reaches that level, they receive a notification in the app.

**Acceptance Scenarios**:

1. **Given** a logged-in farmer is viewing a crop's prices, **When** they set a target price, **Then** the alert is saved and confirmed with a message showing the target and crop.
2. **Given** a farmer has an active price alert, **When** the market price crosses their target, **Then** they receive an in-app notification AND an email alert (via nodemailer SMTP) containing crop name, market location, target price, and current market price.
3. **Given** a farmer has multiple active alerts, **When** one triggers, **Then** they receive a notification that identifies the specific crop and market.
4. **Given** a farmer no longer wants an alert, **When** they delete the alert, **Then** it is removed and no further notifications are sent for that target.

---

### User Story 6 - View Price History (Priority: P3)

A farmer reviews historical price trends for a crop to understand seasonal patterns and make better future decisions.

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

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST display current crop prices for markets within the farmer's registered district and immediately bordering districts (or default to the nearest regional provincial market hub with a setup banner if no farm location is registered), standardized in PKR per Maund (40 kg).
- **FR-002**: System MUST show prices for at least 5 nearby markets for each crop view.
- **FR-003**: System MUST update displayed prices at least once per trading day via an automated daily scraper from government APIs (with admin web panel fallback for manual data entry/corrections), executing alert evaluations immediately post-ingestion and displaying a distinct "Mandi Closed / Market Holiday" status badge on Sundays and market holidays.
- **FR-004**: System MUST allow farmers to select which crop they want to view prices for, displaying crop names strictly according to the user's active UI language setting.
- **FR-005**: System MUST sort market prices from highest to lowest, highlighting the best available price and displaying daily price changes as both percentage and absolute PKR difference (e.g., "+3.2% (+150 PKR/Maund)").
- **FR-006**: System MUST display historical price data defaulting to a 3-month view for each crop, with date range selector toggles (1M, 3M, 6M, 12M).
- **FR-007**: System MUST show price trends as a visual chart for the selected time period.
- **FR-008**: System MUST predict price movements for the next 7–14 days whenever historical data exists, showing a confidence warning when data is limited.
- **FR-009**: System MUST display predicted prices for 14 discrete daily forecast points with a shaded upper and lower confidence range band.
- **FR-010**: System MUST provide a sell/hold recommendation whenever data is available, accompanied by a prominent "High Volatility / Low Data" warning badge when prediction confidence is low.
- **FR-011**: System MUST explain each recommendation in plain language alongside the recommendation.
- **FR-012**: System MUST allow farmers to set unlimited sell-only target price alerts for any crop (triggering when market price reaches or exceeds target price).
- **FR-013**: System MUST notify farmers in the app AND via email (using nodemailer + SMTP) on every daily price update where a market price reaches or exceeds their target, including a direct "View Mandi Prices" deep-link button (`/prices?crop=X&mandi=Y`) in emails, highlighting in-app alert notifications with a green badge and pinning them to the top of the in-app notification feed.
- **FR-014**: System MUST allow farmers to view, edit target prices in-place, toggle active/paused status, and delete their price alerts.
- **FR-015**: System MUST allow farmers to compare prices and view distance in km from their farm location across multiple selected markets on a single view.
- **FR-016**: System MUST handle markets with missing daily price updates from government APIs by showing the last recorded price with a prominent "Updated X days ago" badge.
- **FR-017**: System MUST show predictions and recommendations for all crops with available historical data, displaying a confidence warning when data is limited.
- **FR-018**: System MUST allow farmers to view price history for custom date ranges up to 12 months.
- **FR-019**: System MUST only show prices and predictions relevant to the farmer's selected crops and region.
- **FR-020**: System MUST refresh and cache predictions daily via a scheduled nightly background cron job when new price data becomes available.
- **FR-021**: System MUST provide a global search bar allowing farmers to search and select any mandi or crop across all districts of Pakistan.
- **FR-022**: System MUST render a summary widget on the main dashboard (`/dashboard`) displaying top 3 tracked/favorite crops with 7-day price trend mini-sparklines.
- **FR-023**: System MUST cache the last viewed price list and history charts in browser local storage to enable offline viewing when connectivity is lost.
- **FR-024**: System MUST ensure that every new or updated user interface string (including page headers, button labels, badge texts, alert notifications, chart legend labels, and search placeholders) has corresponding translation keys and translated strings inserted into the Neon database `translations` table across all 8 supported Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) using Neon MCP or `scripts/sync-translations.mts` before the feature is marked complete.

### Key Entities *(include if feature involves data)*

- **Crop Price**: A recorded price entry for a specific crop at a specific market on a specific date. Includes Modal (prevailing) price, Minimum traded price, Maximum traded price in PKR per Maund (40 kg), price unit, and market source.
- **Market**: A physical or virtual mandi/market where crops are traded. Includes market name, location, district, bordering districts, and crops traded.
- **Price Prediction**: A forecast of future prices for a crop, generated from historical data via a scheduled nightly background cron job and cached in Postgres. Includes predicted values per Maund, confidence bounds, prediction date range, and confidence status indicator.
- **Price Alert**: A farmer's target price setting for a specific crop. Includes target price in PKR per Maund, crop ID, target condition (`>= target`), creation date, active/paused status, and trigger history.
- **Farmer Crop Preference**: The set of crops a farmer is interested in tracking, used to personalize the price tracker experience.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Farmers can view current prices for their selected crop across nearby markets within 3 taps from the dashboard.
- **SC-002**: Prices displayed on the tracker are no older than 24 hours at the time of viewing.
- **SC-003**: Farmers can identify the best nearby market to sell at within 10 seconds of opening the price comparison view.
- **SC-004**: Price predictions cover a 14-day forward horizon with visible confidence ranges on the chart.
- **SC-005**: A farmer can set a price alert in under 30 seconds.
- **SC-006**: Price alerts are delivered in the app within 2 hours of the market price crossing the target threshold.
- **SC-007**: The price tracker supports at least 10 major crop types commonly grown in Pakistan.
- **SC-008**: 90% of farmers can find the price they need and understand the recommendation without assistance.
- **SC-009**: Price data is available for markets in every district of Pakistan at launch.
- **SC-010**: Historical price charts display data spanning at least 3 months for each supported crop.
