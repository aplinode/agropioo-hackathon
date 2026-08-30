# Satellite Monitoring — Spec

> `/satellite` — satellite-based field health monitoring for Pakistani farmers. Farmer registers a field boundary once; the system automatically fetches Sentinel-2 imagery, computes NDVI, and displays a color-coded health heatmap with a 12-week history strip.

---

## 1. Goal

Give every farmer a precise, up-to-date picture of crop health across their entire field — without drones, physical inspection, or specialist equipment. The farmer draws their field boundary once; from that point the system handles everything: it finds the most recent clear Sentinel-2 satellite pass over the field (free, 10 m resolution via Copernicus Data Space), computes NDVI, and paints the result as a color-coded heatmap directly on the map. A 12-week history strip lets the farmer scroll back in time to confirm that a fertiliser application improved health, track recovery after flooding, or spot a stress pattern before it becomes crop loss. The feature is designed for mid-range Android phones on intermittent 4G — the map and boundary load instantly; satellite imagery loads asynchronously behind a visible skeleton.

---

## 2. User Scenarios

| # | When the farmer… | They get… |
|---|---|---|
| S1 | Opens `/satellite` with no farms | An empty state explaining the feature with a "Add your first farm" button — the map does not render. |
| S2 | Opens `/satellite` with farms but no saved boundary | A farm selector dropdown, the map centred on the selected farm's location, and a visible "Draw your field" prompt with a Draw button. |
| S3 | Taps "Draw Field" | The map enters polygon draw mode; a tooltip instructs them to tap corner points; the polygon closes when they tap the starting point or double-tap the last point. |
| S4 | Draws a polygon and taps "Save Field" | The boundary is saved, the draw mode closes, and an NDVI fetch begins automatically — a loading skeleton appears inside the field boundary area. |
| S5 | The NDVI fetch completes | The skeleton is replaced by a color-coded heatmap overlay inside the boundary; the stats card shows date, mean NDVI, and a plain-language health label; the history strip populates. |
| S6 | Returns to the same farm on a future visit | The boundary and the most recent *clear* NDVI snapshot load immediately (from cache); no satellite request is made. |
| S7 | Scrolls the history strip | They see up to 12 weekly snapshot cards — each shows a date label and a mean NDVI value (or a cloud icon when no clear imagery was available that week). Tapping a card switches the map overlay and stats to that week. |
| S8 | Taps a week that had cloud cover | A "No clear imagery this week" message replaces the overlay; the stats card shows the cloud icon and nearest clear date suggestion. |
| S9 | Taps "Edit Field" | The existing polygon becomes editable (vertex dragging); tapping "Save" commits the update and triggers a fresh NDVI fetch. |
| S10 | Taps "Delete Field" | A confirmation dialog appears; confirming removes the boundary and all its history; the map returns to the draw-mode empty state. |
| S11 | Has multiple farms | The farm selector lists all active farms; switching farms loads the boundary and history for that farm without a page reload. |
| S12 | The satellite fetch takes longer than 30 seconds | A "Taking longer than usual" message replaces the skeleton with a retry button; the rest of the page remains usable. |
| S13 | Draws a boundary in August (Kharif, high cloud cover) | After saving, if no clear imagery exists in the past 14 days, a "Satellite imagery expected within 5–10 days" message is shown instead of an error. |

---

## 3. Functional Requirements

### FR-1: Access and Navigation

**FR-1.1:** A farmer who is not authenticated and navigates to `/satellite` is redirected to the login page. The URL they tried to visit is not preserved.

**FR-1.2:** A `/satellite` entry is visible in the dashboard sidebar on desktop and in the bottom tab bar on mobile for every authenticated farmer. It uses the satellite icon from the shared icon set.

**FR-1.3:** The page loads the authenticated farmer's list of non-archived farms server-side before rendering. The farm list is never fetched client-side on initial load.

### FR-2: Farm Selector

**FR-2.1:** A dropdown at the top of the page lists every non-archived farm that belongs to the authenticated farmer, showing the farm name and district. Archived farms do not appear.

**FR-2.2:** When a farm is selected, the map moves to that farm's location. If the farm has a saved boundary, the boundary is drawn on the map and the most recent NDVI snapshot loads. If the farm has no boundary, the map centres on the farm's lat/lng and shows the draw prompt.

**FR-2.3:** When the authenticated farmer has no farms at all, the map is not rendered. An empty state is shown with a message explaining what the feature does and a button to add their first farm.

### FR-3: Field Boundary Drawing

**FR-3.1:** A "Draw Field" button is visible when the selected farm has no saved boundary. Tapping it activates polygon draw mode.

**FR-3.2:** In draw mode, the farmer taps corner points on the map to define the field boundary. The polygon closes when the farmer taps the first point again or double-taps the final point.

**FR-3.3:** A polygon with fewer than 3 distinct corner points cannot be saved. The "Save Field" button is disabled until a valid polygon is drawn.

**FR-3.4:** When a valid polygon is drawn, a "Save Field" button becomes tappable and a "Cancel" button discards the drawn polygon without saving.

**FR-3.5:** Tapping "Save Field" sends the polygon to the server. On success, draw mode closes and an NDVI fetch begins automatically. On failure, an inline error message is shown and the polygon remains on the map so the farmer can retry without redrawing.

**FR-3.6:** When the selected farm already has a saved boundary, the map shows the boundary and an "Edit Field" button (not "Draw Field"). Tapping "Edit Field" enters edit mode, where the farmer can drag vertices. "Save" commits the update; "Cancel" reverts to the saved polygon.

**FR-3.7:** A "Delete Field" button is visible whenever a saved boundary exists. Tapping it shows a confirmation dialog before any deletion occurs.

### FR-4: Boundary Validation

**FR-4.1:** The server rejects a boundary whose GeoJSON is not a valid Polygon type (i.e. not `{ "type": "Polygon", "coordinates": [[...]] }`).

**FR-4.2:** The server rejects a polygon whose outer ring has fewer than 4 coordinate pairs (GeoJSON requires the first and last pair to be identical; a triangle is therefore 4 pairs minimum).

**FR-4.3:** The server rejects a polygon whose bounding box exceeds 500 hectares. A farm that large is almost certainly an accidental drawing error; the error message instructs the farmer to redraw a smaller area.

**FR-4.4:** The server rejects a boundary submitted for a farm that does not belong to the authenticated farmer, returning a 403 response.

**FR-4.5:** A farm may have at most one active boundary at a time. Saving a new boundary for a farm that already has one replaces the existing boundary and deletes all its associated NDVI snapshots.

### FR-5: NDVI Imagery — What the Farmer Sees

**FR-5.1:** The NDVI heatmap is a color image overlaid on the map, clipped to the field boundary's bounding box. The color scale is: NDVI < 0 → dark (water or shadow); 0 to 0.2 → red (bare soil or severely stressed); 0.2 to 0.5 → yellow (moderate); above 0.5 → green (healthy vegetation). These thresholds and colors are fixed and do not change per-user.

**FR-5.2:** A color legend with labeled NDVI bands (0, 0.2, 0.5, 1.0) is always visible in the bottom-left corner of the map while a boundary is selected. It is visible on top of map tiles without obscuring the field.

**FR-5.3:** The NDVI overlay does not replace the satellite basemap tiles. Both are visible simultaneously — the overlay is semi-transparent so the underlying satellite imagery remains visible for orientation.

**FR-5.4:** Below the map, a stats card shows: the snapshot date in a human-readable format ("24 Aug 2026"), the mean NDVI for the field (shown as a decimal to 2 places), and a plain-language health label ("Healthy", "Moderate", or "Stressed") in a color that matches the NDVI scale. The health label is shown at a larger text size than the numeric NDVI value.

**FR-5.5:** The health label thresholds are: mean NDVI above 0.5 → "Healthy" (green); 0.2–0.5 → "Moderate" (amber); below 0.2 → "Stressed" (red). These thresholds apply to the overall field mean, not individual pixels.

**FR-5.6:** When the NDVI overlay is loading, a visible loading skeleton is shown inside the field boundary area on the map — not a full-page spinner. The map, boundary, and base tiles remain interactive during the load.

### FR-6: NDVI Imagery — Data Availability

**FR-6.1:** When a boundary is saved or updated, the system automatically searches for the most recent clear Sentinel-2 imagery in the past 14 days for that field. This search happens in the background; the farmer does not need to request it manually.

**FR-6.2:** A snapshot is considered "clear" when the cloud-covered fraction of the field polygon area is 30% or less. Snapshots above this threshold are stored with a cloud flag and are not shown as the active overlay.

**FR-6.3:** The default view always shows the most recent *clear* snapshot — not necessarily today's date. If the most recent clear snapshot is from 10 days ago, that is what the farmer sees, with its date displayed.

**FR-6.4:** If no clear snapshot exists for a field in the past 14 days after the first save, the farmer sees a message: "Satellite imagery expected within 5–10 days — we'll have a clearer picture after the next satellite pass." No error state. No empty map.

**FR-6.5:** Once a snapshot is fetched and stored, returning to the same farm on a future visit loads the stored image immediately. No new satellite request is made for a snapshot that already exists.

### FR-7: History Timeline

**FR-7.1:** The history strip shows up to 12 snapshot entries, one per week, for the past 12 weeks — ordered with the most recent on the left.

**FR-7.2:** Each entry shows: a small thumbnail of the NDVI heatmap (or a cloud icon when no clear image exists for that week), a date label (e.g. "Aug 24"), and the mean NDVI value (or "–" for cloudy weeks).

**FR-7.3:** The currently displayed snapshot is highlighted in the strip. Tapping a different entry switches the map overlay and the stats card to that week's data without reloading the page.

**FR-7.4:** Weeks that have no clear imagery are shown in the strip as cloud-icon cards — they are visible but tapping one shows the "no clear imagery this week" message instead of an overlay.

**FR-7.5:** A sparkline chart above the strip plots the mean NDVI value over the 12 weeks. Cloudy weeks appear as gaps in the line. The sparkline is decorative — it provides a visual trend but is not interactive.

**FR-7.6:** The history strip is populated after the map and boundary render. It does not delay the initial map display.

### FR-8: Error States

**FR-8.1:** If the satellite imagery service is unreachable or returns an error, the farmer sees: "Satellite data temporarily unavailable — your saved imagery is still visible." Cached snapshots continue to load and display normally.

**FR-8.2:** If an NDVI fetch takes longer than 30 seconds, the loading skeleton is replaced by: "Taking longer than usual. [Retry]" — the retry button triggers a fresh attempt. The rest of the page remains interactive.

**FR-8.3:** If a boundary save fails (server error), the drawn polygon remains on the map and an inline message tells the farmer the save failed and to try again. The polygon is not discarded.

**FR-8.4:** If a boundary deletion fails, the boundary remains visible, and an inline error message is shown. No silent failures.

### FR-9: Security and Authorisation

**FR-9.1:** Every API endpoint under `/api/satellite/` requires a valid session. Requests without a valid session return a 401 response with the standard error shape `{ error: { code, message } }`.

**FR-9.2:** A farmer can only read or modify boundaries and snapshots that belong to their own account. Attempting to access another farmer's boundary by guessing its ID returns a 403 response — not a 404 (which would reveal existence).

**FR-9.3:** Boundary IDs and snapshot IDs in API responses are UUIDs. Sequential integer IDs are not used.

### FR-10: Internationalisation

**FR-10.1:** Every visible string on the `/satellite` page — labels, buttons, messages, tooltips, empty states, error messages — has a translation key present in the Neon `translations` table for all 8 locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) before the feature is shipped.

**FR-10.2:** The language currently selected by the farmer applies to the satellite page without any additional language selection step.

---

## 4. Edge Cases & Rules

| # | Situation | Expected behaviour |
|---|---|---|
| E1 | Farmer has zero farms | Map does not render. Empty state with feature description and "Add your first farm" button. |
| E2 | Farm has no saved boundary | Map centres on farm lat/lng. Draw prompt and "Draw Field" button are visible. History strip is hidden. |
| E3 | Farmer submits a polygon with fewer than 3 distinct corner points | Server returns 400. Client shows inline error: "Please draw a larger boundary — tap at least 3 corner points." |
| E4 | Farmer submits a polygon larger than 500 ha | Server returns 400. Client shows inline error: "The drawn area is too large — please draw around a single field." |
| E5 | No clear Sentinel-2 imagery exists in the past 14 days (e.g. heavy Kharif cloud cover) | No error state. Message: "Satellite imagery expected within 5–10 days." The history strip shows cloud icons for affected weeks. |
| E6 | The current week's snapshot has cloud cover but a previous week is clear | The most recent *clear* snapshot is shown by default. A banner reads: "Showing imagery from [date] — more recent passes were cloudy." |
| E7 | All 12 history weeks have cloud cover | Strip shows 12 cloud icons. Sparkline is flat at the baseline. A hint: "Heavy cloud cover this season — imagery is clearest between November and April." |
| E8 | Copernicus API is unreachable | Cached snapshots still display. New fetch shows: "Satellite data temporarily unavailable." No crash. |
| E9 | NDVI fetch takes more than 30 seconds | Skeleton replaced by "Taking longer than usual. [Retry]" — page stays interactive. |
| E10 | Boundary save succeeds but Cloudinary upload fails | Snapshot is stored with `image_url = null` and retried on next visit. The farmer sees the cloud-cover fallback state, not a crash. |
| E11 | Farmer saves a new boundary for a farm that already has one | Old boundary and all its snapshots are deleted atomically before the new one is stored. The farmer is warned in the confirmation step: "This will replace your existing field boundary and clear its history." |
| E12 | Farmer draws boundary and immediately switches to a different farm | The in-progress drawing is discarded silently. No save attempt is made for the abandoned drawing. |
| E13 | Unauthenticated request to any `/api/satellite/*` route | Returns `{ error: { code: "unauthorized", message: "Unauthorized" } }` with status 401. |
| E14 | Farmer guesses another user's boundary UUID | Returns `{ error: { code: "forbidden", message: "Forbidden" } }` with status 403 — not 404. |
| E15 | The submitted GeoJSON is syntactically valid JSON but not a GeoJSON Polygon | Server returns 400 with: "Invalid field boundary — please redraw." |
| E16 | Boundary coordinates are outside Pakistan's geographic bounding box | Server returns 400 with: "Coordinates appear to be outside Pakistan. Please check your field location." |
| E17 | Farmer is on 2G connection | Map basemap and boundary load first. NDVI overlay loads asynchronously with a visible skeleton inside the field area. No full-page block. |
| E18 | Session expires while the farmer is on the satellite page | The next API call (e.g. save boundary, fetch NDVI) returns 401; the client redirects to `/login`. In-progress drawings are lost — no auto-save. |

---

## 5. Out of Scope

- Voice input or output on the satellite page.
- Multiple field boundaries per farm — one boundary per farm at launch.
- Sub-field zone analysis, prescription maps, or variable-rate application zones.
- Vegetation indices other than NDVI (EVI, SAVI, LAI, NDWI, etc.).
- Soil moisture, thermal band, or radar (SAR) analysis.
- Automated alerts or push/SMS notifications when NDVI drops below a threshold.
- Export of NDVI data as CSV, GeoTIFF, PDF, or any downloadable format.
- Passing NDVI values into the AI advisor — separate feature requiring its own spec.
- Drone or UAV imagery upload or integration.
- Commercial satellite providers (Planet, Maxar, etc.).
- Historical data beyond 12 weeks.
- Satellite change detection between seasons or years.
- Agronomist or expert role with access to multiple farmers' satellite data.
- Dark mode for the satellite map.
- Offline mode or PWA caching of satellite imagery.
- Government schemes linked to crop health data.
- Automated boundary detection from satellite imagery (auto-delineate the field).

---

## 6. Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| AC-1 | Unauthenticated visit to `/satellite` redirects to login. | Navigate while logged out; confirm redirect to `/login`. |
| AC-2 | Farmer with no farms sees empty state with "Add your first farm" button — map does not render. | Log in as user with zero farms; visit `/satellite`; confirm no map element is present. |
| AC-3 | Farm selector lists only non-archived farms for the authenticated farmer. | Create 3 farms (2 active, 1 archived); confirm only 2 appear; confirm another user's farms do not appear. |
| AC-4 | Selecting a farm with no boundary shows the draw prompt and centres the map on that farm. | Select a farm with known lat/lng and no boundary; confirm map centres and "Draw Field" is visible. |
| AC-5 | Selecting a farm with a saved boundary renders the boundary on the map and loads its NDVI. | Select a farm with a saved boundary; confirm polygon is visible and NDVI overlay loads. |
| AC-6 | "Draw Field" activates polygon draw mode; tapping corner points places vertices. | Tap "Draw Field"; confirm draw mode is active; tap 3 points; confirm 3 vertices appear. |
| AC-7 | A polygon with fewer than 3 distinct corner points cannot be saved. | Draw 2 points; confirm "Save Field" button is disabled or tapping it shows a validation error. |
| AC-8 | A valid polygon can be saved; the row appears in `field_boundaries` with the correct `farm_id` and GeoJSON. | Draw and save a valid polygon; query `field_boundaries` in DB; confirm row exists with correct data. |
| AC-9 | Saving a boundary triggers an automatic NDVI fetch — a loading skeleton appears in the field area. | Save a boundary; confirm skeleton appears inside the polygon area on the map. |
| AC-10 | After the NDVI fetch, a color heatmap overlay appears inside the boundary on the map. | Wait for fetch to complete; confirm a colored PNG overlay is visible within the field bounds. |
| AC-11 | The NDVI color legend is always visible while a boundary is selected. | With a boundary displayed, confirm the legend (red/yellow/green + value labels) is present in the map corner. |
| AC-12 | The stats card shows snapshot date, mean NDVI to 2 decimal places, and a health label. | Confirm card renders with a date, a value like "0.47", and one of "Healthy" / "Moderate" / "Stressed". |
| AC-13 | Health label "Healthy" appears when mean NDVI > 0.5; "Moderate" for 0.2–0.5; "Stressed" for < 0.2. | Stub three snapshots at 0.6, 0.35, 0.1; confirm correct labels render. |
| AC-14 | Returning to a farm with a cached snapshot does not trigger a new satellite request. | Load a farm with a cached snapshot; confirm no request to the NDVI API route is made (check network tab or server logs). |
| AC-15 | History strip shows up to 12 weekly cards; the current snapshot is highlighted. | With 12 cached snapshots, confirm 12 cards render and the active one is visually distinguished. |
| AC-16 | Tapping a history card switches the map overlay and stats card to that week's data. | Tap week 3 card; confirm overlay and stats update to week 3's image and mean NDVI. |
| AC-17 | A week with cloud cover shows a cloud icon and no overlay when tapped. | Stub a snapshot with `cloud_cover = true`; tap its card; confirm cloud icon and "no clear imagery" message. |
| AC-18 | The default view shows the most recent *clear* snapshot, not necessarily today's date. | With today's snapshot flagged as cloudy and last week's clear, confirm last week's is loaded by default. |
| AC-19 | When no clear imagery exists in 14 days, the "imagery expected" message is shown — not an error. | Simulate no clear snapshots for 14 days; confirm message (not error state) renders. |
| AC-20 | "Edit Field" allows vertex dragging; saving sends a PATCH and updates the stored GeoJSON. | Edit a polygon vertex; save; query DB; confirm updated GeoJSON is stored. |
| AC-21 | "Delete Field" shows confirmation dialog; confirming deletes boundary and all its snapshots. | Tap "Delete Field"; confirm dialog; confirm; query DB; confirm boundary row and all snapshot rows are gone. |
| AC-22 | Saving a new boundary for a farm that already has one warns the farmer and deletes the old boundary atomically. | Save a second boundary for a farm; confirm warning dialog; confirm; query DB; confirm only one boundary row exists for that farm. |
| AC-23 | A polygon larger than 500 ha is rejected with a 400 and a human-readable message. | Submit a polygon covering ~600 ha; confirm 400 response and correct error message on the client. |
| AC-24 | A polygon with coordinates outside Pakistan's geographic bounding box is rejected. | Submit a polygon with coordinates in, e.g., central Africa; confirm 400 response. |
| AC-25 | Any `/api/satellite/*` route returns 401 for unauthenticated requests with the standard error shape. | Call each route without a session cookie; confirm 401 and `{ error: { code, message } }` shape. |
| AC-26 | Attempting to read or modify another user's boundary returns 403, not 404. | Authenticate as user A; attempt to GET/PATCH/DELETE a boundary owned by user B; confirm 403. |
| AC-27 | Copernicus API failure shows "temporarily unavailable" message; cached snapshots still display. | Stub Copernicus to return 500; confirm toast/message appears and existing cached overlays still render. |
| AC-28 | An NDVI fetch that exceeds 30 seconds shows the "taking longer than usual" state with a retry button. | Stub a 35-second Copernicus delay; confirm skeleton is replaced by the timeout message and retry button. |
| AC-29 | `/satellite` nav item appears in both the sidebar (desktop) and the bottom tab bar (mobile). | Verify nav entry is present and links to `/satellite` at both breakpoints. |
| AC-30 | All new UI strings have translation keys in the Neon `translations` table for all 8 locales before merge. | Run `scripts/sync-translations.mts`; confirm zero missing keys for all 8 locale codes. |
| AC-31 | `npm run lint` passes with no errors after all changes. | Run `npm run lint`; confirm clean output. |
| AC-32 | `npm run build` completes successfully after all changes. | Run `npm run build`; confirm no build errors. |
