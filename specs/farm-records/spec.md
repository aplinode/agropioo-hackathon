# Farm Records — Spec

> Full CRUD for farms and field records, scoped to the logged-in farmer, with hard server-side authorization. Supersedes the UI-only demo state in `app/(farmer)/(dashboard)/farms/` and `app/(farmer)/(dashboard)/records/`.

## Goal

Give every farmer a structured digital memory of each farm — crops, growth stage, and every irrigation, spray, treatment, or harvest event in one timeline — so the AI advisor can give personalised recommendations and no field history is ever lost. Every data API is gated by a valid session JWT issued by this app after successful login; forged, expired, missing, or wrong-type tokens never reach the database. A farm represents land only; season/year lives on records so a single farm can track multiple growing seasons across Summer, Winter, Rainy, and Dry.

## User scenarios

1. **Logged-in farmer opens `/farms`** → sees their farms as cards (name, location, crops, stage chips per crop, health indicator, acres, season/year chips). If none yet, a welcome empty state with "Add your first farm" CTA.
2. **Farmer adds a farm** → fills name, village/location, district (searchable dropdown of all Pakistan districts), one or more crops, acres, and taps map to set location → saved → appears in their list. Growth stage starts at "Sowing" for each crop.
3. **Farmer taps a farm card** → farm detail: farm info, map showing saved location, per-crop season position tracker (auto-advanced from records), recent field activity, current weather snapshot, and actions to log an event or view all records.
4. **Farmer logs a field event** → picks type (sowing/planting/irrigation/fertilizer/pesticide/disease/harvest), the farm, season/year (dropdown: Summer/Winter/Rainy/Dry + year range), date (past/present/future), title, note, weather condition (auto-fetched from OpenWeatherMap with farmer override) → saved → appears in that farm's timeline. Harvest type also accepts yield quantity, labor cost, transport cost.
5. **Farmer views full records log** → `/farms/[id]/records` shows every entry in reverse chronological order by event date (then created_at) with type icon, date, title, note, and weather snapshot. Season/year filter dropdown at top defaults to "All seasons".
6. **Farmer edits a record** → opens edit form, changes fields, saves → timeline updates. Only their own records are editable. Farm, season/year, and created_at cannot change.
7. **Farmer deletes a record** → confirms deletion → record removed from timeline. Farm stays.
8. **Farmer tries to delete a farm with records** → blocked with message explaining records must be deleted first. Archive option available to hide farm without deleting records.
9. **Unauthenticated visitor hits any farms/records API** → server returns 401 with uniform error shape. Request never reaches the database.
10. **Farmer A directly requests Farmer B's farm or record** → server validates session + ownership → returns 404. Never reveals the farm/record exists.
11. **Farmer views farm detail** → sees current weather for the farm location (cached from OpenWeatherMap), auto-refreshed on each visit.

## Functional requirements

### Farm CRUD

- **FR1 Create farm.** Fields: name (required, non-empty), village/location (required), district (searchable dropdown of all Pakistan districts), crops (one or more from fixed list: Wheat/Cotton/Sugarcane/Maize/Rice), acres (required, >0). Location set via embedded Leaflet map (OpenStreetMap, no API key). `account_id` from session attached server-side. Zod validation on body. No season/year field — season lives on records.
- **FR2 List my farms.** Returns only farms where `account_id = session.account_id` and `archived_at IS NULL`. Sorted by `created_at DESC`. Each card shows: name, location, crops (comma-separated), growth stage chip per crop, health indicator, acres, season/year chips (all unique seasons from that farm's records). Empty state when zero farms.
- **FR3 Farm detail.** Shows: farm info, embedded Leaflet map with saved location pin, per-crop season position tracker (auto-calculated per crop from record dates — see FR15), current weather snapshot (from OpenWeatherMap, cached), recent 5 records (paginated), "Log a field event" button, "View all records" link. All records visible by default with season/year filter dropdown.
- **FR4 Update farm.** Editable: name, village/location, district, crops, acres, growth stage per crop (manual override allowed — see FR16). Location can be updated via map. `account_id` cannot change. Zod validation.
- **FR5 Archive/delete farm.** Archive option sets `archived_at` timestamp, hiding the farm from `/farms` list but preserving all records. Archived farms can be restored. Hard delete blocked if any records exist for that farm. Returns clear message: "Delete all records first." If zero records, farm is hard-deleted.

### Record CRUD

- **FR6 Create record.** Fields: farm (dropdown of own non-archived farms, required), type (fixed 7: sowing/planting/irrigation/fertilizer/pesticide/disease/harvest), season (dropdown: Summer/Winter/Rainy/Dry), year (dropdown: current year ± 10 years, format "2024-25"), date (required, ISO date, future allowed), title (optional, non-empty if provided), note (optional), weather condition (auto-fetched from OpenWeatherMap based on farm location and record date; farmer can override from dropdown: Sunny/Cloudy/Rainy/Stormy/Snowy/Fog), yield quantity (optional, number, for harvest type only), labor cost (optional, number, for harvest type only), transport cost (optional, number, for harvest type only). `farm_id` + `account_id` attached server-side. Zod validation. Weather snapshot stored as JSONB: `{ condition: string, temp_c: number, humidity: number, fetched_at: ISO timestamp }`.
- **FR7 List records for a farm.** Returns paginated records for the given farm where farm belongs to session owner and is not archived. Page size: 20. Cursor-based pagination using `created_at` + `id`. Primary sort by `event_date DESC`, secondary by `created_at DESC`. Timeline format with type icon, date, title, note, weather badge. Empty state when zero records. Season/year filter query params supported.
- **FR8 Edit record.** Same fields as create. Only the original creator (farm owner) can edit. `farm_id`, `season`, `year`, `event_date`, and `created_at` cannot change.
- **FR9 Delete record.** Hard delete. Only farm owner can delete. Confirmation required in UI. Record permanently removed; farm and other records unaffected.

### Security & Authorization (hard requirement)

- **FR10 API gate.** Every farm/record route handler validates session on the first line: httpOnly cookie → JWT → signature verify (jose) → type `session` → expiry check → `account_id` lookup in `sessions` table (not revoked). Any failure → immediate `{ error: { code, message } }` with proper HTTP status. Request never reaches database queries.
- **FR11 Ownership enforcement.** After session validation, every query scopes to `account_id`. Farm queries: `WHERE account_id = X AND archived_at IS NULL`. Record queries: join through farm ownership. Another farmer's farm/record → 404 response. Never reveals existence.
- **FR12 Token integrity.** Session token is app's own JWT (jose-signed). Forged or external service tokens rejected at signature check. Server UTC time used for expiry; client clock never trusted.
- **FR13 Uniform error shape.** Every auth/authorization failure returns `{ error: { code: string, message: string } }`. No ad-hoc formats. No info about which check failed.
- **FR14 Logout.** `/api/auth/logout` revokes session. Subsequent farms/records API calls return 401.

### Growth Stage (auto-calculated)

- **FR15 Stage tracks per crop.** Each crop has a fixed stage sequence stored as a JSONB map on the farm record: `{ "wheat": "Sowing", "cotton": "Vegetative" }`. The UI displays the current stage for each crop:
  - Wheat: Sowing → Tillering → Vegetative → Grain filling → Ready
  - Cotton: Sowing → Squaring → Flowering → Boll filling → Ready
  - Sugarcane: Sowing → Tillering → Grand growth → Ripening → Harvest
  - Maize: Sowing → Vegetative → Tasselling → Grain filling → Ready
  - Rice: Sowing → Tillering → Panicle initiation → Grain filling → Ready
- **FR16 Auto-advance from records.** Explicit mapping: record type "sowing" or "planting" → advances that crop to stage index 1. Record type "harvest" → advances that crop to final stage. Other record types do not auto-advance. Auto-advance only applies when current stage is still at default ("Sowing"). Once farmer manually overrides a crop's stage via FR4, auto-advance stops for that crop permanently.
- **FR17 Unknown crop fallback.** If crop not in track list, default to wheat stage sequence.
- **FR18 Archive farm.** Farmer can archive a farm, which hides it from `/farms` list but preserves all records. Archived farms can be restored or permanently deleted. Archived farms excluded from all list queries by default.

### Weather Integration

- **FR19 Weather auto-fetch.** On record creation, server calls OpenWeatherMap API using farm's latitude/longitude and record date to fetch weather condition and temperature. API key stored server-side only in env vars. If API call fails, farmer can manually select condition from dropdown.
- **FR20 Weather snapshot.** Weather data stored on each record at creation time: `{ condition: string, temp_c: number, humidity: number, fetched_at: ISO timestamp }`. This snapshot is immutable after record creation.
- **FR21 Farm current weather.** Farm detail page shows current weather cached for the farm location. Fetched on page load, displayed as small weather badge. Does not affect record history.
- **FR22 Farmer override.** Farmer can override auto-fetched weather condition from dropdown (Sunny/Cloudy/Rainy/Stormy/Snowy/Fog) before saving record. Override stored as the condition value.

### Map Integration

- **FR23 Farm location map.** Farm creation and edit forms include an embedded Leaflet map (OpenStreetMap tiles, no API key required). Farmer taps map to drop a pin; latitude and longitude stored on farm record. Map shows saved pin on farm detail page.

### Validation

- **FR24 Zod on every input.** All route handlers validate request body and query params with Zod before any DB operation.
- **FR25 Date rules.** Record date: any valid ISO date allowed (past, present, future). Server rejects malformed dates.
- **FR26 Acres rule.** Must be positive number. Zero or negative rejected.
- **FR27 Crops rule.** At least one crop required on farm creation. Duplicates ignored.
- **FR28 Truncation.** Farm name >2 lines → ellipsis + `title` attribute. Record title >2 lines → same. Notes clamp visually; full text accessible on expand.
- **FR29 Harvest fields.** When record type is "harvest", yield quantity (mounds/bags), labor cost, and transport cost are accepted. All are optional but validated as non-negative numbers when provided. If record type is changed away from harvest, these values persist in the record with a visual badge indicating they belong to a previous harvest entry.
- **FR30 Season/year validation.** Season must be one of: Summer, Winter, Rainy, Dry. Year must be a valid year range format (e.g., "2024-25"). Record season/year is independent of any farm-level season.
- **FR31 Pagination.** Record lists use cursor-based pagination with page size of 20. Cursor is `created_at` + `id` of the last record on the current page.

### Health Indicator

- **FR32 Health auto-computation.** Farm health indicator is computed server-side from record frequency and crop stage logic. Factors: days since last irrigation/spray/harvest per crop, current stage vs expected stage for season, record completeness. Displayed as a color-coded chip: Good (green), Fair (yellow), Needs attention (red).

## Edge cases & rules

- No farms yet: `/farms` renders welcome empty state with primary CTA and setup checklist.
- Farm with zero records: `/farms/[id]/records` renders empty state with "Log a field event" button.
- Concurrent farm creation: multiple tabs save simultaneously → all succeed (no unique constraint on farm name per account).
- Concurrent record creation: same farm, simultaneous saves → all succeed, ordered by `event_date DESC`, then `created_at DESC`.
- Stale session: form open, session expires → submit returns 401 → UI redirects to `/login`.
- Stale tab: farm detail open, farm deleted elsewhere → 404 on next interaction.
- Delete farm with records: blocked with clear message; farmer must delete records first. Archive option available to hide farm without deleting records.
- Future-dated records: allowed and visible in timeline; sorted by `event_date DESC`, then `created_at DESC`.
- Very long notes: visually clamped, full text available on expand or detail view.
- Crop name not in track list: falls back to default wheat stage sequence.
- Session revoked mid-session: next API call returns 401 → redirect to `/login`.
- Duplicate farm names: allowed (farmer may have multiple farms with similar names).
- Season/year per record: each record carries its own season/year; same farm can have records across Summer, Winter, Rainy, Dry in different years.
- Per-crop stage: each crop on a farm tracks its own stage independently; UI shows stage chip per crop on farm card and detail. Manual override stops auto-advance for that crop.
- Weather API failure: record creation does not fail if OpenWeatherMap is unreachable; farmer sees warning and must manually select weather condition.
- Archived farms: excluded from `/farms` list by default; can be restored or permanently deleted. Records preserved through archive/restore cycle.

## UI Requirements

### Brand Colors

All UI colors MUST come from `--color-agro-*` CSS tokens defined in the project's theme. Never use inline hex values. Missing colors must be added to `@theme` in the global CSS before use.

- Primary actions: `--agro-green` (harvest-gold conversion moments use `--agro-wheat` with dark forest text for contrast)
- Text: dark forest on light backgrounds; ensure ≥ 4.5:1 contrast ratio for body text
- Health chips: Good = `--agro-green`, Fair = `--agro-wheat`, Needs attention = `--agro-red`
- Stage chips: `--agro-green` background with white text
- Record type icons: use shared SVG set from `components/icons.tsx`

### Typography

- Headings: Playfair Display, one to two display moments per page max, roman, sentence case
- Body: DM Sans
- Data/monospace: IBM Plex Mono or JetBrains Mono
- All text at minimum 16px for outdoor-mobile readability

### Layout & Accessibility

- Touch targets ≥ 44×44px
- Visible focus rings, never animated in
- `prefers-reduced-motion` respected
- No horizontal scroll at 320px viewport
- Light mode only; `--agro-night` reserved for future dark mode
- Farm cards responsive: single column on mobile, 2–3 columns on desktop

### Map UI

- Embedded Leaflet map in farm form: 300px height on mobile, 400px on desktop
- Tap-to-pin interaction; pin draggable for fine adjustment
- Map shows Pakistan by default; zoom to selected location
- OpenStreetMap tile layer; no API key or attribution removal

### Weather UI

- Current weather badge on farm detail: small inline chip with icon, temp, condition
- Weather on record timeline: small badge next to date showing condition at time of record
- Weather override dropdown: visible only during record creation/edit; hidden after save

## Out of scope

- Farm sharing or collaboration between farmers
- Photo/voice attachments on records
- Offline/PWA sync
- Soil health data, GPS boundaries, satellite field maps
- Admin bulk farm or record management
- Record search, filter, or advanced queries beyond chronological list + season/year filter
- Farm transfer or ownership change
- Dark mode, RTL, multi-language translations
- SMS/WhatsApp alerts for farm events
- Weather forecast beyond current conditions

## Acceptance criteria

- [ ] Create farm with valid data → saved with `account_id` + location, appears in owner's list only
- [ ] Invalid farm input → Zod 422 with field errors, nothing saved
- [ ] `/farms` lists only logged-in farmer's non-archived farms; empty state renders when zero farms
- [ ] Farm detail shows correct info + per-crop stage chips + recent records + current weather + map
- [ ] Create record with valid data → saved with weather snapshot, appears in farm's timeline
- [ ] Records log paginated at 20/page; sorted by `event_date DESC`, then `created_at DESC`
- [ ] Edit record → changes persist, only owner can edit
- [ ] Delete record → removed from timeline after confirmation
- [ ] Archive farm → hidden from list but records preserved; hard delete blocked if records exist
- [ ] **No valid session → ALL farms/records APIs return 401; request never reaches database**
- [ ] **Forged/expired/wrong-type JWT → rejected at signature/type/expiry check; uniform error shape**
- [ ] Farmer A directly accessing Farmer B's farm or record → 404 (never reveals existence)
- [ ] Logout kills session; subsequent API calls return 401
- [ ] Future-dated records allowed and visible in timeline
- [ ] Multiple crops per farm stored and displayed correctly with per-crop stage chips
- [ ] Growth stage auto-advances based on explicit record type mapping: "sowing"/"planting" → stage 1, "harvest" → final stage; manual override stops auto-advance
- [ ] Harvest records accept optional yield quantity, labor cost, and transport cost; values persist with badge if type changes
- [ ] Farm edit/delete UI is implemented and accessible from farm detail page
- [ ] All colors from `--color-agro-*` tokens only; no inline hex
- [ ] Farm card shows all seasons as chips pulled from records
- [ ] Farm detail shows all records by default with season/year filter dropdown
- [ ] District dropdown includes all Pakistan districts with search
- [ ] Farm creation/edit includes embedded Leaflet map for location
- [ ] Weather auto-fetched from OpenWeatherMap; farmer can override; snapshot stored on record
- [ ] Farm detail shows current weather badge
- [ ] `npm run lint` and `npm run build` pass
