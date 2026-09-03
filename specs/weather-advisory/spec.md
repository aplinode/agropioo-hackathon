# Smart Weather Advisory

**Feature Branch**: `001-weather-advisory`  
**Created**: 2026-08-30  
**Status**: Draft  
**Input**: User description: "Smart Weather Advisory"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register farm and receive daily advice (Priority: P1)

Farmer registers their crop type, sowing date, and farm location. Each morning they open the app and see a personalized advisory telling them what farming action to take today based on the weather forecast and their crop's current growth stage.

**Why this priority**: This is the core value of the feature — turning weather data into farming decisions. Without it, the feature has no purpose.

**Independent Test**: A farmer registers one farm, logs in the next day, and sees a personalized advisory for their crop and location. The advisory tells them what to do today.

**Acceptance Scenarios**:

1. **Given** the farmer has registered a crop, sowing date, and location, **When** they open the app, **Then** they see a daily advisory with a specific farming recommendation.
2. **Given** the farmer has not registered any farm details, **When** they open the app, **Then** they are prompted to register a farm before seeing advisories.

---

### User Story 2 - Receive critical weather alerts (Priority: P2)

Farmer receives an alert when weather conditions threaten their crop — such as heavy rain expected within hours, frost risk, extreme heat, or high humidity that favors disease.

**Why this priority**: Time-sensitive alerts prevent crop damage. This differentiates the feature from a generic weather app.

**Independent Test**: A farmer receives an alert for their registered crop when a critical weather event is forecast within the next few hours.

**Acceptance Scenarios**:

1. **Given** heavy rain is forecast for the farmer's location within 3 hours, **When** the condition is detected, **Then** the farmer receives an alert advising them to delay irrigation.
2. **Given** high humidity and warm temperatures are forecast, **When** the condition favors crop disease, **Then** the farmer receives an alert recommending preventive fungicide application.

---

### User Story 3 - View 7-day forecast with daily advice (Priority: P3)

Farmer views a 7-day forecast where each day shows the weather prediction alongside a farming-specific recommendation for their crop and growth stage.

**Why this priority**: Helps farmers plan ahead for the week rather than reacting only to today's conditions.

**Independent Test**: A farmer navigates to the weather advisory page and sees a 7-day forecast with one actionable recommendation per day.

**Acceptance Scenarios**:

1. **Given** the farmer has registered farm details, **When** they view the 7-day forecast, **Then** each day shows a weather summary and a specific farming recommendation.
2. **Given** the farmer has multiple farms registered, **When** they select a different farm, **Then** the forecast and recommendations update to match that farm's crop and location.

---

### User Story 4 - Review advisory history (Priority: P4)

Farmer reviews past advisories to see what was recommended on previous days and track whether they acted on the advice.

**Why this priority**: Builds trust in the system and helps farmers learn patterns over time.

**Independent Test**: A farmer views a list of past advisories, taps one, and sees the full recommendation and weather conditions for that day.

**Acceptance Scenarios**:

1. **Given** the farmer has received advisories for the past week, **When** they view advisory history, **Then** they see a list of past advisories sorted by date.
2. **Given** the farmer taps a past advisory, **When** the detail view opens, **Then** they see the full weather conditions and the recommendation that was given.

---

### Edge Cases

- When weather data is not available for the farmer's location, the system shows the last cached advisory with a visible "weather data unavailable" banner and does not generate new advice until data resumes.
- When the farmer's crop type is not found in the advisory knowledge base, the system shows generic weather-based advice without crop-specific recommendations.
- When the farmer has not registered any farm details, they are prompted to register a farm before seeing advisories.
- When extreme weather conditions exceed defined thresholds (temperature > 40°C, < 2°C, precipitation > 10mm in 3h), the alert engine classifies them as critical and sends alerts per FR-005.
- When multiple farms are registered with different crops and sowing dates, the farmer can switch between farms and receives separate advisories per farm per FR-010.
- When the farmer's location has no reliable forecast coverage, the system displays the last cached advisory with a visible data-unavailable banner and suppresses new advice generation until coverage resumes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System must accept and store the farmer's crop type, sowing date, farm location, farm name, area size, soil type, and irrigation method through the weather-specific farm registration form. Area size is recorded in acres and used to contextualise advisory scale and input-cost recommendations where relevant. The general farm creation form is out of scope for this field; it is introduced specifically for the weather advisory feature.
- **FR-002**: System must determine the current growth stage of the farmer's crop based on the sowing date.
- **FR-003**: System must fetch a multi-day weather forecast for the farmer's farm location.
- **FR-004**: System must generate personalized farming advice for each day by combining weather conditions, crop type, and crop growth stage. If the crop type is not in the knowledge base, the system falls back to generic weather-based advice without crop-specific recommendations.
- **FR-005**: System must send alerts via email and in-app notification when weather conditions pose a significant risk to the farmer's crop.
- **FR-006**: System must display advisory history for the farmer to review past recommendations.
- **FR-007**: System must present all advice, alerts, labels, buttons, and status messages in the farmer's selected language. Every visible string in the weather advisory UI must have translation keys for all 8 project locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`). Translations are stored in the Neon `translations` table and resolved server-side at render time; the client never hardcodes user-facing copy.
- **FR-008**: System must recommend irrigation timing based on expected rainfall.
- **FR-009**: System must recommend disease prevention measures when humidity and temperature conditions favor crop diseases.
- **FR-010**: System must support multiple farm registrations and deliver separate advisories per farm.
- **FR-011**: System must allow the farmer to mark an advisory as acknowledged or acted upon.
- **FR-012**: System must namespace all weather advisory translation keys under `app.weather.*` in the catalog and `translations` table. The server-side bundle `getWeatherBundle()` must resolve all UI strings per request; no user-facing string may be hardcoded in client components.

### Key Entities

- **Farm Registration**: Represents a farmer's field with crop type, sowing date, location, farm name, area size, soil type, and irrigation method. One farmer may have multiple registrations.
- **Weather Advisory**: Represents a daily recommendation tied to a specific farm, date, weather conditions, crop growth stage, and advice text. Includes a severity level. The `advice_text` is rendered from a translation key (`advice_key`) resolved server-side.
- **Weather Alert**: Represents a time-sensitive notification triggered by forecasted conditions that pose a risk to the farmer's crop. The `recommendation` is rendered from a translation key (`recommendation_key`) resolved server-side.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Farmer receives a personalized daily advisory within 30 seconds of opening the app.
- **SC-002**: Advisory is relevant to the farmer's registered crop and its current growth stage.
- **SC-003**: Farmer receives critical weather alerts within 15 minutes of the condition being detected.
- **SC-004**: Farmer can act on advisory recommendations using only information provided in the advisory — no external lookup required.
- **SC-005**: Advisory helps the farmer avoid unnecessary irrigation before expected rainfall.
- **SC-006**: Every visible string in the weather advisory UI is translated in all 8 project locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) with no hardcoded client-side copy.

---

## Clarifications

### Session 2026-08-30

- Q: Which weather data provider/integration should the system use? → A: OpenWeatherMap API
- Q: How should critical weather alerts be delivered to the farmer? → A: Email and in-app notification
- Q: What specific attributes must the Farm Registration entity store, and what validation constraints apply? → A: Option B — crop type, sowing date, location, farmer ID, farm name, area size, soil type, irrigation method
- Q: What should happen when the weather provider is unavailable or returns incomplete data for the farmer's location? → A: Show last cached advisory with "data unavailable" banner; no new advice generated until weather data returns
- Q: What should the system do when the farmer's crop type is not found in the advisory knowledge base? → A: Show generic weather advice without crop-specific recommendations
- Q: How are weather advisory UI strings translated and delivered to the client? → A: Strings are authored in `catalog/en.ts` under `app.weather.*`, drafted in the other 7 locale catalogs, synced to the `translations` table via `npm run sync:translations`, and resolved server-side through `getWeatherBundle()`; no hardcoded client-side copy.
- Q: What is the translation key namespace for weather advisory strings? → A: `app.weather.*` (e.g. `app.weather.pageTitle`, `app.weather.advisory.recommendation.irrigation`, `app.weather.alerts.heavyRain`).
- Q: Should daily advisories be generated on-demand when the farmer opens the app, or pre-generated on a schedule? → A: On-demand generation when the farmer opens the app or views the forecast page. No scheduled daily advisory job is required. This satisfies SC-001's 30-second target and keeps the MVP architecture simple.
- Q: When a farmer has multiple farms, which farm is shown by default and can they switch? → A: Show the most recently active/registered farm by default. The farmer must be able to switch to other registered farms to view their advisories.
- Q: How often can the same alert condition re-trigger for a farm? → A: One alert per condition type per farm per 6-hour window. The alert engine deduplicates within this window to prevent spam while still catching recurring or persistent risks.
- Q: Where should growth stage be computed — dynamically at advisory time or stored at registration? → A: Compute dynamically each time an advisory is generated, based on the current date relative to the sowing date and crop duration. This avoids stale stage data.
- Q: Should email alerts be sent for both warning and critical severities, or only critical? → A: Email for both warning and critical alerts. In-app notifications show both severities.
- Q: Where should the `acres` (area size) field be captured — in the general farm creation form or the weather-specific registration form? → A: `acres` is introduced only through the weather-specific farm registration form (`POST /api/weather/register`). It is not added to the general farm creation form in this feature.
- Q: The weather advisor agent's `getWeather` tool currently returns only current weather, but its instructions reference forecast-based guidance. How should this gap be resolved? → A: Add a dedicated `get_forecast` tool to the weather advisor agent so it can provide forecast-aware guidance (spray windows, irrigation timing, harvest windows). The existing `getWeather` tool remains for current conditions.
- Q: Should AI-generated daily advice be cached to avoid repeated LLM calls on every page load? → A: Yes. Cache AI-generated advice in the `weather_advisories` table keyed by `(farm_id, advisory_date)`. The same day's advice is reused if the farmer revisits, keeping SC-001's 30-second target.
- Q: What is the current translation coverage state for `app.weather.*` keys across locales, and should missing locale catalogs be populated now? → A: Translation audit shows `en`, `ur`, and `pa` catalogs currently cover all 78 weather keys. Locales `ps`, `sd`, `skr`, `bal`, and `hno` are missing all 78 `app.weather.*` entries. Filling these five catalogs and syncing them to the `translations` table is deferred to the implementation phase; it is tracked as an implementation task, not a spec change.
- Q: The advisory history page (`app/(farmer)/(dashboard)/weather/history/page.tsx`) does not currently exist. Should it be specified here or left to implementation discretion? → A: It is in scope for this feature. Advisory history is surfaced as a tab on the main weather page rather than a separate route. The tab shows a list of past advisories for the farmer's farms and provides a detail view for each advisory, consistent with US4.
- Q: AI-generated daily advice is cached in `weather_advisories` keyed by `(farm_id, advisory_date)`. When should this cached advice be regenerated? → A: Regenerate when a new forecast is fetched for a date that already has cached advice. In practice this means: same-day repeat visits use the cached row; when the farmer returns on a new calendar day, the fresh forecast triggers new advice. Crop or growth-stage changes within the same day do not force regeneration unless the forecast itself is re-fetched.
- Q: The weather advisor agent's `get_forecast` tool should return how much forecast data? → A: The full 7-day forecast, including each day's aggregated weather and the AI-generated advice text, so the agent can answer forecast-aware questions without additional round-trips.
- Q: How should OpenWeatherMap API rate limits be handled for multiple farms? → A: Apply per-IP rate limiting on the weather API routes, and block repeated requests from the same device/account within the rate-limit window. Cached forecasts reduce unnecessary upstream calls.
- Q: What should the system do when the OpenWeatherMap API key is missing or invalid? → A: Show an explicit error message on the weather page. Do not serve sample or demo weather data; the farmer sees the error and the last cached advisory remains available from history.
- Q: Should the weather advisor agent's `get_forecast` tool use cached forecast data or always make a fresh API call? → A: Always make a fresh API call so the agent provides the latest forecast data.
- Q: How should the advisory history tab paginate past advisories? → A: Use a Load more button. The initial view shows the most recent advisories, and the farmer can load older entries on demand.
- Q: What is the cadence for alert notification emails? → A: Send one immediate email per alert as soon as it is detected. No daily digest; warnings and critical alerts both trigger an individual email.
- Q: What is the tab order on the main weather page? → A: Advisory (today's advice) → Forecast (7-day view) → History (past advisories). This order matches the farmer's natural reading flow: act now, plan ahead, then review.
- Q: When the farmer has no registered farms, what should the weather page show? → A: Show an inline register-farm form on the weather page itself. This is the recommended pattern: the farmer is already on the weather page, so capturing farm details inline reduces friction compared to navigating away. The form collects crop type, sowing date, farm name, area size, location, soil type, and irrigation method per FR-001.
- Q: Where should the farm selector be placed on the weather page? → A: At the top of the page, above the advisory content, so the farmer can switch farms before viewing the advisory.
- Q: Where should current weather conditions (temperature, humidity, condition) be displayed? → A: On the weather page only, not on the dashboard. The weather page is the single source of truth for weather data.
- Q: Where should the alert banner be displayed? → A: On both the dashboard and the weather page, so the farmer sees alerts in both contexts.
- Q: How should the advisory history detail view be presented? → A: As a modal popup triggered from the history tab, so the farmer can review details without losing their place in the history list.
- Q: What is the desktop layout for the weather page? → A: Two-column layout on desktop: advisory and alerts on the left, forecast on the right. On mobile, collapse to a single column.
- Q: Should farm switching on the weather page trigger a full page reload or client-side switching? → A: Client-side switching. The farmer selects a different farm from the dropdown and the advisory updates without a full page reload.
- Q: Should the weather page tabs use client-side tabs or separate routes? → A: Client-side tabs. Advisory, Forecast, and History are views within the same page, switched by client state without navigation.
- Q: When a farmer dismisses an alert, should it be permanently hidden, session-only, or just marked as read? → A: Permanently dismissed for that farm and alert type within the 6-hour deduplication window. Dismissed alerts do not reappear until a new alert of the same type is generated.
- Q: Should the history tab include filters for severity, date range, or farm? → A: Yes. The history tab includes filters for severity and farm, and supports pagination with a Load more button.
- Q: Should the weather page include a manual refresh button? → A: Yes. A Refresh button is available on the weather page to manually re-fetch the latest forecast and regenerate advice.
- Q: How is the selected farm persisted across navigation and refreshes? → A: The selected farm ID is stored in the URL query parameter (`?farm=<id>`). On page load, the URL param is respected; if missing, the most recently active farm is selected.
- Q: What is the default sort order for the history tab? → A: Newest first. The history tab shows the most recent advisories at the top, with older entries loaded via the Load more button.
- Q: Should the alert banner appear on the dashboard as well as the weather page? → A: Yes. The alert banner is shown on both the dashboard and the weather page so the farmer sees alerts in both contexts.
- Q: Should the weather page use dynamic SEO metadata based on farm and location? → A: Yes. The page title and description include the farm name and location when available, falling back to generic weather advisory text when no farm is selected.
- Q: What should the weather page show when the farmer is offline? → A: Show cached forecast and advisory data with an offline indicator. The last saved advisory remains visible, and the farmer can still interact with the history tab.
- Q: Should the alert banner include a dismiss button, and should dismiss state sync between dashboard and weather page? → A: No dismiss button on the alert banner. Alerts transition only between unread and read states. Read state is synced across dashboard and weather page.
- Q: What is the default filter state when the farmer opens the history tab? → A: No filter is applied by default. All advisories for the selected farm are shown, sorted newest first, with optional severity and farm filters available.
- Q: What is the loading behavior for the weather page on initial load? → A: Stale-while-revalidate: show cached data immediately if available, then refresh in the background. If no cached data exists, show a loading state until the forecast is fetched.
- Q: Should the dashboard include a farm selector? → A: Yes. The dashboard includes a farm selector so the farmer can switch context without navigating to the weather page.
- Q: In what language should AI-generated advice text be written? → A: In the farmer's selected locale, with English as the fallback if the locale is unsupported or the LLM output cannot be localized.
- Q: How is the farm selector state managed on the dashboard? → A: The dashboard farm selector also uses the URL query parameter (`?farm=<id>`) for consistency with the weather page.
- Q: How are history tab filters persisted? → A: Filters are persisted in the URL query parameters so they are shareable and survive page reloads.
- Q: Which tab is active by default when the farmer opens the weather page? → A: The Advisory tab is active by default, showing today's advice first.
- Q: Should the dashboard and weather page show the same alerts or different sets? → A: The same alerts are shown on both pages. Read/unread state is synced across both views.
- Q: What happens when the farmer presses the Refresh button on the weather page? → A: The button fetches fresh forecast data and regenerates advice, but does not clear the existing cache. Cached data for other dates remains intact.

## Assumptions

- Weather forecast data is sourced from OpenWeatherMap API with reasonable accuracy for at least 3 days ahead.
- Weather forecast data is available for the farmer's location with reasonable accuracy for at least 3 days ahead.
- Farmer's crop type and sowing date are the minimum inputs needed to generate useful advice.
- The farmer has access to a smartphone or computer with internet connectivity to receive advisories and alerts.
- Advisory language follows the project's language priority policy (English first, then Urdu, Punjabi, and other local languages).
- The `translations` table is the single source of truth for all user-facing strings at runtime; build-time catalogs serve only as fallback.

---

## Out of Scope

- Voice input or voice output for advisory interaction
- Offline advisory generation (requires online weather data)
- Direct integration with irrigation hardware or automated farm equipment
- Social sharing of advisories
- Push notifications beyond critical weather alerts
- Advisory for crops not registered by the farmer
- Historical weather data analysis beyond advisory history
