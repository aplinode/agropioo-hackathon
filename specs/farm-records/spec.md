# Farm Records — Spec

> Full CRUD for farms and field records, scoped to the logged-in farmer, with hard server-side authorization. Supersedes the UI-only demo state in `app/(farmer)/(dashboard)/farms/` and `app/(farmer)/(dashboard)/records/`.

## Goal

Give every farmer a structured digital memory of each farm — crops, growth stage, and every irrigation, spray, treatment, or harvest event in one timeline — so the AI advisor can give personalised recommendations and no field history is ever lost. Every data API is gated by a valid session JWT issued by this app after successful login; forged, expired, missing, or wrong-type tokens never reach the database.

## User scenarios

1. **Logged-in farmer opens `/farms`** → sees their farms as cards (name, location, crops, stage, health, acres). If none yet, a welcome empty state with "Add your first farm" CTA.
2. **Farmer adds a farm** → fills name, village/location, district, one or more crops, acres → saved → appears in their list. Growth stage starts at "Sowing".
3. **Farmer taps a farm card** → farm detail: season position tracker (auto-advanced from records), farm info, recent field activity, and actions to log an event or view all records.
4. **Farmer logs a field event** → picks type (irrigation/fertilizer/pesticide/disease/harvest), the farm, date (past/present/future), title, note → saved → appears in that farm's timeline.
5. **Farmer views full records log** → `/farms/[id]/records` shows every entry in reverse chronological order with type icon, date, title, and note.
6. **Farmer edits a record** → opens edit form, changes fields, saves → timeline updates. Only their own records are editable.
7. **Farmer deletes a record** → confirms deletion → record removed from timeline. Farm stays.
8. **Farmer tries to delete a farm with records** → blocked with message explaining records must be deleted first.
9. **Unauthenticated visitor hits any farms/records API** → server returns 401 with uniform error shape. Request never reaches the database.
10. **Farmer A directly requests Farmer B's farm or record** → server validates session + ownership → returns 404. Never reveals the farm/record exists.

## Functional requirements

### Farm CRUD

- **FR1 Create farm.** Fields: name (required, non-empty), village/location (required), district (dropdown), crops (one or more from fixed list: Wheat/Cotton/Sugarcane/Maize/Rice), acres (required, >0). `account_id` from session attached server-side. Zod validation on body.
- **FR2 List my farms.** Returns only farms where `account_id = session.account_id`. Sorted by `created_at DESC`. Each card shows: name, location, crops (comma-separated), growth stage, health indicator, acres. Empty state when zero farms.
- **FR3 Farm detail.** Shows: farm info, season position tracker (auto-calculated per crop from record dates — see FR8), recent 5 records, "Log a field event" button, "View all records" link.
- **FR4 Update farm.** Editable: name, village/location, district, crops, acres, growth stage (manual override allowed). `account_id` cannot change. Zod validation.
- **FR5 Delete farm.** Blocked if any records exist for that farm. Returns clear message: "Delete all records first." If zero records, farm is deleted.

### Record CRUD

- **FR6 Create record.** Fields: farm (dropdown of own farms, required), type (fixed 5: irrigation/fertilizer/pesticide/disease/harvest), date (required, ISO date, future allowed), title (optional, non-empty if provided), note (optional). `farm_id` + `account_id` attached server-side. Zod validation.
- **FR7 List records for a farm.** Returns all records for the given farm where farm belongs to session owner. Reverse chronological by `created_at DESC`. Timeline format with type icon, date, title, note. Empty state when zero records.
- **FR8 Edit record.** Same fields as create. Only the original creator (farm owner) can edit. `farm_id` and `created_at` cannot change.
- **FR9 Delete record.** Hard delete. Only farm owner can delete. Confirmation required in UI.

### Security & Authorization (hard requirement)

- **FR10 API gate.** Every farm/record route handler validates session on the first line: httpOnly cookie → JWT → signature verify (jose) → type `session` → expiry check → `account_id` lookup in `sessions` table (not revoked). Any failure → immediate `{ error: { code, message } }` with proper HTTP status. Request never reaches database queries.
- **FR11 Ownership enforcement.** After session validation, every query scopes to `account_id`. Farm queries: `WHERE account_id = X`. Record queries: join through farm ownership. Another farmer's farm/record → 404 response. Never reveals existence.
- **FR12 Token integrity.** Session token is app's own JWT (jose-signed). Forged or external service tokens rejected at signature check. Server UTC time used for expiry; client clock never trusted.
- **FR13 Uniform error shape.** Every auth/authorization failure returns `{ error: { code: string, message: string } }`. No ad-hoc formats. No info about which check failed.
- **FR14 Logout.** `/api/auth/logout` revokes session. Subsequent farms/records API calls return 401.

### Growth Stage (auto-calculated)

- **FR15 Stage tracks per crop.** Each crop has a fixed stage sequence:
  - Wheat: Sowing → Tillering → Vegetative → Grain filling → Ready
  - Cotton: Sowing → Squaring → Flowering → Boll filling → Ready
  - Sugarcane: Sowing → Tillering → Grand growth → Ripening → Harvest
  - Maize: Sowing → Vegetative → Tasselling → Grain filling → Ready
  - Rice: Sowing → Tillering → Panicle initiation → Grain filling → Ready
- **FR16 Auto-advance from records.** When a farmer logs a record marking sowing/planting, stage advances to step 1. When they log harvest, stage advances to final step. Manual override allowed via FR4 edit.
- **FR17 Unknown crop fallback.** If crop not in track list, default to wheat stages or generic stages.

### Validation

- **FR18 Zod on every input.** All route handlers validate request body and query params with Zod before any DB operation.
- **FR19 Date rules.** Record date: any valid ISO date allowed (past, present, future). Server rejects malformed dates.
- **FR20 Acres rule.** Must be positive number. Zero or negative rejected.
- **FR21 Crops rule.** At least one crop required on farm creation. Duplicates ignored.
- **FR22 Truncation.** Farm name >2 lines → ellipsis + `title` attribute. Record title >2 lines → same. Notes clamp visually; full text accessible.

## Edge cases & rules

- No farms yet: `/farms` renders welcome empty state with primary CTA and setup checklist.
- Farm with zero records: `/farms/[id]/records` renders empty state with "Log a field event" button.
- Concurrent farm creation: multiple tabs save simultaneously → all succeed (no unique constraint on farm name per account).
- Concurrent record creation: same farm, simultaneous saves → all succeed, ordered by `created_at`.
- Stale session: form open, session expires → submit returns 401 → UI redirects to `/login`.
- Stale tab: farm detail open, farm deleted elsewhere → 404 on next interaction.
- Delete farm with records: blocked with clear message; farmer must delete records first.
- Future-dated records: allowed and visible in timeline; sorted by `created_at` (creation time), not event date.
- Very long notes: visually clamped, full text available on expand or detail view.
- Crop name not in track list: falls back to default wheat stage sequence.
- Session revoked mid-session: next API call returns 401 → redirect to `/login`.
- Duplicate farm names: allowed (farmer may have multiple farms with similar names).

## Out of scope

- Edit/delete UI for farms (only records have edit/delete)
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

- [ ] Create farm with valid data → saved with `account_id`, appears in owner's list only
- [ ] Invalid farm input → Zod 422 with field errors, nothing saved
- [ ] `/farms` lists only logged-in farmer's farms; empty state renders when zero farms
- [ ] Farm detail shows correct info + auto-calculated season tracker + recent records
- [ ] Create record with valid data → saved, appears in farm's timeline
- [ ] Records log shows all records for that farm in reverse chronological order
- [ ] Edit record → changes persist, only owner can edit
- [ ] Delete record → removed from timeline after confirmation
- [ ] Delete farm with existing records → blocked with message; delete farm with zero records → succeeds
- [ ] **No valid session → ALL farms/records APIs return 401; request never reaches database**
- [ ] **Forged/expired/wrong-type JWT → rejected at signature/type/expiry check; uniform error shape**
- [ ] Farmer A directly accessing Farmer B's farm or record → 404 (never reveals existence)
- [ ] Logout kills session; subsequent API calls return 401
- [ ] Future-dated records allowed and visible in timeline
- [ ] Multiple crops per farm stored and displayed correctly
- [ ] Growth stage auto-advances based on record type and crop track
- [ ] All colors from `--color-agro-*` tokens only; no inline hex
- [ ] `npm run lint` and `npm run build` pass
