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

- **FR-001**: System must accept and store the farmer's crop type, sowing date, farm location, farm name, area size, soil type, and irrigation method.
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
