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

1. **Given** a logged-in farmer on the price tracker page, **When** they select a crop and their district, **Then** they see current prices from at least 5 nearby markets sorted by price.
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

A farmer gets a clear recommendation on whether to sell now, hold for later, or buy based on current prices and predicted trends.

**Why this priority**: Farmers need guidance, not just data. A recommendation translates complex price analysis into a simple, actionable instruction.

**Independent Test**: A farmer looks at a crop's price page and sees a prominent recommendation (sell, hold, or buy) with a brief explanation of why. They can act on this recommendation without needing to interpret charts themselves.

**Acceptance Scenarios**:

1. **Given** a farmer is viewing a crop's price analysis, **When** the system has sufficient data, **Then** a clear recommendation appears: sell now, hold for better prices, or buy (for traders).
2. **Given** a recommendation is shown, **When** the farmer looks at the details, **Then** a short plain-language explanation accompanies the recommendation (e.g., "Prices are rising and expected to peak in 5 days — consider holding").
3. **Given** there is insufficient data for a recommendation, **When** the farmer views the page, **Then** no recommendation is shown and the system explains that more market data is needed.

---

### User Story 5 - Set Price Alerts (Priority: P3)

A farmer sets a target price for a crop and receives an alert when the market price reaches or exceeds that target.

**Why this priority**: Alerts automate the monitoring process, so farmers don't need to check prices daily. This is a convenience feature that increases the feature's daily utility.

**Independent Test**: A farmer sets a target price for wheat (e.g., PKR 5,000 per maund), and when the mandi price reaches that level, they receive a notification in the app.

**Acceptance Scenarios**:

1. **Given** a logged-in farmer is viewing a crop's prices, **When** they set a target price, **Then** the alert is saved and confirmed with a message showing the target and crop.
2. **Given** a farmer has an active price alert, **When** the market price crosses their target, **Then** they receive an in-app notification within a reasonable time of the price update.
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

- **FR-001**: System MUST display current crop prices for markets near the farmer's registered location.
- **FR-002**: System MUST show prices for at least 5 nearby markets for each crop view.
- **FR-003**: System MUST update displayed prices at least once per trading day.
- **FR-004**: System MUST allow farmers to select which crop they want to view prices for.
- **FR-005**: System MUST sort market prices from highest to lowest, highlighting the best available price.
- **FR-006**: System MUST display historical price data for at least the past 3 months for each crop.
- **FR-007**: System MUST show price trends as a visual chart for the selected time period.
- **FR-008**: System MUST predict price movements for the next 7–14 days where sufficient historical data exists.
- **FR-009**: System MUST display predicted prices with a confidence range showing upper and lower bounds.
- **FR-010**: System MUST provide a sell/hold/buy recommendation when sufficient data is available.
- **FR-011**: System MUST explain each recommendation in plain language alongside the recommendation.
- **FR-012**: System MUST allow farmers to set a target price alert for any crop.
- **FR-013**: System MUST notify farmers in the app when a market price reaches or exceeds their target.
- **FR-014**: System MUST allow farmers to view, manage, and delete their active price alerts.
- **FR-015**: System MUST allow farmers to compare prices across multiple selected markets on a single view.
- **FR-016**: System MUST handle markets with missing price data by showing a clear indicator instead of blank values.
- **FR-017**: System MUST not show predictions or recommendations for crops with insufficient historical data, and must explain why.
- **FR-018**: System MUST allow farmers to view price history for custom date ranges up to 12 months.
- **FR-019**: System MUST only show prices and predictions relevant to the farmer's selected crops and region.
- **FR-020**: System MUST refresh predictions daily when new price data becomes available.

*Example of marking unclear requirements:*

- **FR-021**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-022**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **Crop Price**: A recorded price for a specific crop at a specific market on a specific date. Includes the price value, unit of measurement, and market source.
- **Market**: A physical or virtual mandi/market where crops are traded. Includes market name, location, district, and the crops traded there.
- **Price Prediction**: A forecast of future prices for a crop, generated from historical data. Includes predicted values, confidence bounds, prediction date range, and the model used.
- **Price Alert**: A farmer's target price setting for a specific crop. Includes the target price, crop, creation date, and active status.
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
- **SC-009**: Price data is available for markets in at least 3 major agricultural districts of Pakistan at launch.
- **SC-010**: Historical price charts display data spanning at least 3 months for each supported crop.
