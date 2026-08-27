# Farm Records — Spec

> Full CRUD for farms and field records, scoped to the logged-in farmer, with hard server-side authorization. Supersedes the UI-only demo state in `app/(farmer)/(dashboard)/farms/` and `app/(farmer)/(dashboard)/records/`.

## Goal

Give every farmer a structured digital memory of each farm — crops, growth stage, and every irrigation, spray, treatment, or harvest event in one timeline — so the AI advisor can give personalised recommendations and no field history is ever lost. Every data API is gated by a valid session JWT issued by this app after successful login; forged, expired, missing, or wrong-type tokens never reach the database. Farms and records are scoped to a season/year so a single farm can track multiple growing seasons (Rabi/Kharif).

## User scenarios

1. **Logged-in farmer opens `/farms`** → sees their farms as cards (name, location, crops, stage, health, acres, season/year). If none yet, a welcome empty state with "Add your first farm" CTA.
2. **Farmer adds a farm** → fills name, village/location, district, season/year, one or more crops, acres → saved → appears in their list. Growth stage starts at "Sowing" for each crop.
3. **Farmer taps a farm card** → farm detail: season position tracker per crop (auto-advanced from records), farm info, recent field activity, and actions to log an event or view all records.
4. **Farmer logs a field event** → picks type (irrigation/fertilizer/pesticide/disease/harvest), the farm, season/year, date (past/present/future), title, note → saved → appears in that farm's timeline.
5. **Farmer views full records log** → `/farms/[id]/records` shows every entry in reverse chronological order by event date (then created_at) with type icon, date, title, and note.
6. **Farmer edits a record** → opens edit form, changes fields, saves → timeline updates. Only their own records are editable.
7. **Farmer deletes a record** → confirms deletion → record removed from timeline. Farm stays.
8. **Farmer tries to delete a farm with records** → blocked with message explaining records must be deleted first.
9. **Unauthenticated visitor hits any farms/records API** → server returns 401 with uniform error shape. Request never reaches the database.
10. **Farmer A directly requests Farmer B's farm or record** → server validates session + ownership → returns 404. Never reveals the farm/record exists.

## Functional requirements

### Farm CRUD

- **FR1 Create farm.** Fields: name (required, non-empty), village/location (required), district (dropdown), season/year (required), crops (one or more from fixed list: Wheat/Cotton/Sugarcane/Maize/Rice), acres (required, >0). `account_id` from session attached server-side. Zod validation on body.
- **FR2 List my farms.** Returns only farms where `account_id = session.account_id`. Sorted by `created_at DESC`. Each card shows: name, location, season/year, crops (comma-separated), growth stage per crop, health indicator, acres. Empty state when zero farms.
- **FR3 Farm detail.** Shows: farm info, season/year, season position tracker per crop (auto-calculated per crop from record dates — see FR8), recent 5 records, "Log a field event" button, "View all records" link.
- **FR4 Update farm.** Editable: name, village/location, district, season/year, crops, acres, growth stage per crop (manual override allowed). `account_id` cannot change. Zod validation.
- **FR5 Delete/archive farm.** Archive option hides the farm from the farmer's list but preserves all records. If farmer chooses hard delete, blocked if any records exist for that farm. Returns clear message: "Delete all records first." If zero records, farm is deleted.

### Record CRUD

- **FR6 Create record.** Fields: farm (dropdown of own farms, required), type (fixed 5: irrigation/fertilizer/pesticide/disease/harvest), season/year (required), date (required, ISO date, future allowed), title (optional, non-empty if provided), note (optional), yield quantity (optional, number, for harvest type only), labor cost (optional, number, for harvest type only), transport cost (optional, number, for harvest type only). `farm_id` + `account_id` attached server-side. Zod validation.
- **FR7 List records for a farm.** Returns all records for the given farm where farm belongs to session owner. Primary sort by `event_date DESC`, secondary by `created_at DESC`. Timeline format with type icon, date, title, note. Empty state when zero records.
- **FR8 Edit record.** Same fields as create. Only the original creator (farm owner) can edit. `farm_id`, `season/year`, and `created_at` cannot change.
- **FR9 Delete record.** Hard delete. Only farm owner can delete. Confirmation required in UI.

### Security & Authorization (hard requirement)

- **FR10 API gate.** Every farm/record route handler validates session on the first line: httpOnly cookie → JWT → signature verify (jose) → type `session` → expiry check → `account_id` lookup in `sessions` table (not revoked). Any failure → immediate `{ error: { code, message } }` with proper HTTP status. Request never reaches database queries.
- **FR11 Ownership enforcement.** After session validation, every query scopes to `account_id`. Farm queries: `WHERE account_id = X`. Record queries: join through farm ownership. Another farmer's farm/record → 404 response. Never reveals existence.
- **FR12 Token integrity.** Session token is app's own JWT (jose-signed). Forged or external service tokens rejected at signature check. Server UTC time used for expiry; client clock never trusted.
- **FR13 Uniform error shape.** Every auth/authorization failure returns `{ error: { code: string, message: string } }`. No ad-hoc formats. No info about which check failed.
- **FR14 Logout.** `/api/auth/logout` revokes session. Subsequent farms/records API calls return 401.

### Growth Stage (auto-calculated)

- **FR15 Stage tracks per crop.** Each crop has a fixed stage sequence stored as a JSONB map on the farm record. The UI displays the current stage for each crop:
  - Wheat: Sowing → Tillering → Vegetative → Grain filling → Ready
  - Cotton: Sowing → Squaring → Flowering → Boll filling → Ready
  - Sugarcane: Sowing → Tillering → Grand growth → Ripening → Harvest
  - Maize: Sowing → Vegetative → Tasselling → Grain filling → Ready
  - Rice: Sowing → Tillering → Panicle initiation → Grain filling → Ready
- **FR16 Auto-advance from records.** Explicit mapping: record type "sowing" or "planting" → advances that crop to stage 1. Record type "harvest" → advances that crop to final stage. Other record types do not auto-advance. Manual override allowed via FR4 edit.
- **FR17 Unknown crop fallback.** If crop not in track list, default to wheat stages or generic stages.
- **FR18 Archive farm.** Farmer can archive a farm, which hides it from `/farms` list but preserves all records. Archived farms can be restored or permanently deleted.

### Validation

- **FR19 Zod on every input.** All route handlers validate request body and query params with Zod before any DB operation.
- **FR20 Date rules.** Record date: any valid ISO date allowed (past, present, future). Server rejects malformed dates.
- **FR21 Acres rule.** Must be positive number. Zero or negative rejected.
- **FR22 Crops rule.** At least one crop required on farm creation. Duplicates ignored.
- **FR23 Truncation.** Farm name >2 lines → ellipsis + `title` attribute. Record title >2 lines → same. Notes clamp visually; full text accessible.
- **FR24 Harvest fields.** When record type is "harvest", yield quantity (mounds/bags), labor cost, and transport cost are accepted. All are optional but validated as non-negative numbers when provided.

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
- Season/year uniqueness: same farm can have multiple records across different seasons; season/year is required on both farm and record.
- Per-crop stage: each crop on a farm tracks its own stage independently; UI shows stage chip per crop on farm card and detail.

## Out of scope

- Farm sharing or collaboration between farmers
- Photo/voice attachments on records
- Offline/PWA sync
- Soil health data, GPS boundaries, satellite field maps
- Admin bulk farm or record management
- Record search, filter, or advanced queries beyond chronological list
- Farm transfer or ownership change
- Dark mode, RTL, multi-language translations
- SMS/WhatsApp alerts for farm events

## Acceptance criteria

- [ ] Create farm with valid data → saved with `account_id` + `season/year`, appears in owner's list only
- [ ] Invalid farm input → Zod 422 with field errors, nothing saved
- [ ] `/farms` lists only logged-in farmer's farms; empty state renders when zero farms
- [ ] Farm detail shows correct info + per-crop season tracker + recent records
- [ ] Create record with valid data → saved, appears in farm's timeline
- [ ] Records log shows all records for that farm sorted by `event_date DESC`, then `created_at DESC`
- [ ] Edit record → changes persist, only owner can edit
- [ ] Delete record → removed from timeline after confirmation
- [ ] Archive farm → hidden from list but records preserved; hard delete blocked if records exist
- [ ] **No valid session → ALL farms/records APIs return 401; request never reaches database**
- [ ] **Forged/expired/wrong-type JWT → rejected at signature/type/expiry check; uniform error shape**
- [ ] Farmer A directly accessing Farmer B's farm or record → 404 (never reveals existence)
- [ ] Logout kills session; subsequent API calls return 401
- [ ] Future-dated records allowed and visible in timeline
- [ ] Multiple crops per farm stored and displayed correctly with per-crop stage chips
- [ ] Growth stage auto-advances based on explicit record type mapping: "sowing"/"planting" → stage 1, "harvest" → final stage
- [ ] Harvest records accept optional yield quantity, labor cost, and transport cost
- [ ] Farm edit/delete UI is implemented and accessible from farm detail page
- [ ] All colors from `--color-agro-*` tokens only; no inline hex
- [ ] `npm run lint` and `npm run build` pass
