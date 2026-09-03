# Offline-First PWA + Sync

**Feature Branch**: `14-offline-pwa-sms` (git branch; folder renamed to `offline-pwa`)  
**Spec File**: `specs/offline-pwa/spec.md`  
**Research**: [`research.md`](research.md)  
**Status**: Draft  
**Input**: Feature #14 from `docs/Agropioo_features.md` + founder interview 2026-09-03  
**Note**: SMS alerts (Twilio) are deferred to a separate `specs/sms-alerts/` ticket — see Out of Scope. The `users.phone` column already exists for when SMS ships.

---

## Goal

Rural Pakistan farmers lose connectivity daily in fields where 4G is spotty. Agropioo must work offline so a farmer can view weather advisories, crop guides, price data, and farm records without a signal, record observations and take photos that queue locally, and have everything sync automatically when the network returns — turning dead zones into productive time instead of dead time.

---

## User Scenarios

**US-1. View advisories offline.** When a farmer opens the Weather page in a dead zone, they see the last cached forecast and daily advisory immediately (no spinner, no error). They know what to do today without waiting for a connection.

**US-2. Record a field observation offline.** When a farmer logs a farm record (sowing, irrigation, harvest, disease observation) with no signal, the record is saved locally and appears in their record list instantly. When signal returns, the record syncs to the server automatically.

**US-3. Upload a photo offline.** When a farmer takes or selects a photo for a disease observation or farm record while offline, the photo is stored locally as a blob in the `photos` object store and a queue entry (`entity=photo`, target `POST /api/detect`) is created. When the network returns, the photo is replayed through `/api/detect` — which runs the **full detection pipeline** (HuggingFace model + Cloudinary upload) and returns the final `imageUrl`. If the photo is paired with an offline record, a second queue entry (`entity=record`, target `POST /api/records`) was queued immediately after the photo entry; on replay the photo entry is sent first, its returned `imageUrl` is backfilled into the record's body, and then the record entry is sent.

**US-4. Edit farm details offline.** When a farmer edits a farm's crop, sowing date, or area while offline, the edit is stored locally and synced on reconnect. If another device changed the same farm in the meantime, last-write-wins by server `updated_at`.

**US-5. See network status at a glance.** When a farmer is offline, the bottom tab bar shows an "Offline — queued N items" indicator. When they come back online, the indicator changes to "Syncing…" then "All synced" and disappears.

**US-6. Browse crop guides and scheme info offline.** When a farmer opens a crop guide or a scheme/feature page from the site navigation while offline, the cached content loads instantly from the service worker cache.

**US-7. Resume after a browser crash or refresh.** When a farmer closes the browser or the tab crashes while offline, their queued records and drafts survive and reappear when they reopen the app.

**US-8. Sync completes within a reasonable window.** When a farmer regains connectivity after being offline, all queued writes sync to the server within 60 seconds.

---

## Functional Requirements

- **FR-1**: The app must be installable as a PWA. A `manifest.json` with appropriate icons, name, short_name, display="standalone", and theme_color must be served. The browser `beforeinstallprompt` event must be captured in the farmer app shell and surfaced as a custom "Add to Home screen" button; the browser's native install banner remains as a fallback for browsers that ignore the custom UI.

- **FR-2**: A service worker must be registered with **root scope (`/`)** on every page load and must intercept all navigation requests and `GET` API requests under `/api/`. Root scope covers both the farmer app and the marketing/site routes so offline page caching works everywhere (FR-5).

- **FR-3**: The service worker must cache core static assets (fonts, CSS, icons, favicon) for offline serving using a **cache-first** strategy at service-worker install time (precache). At runtime, assets use **stale-while-revalidate**: serve from cache immediately, update in the background.
- **FR-4**: All `GET` API responses (weather forecast, weather alerts, farm list, farm details, records list, price data) must be cached by the service worker using a **network-first** strategy (Workbox `NetworkFirst`): live requests always go to the server and pass through Next.js's own fetch cache / ISR, making that the single source of truth. The service-worker cache is consulted **only when the network is unavailable** (true offline), with a uniform 24-hour max-age TTL. Stale content up to 24h is acceptable for weather and prices.

- **FR-5**: Static marketing pages (crop guides, scheme/feature pages under `/[locale]/features/*`, `/[locale]/how-it-works`, etc.) must be cached at service worker install time so they load instantly offline.

- **FR-6**: An IndexedDB local database (`agropioo_offline`, version 1) must store queued write operations across three object stores: `writes` (keyPath `uuid`), `photos` (pending image blobs), and `meta` (app settings + cache version). Schema migration uses an additive-only `onupgradeneeded` version switch: future versions only add new stores or keys, never alter existing entry shapes. Each queue entry must carry a client-generated UUID, the target endpoint, the HTTP method, a serialized JSON body, the entity type (`record`, `photo`, `farm_edit`, `pnl` — `pnl` reserved for the future Profit/Loss feature #7, not yet producing entries), a status field (`pending`, `syncing`, `failed`, `synced`, `discarded`), a retry count, and a timestamp.

- **FR-7**: When the farmer submits a new farm record while the app detects no effective network connection (`navigator.onLine === false` **or** the API call fails with a network/timeout error — not only on `onLine === false`, since rural 4G can report online while unreachable), the write must be saved to the IndexedDB queue as `pending` and displayed in the UI immediately (optimistic rendering). The queued record is joined into the in-browser record list alongside server-fetched records; when sync succeeds, the local copy is dropped from the queue and the server-confirmed record takes its place (no duplicate).

- **FR-8**: When the farmer uploads a photo (for disease detection or farm records) while offline, the photo must be stored as a blob in the `photos` object store of IndexedDB and a queue entry created referencing the pending upload to `POST /api/detect` (formData field `image`). The replay runs the full `/api/detect` pipeline (HuggingFace detection + Cloudinary upload) and yields the `imageUrl`. **Photo-to-record coupling:** when a photo is paired with an offline record, a second queue entry (`entity=record`, target `POST /api/records`) is queued immediately after the photo entry. On replay the photo entry is sent first (FIFO), its returned `imageUrl` is backfilled into the record body, and then the record entry is sent. If the photo entry fails, the paired record entry is not attempted (it stays pending for the next drain).

- **FR-9**: When the farmer edits an existing farm's details offline, the edit must be queued as a PATCH operation in IndexedDB with the farm's UUID and the original `updated_at` timestamp.

- **FR-10**: When the app transitions from offline to online (via the `online` event or a successful API call after being offline), it must drain the IndexedDB write queue by replaying each pending entry against the corresponding Route Handler in order. Draining only proceeds while the app is in the **foreground** (the active tab) — a `visibilitychange`/`focus` listener initiates the drain so the sync runs when the farmer brings the app back up, not silently in the background. Sync must complete within 60 seconds of the drain starting while the tab is focused.

- **FR-11**: On sync, each queue entry is sent to the server with `credentials: 'include'`. If the server returns 200/201, the entry status becomes `synced`. If the server returns 401 (auth expired), the entry is marked `failed`, the **entire pending queue is cleared**, and the farmer sees "session expired — sign in again." If the server returns 404 (entity deleted), the entry status becomes `failed` with a "deleted" flag and the farmer is notified in-app. For farm edits (PATCH), the server **always overwrites** (last-write-wins by `updated_at`): on 200 the client compares the returned `updated_at` to the timestamp it sent — if they differ, the local edit is marked `discarded` and a "record updated on another device" banner shows; if the server returns 5xx or the network fails, the entry stays `pending` and the retry count increments.

- **FR-12**: Queue sync must implement exponential backoff per entry: retry after 5s, then 30s, then 2min, then 5min, up to 3 retries. After 3 failed retries, the entry status becomes `failed` with a per-entry **Retry** button in the Pending Issues view and a bulk **Retry all failed** button in the network-status indicator. The farmer may retry individual failed entries (including 422 validation failures from EC-6) or all at once; either action re-injects the selected entries into the drain queue.

- **FR-13**: The farmer app shell (bottom tab bar) must display a persistent network status indicator showing: Offline (with queued count), Syncing (with progress), or nothing when all synced. This indicator must be visible on every farmer app page.

- **FR-14**: All queued writes must survive a full page reload or browser restart while offline. The IndexedDB data must persist across sessions.

- **FR-15**: The service worker must implement cache-busting for authenticated API `GET` responses by including the session cookie in fetch options (`credentials: 'include'`) so cached responses respect per-user data.

- **FR-16**: A cache version identifier must be stored in the service worker. When the service worker updates, it must clear old cache entries before activating the new version.

- **FR-17**: All new user-visible strings (offline indicator text, sync status, error messages for offline content unavailability) must have translation keys for all 8 locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`) inserted in the Neon `translations` table. Keys are namespaced under `app.offline.*`.

- **FR-18**: The `npm run sync:translations` script must pass with zero missing keys for the `app.offline.*` namespace after all 8 locale catalogs are updated.

---

## Edge Cases & Rules

- **EC-1. Never-cached page while offline.** When the farmer navigates to a page that was never loaded while online (no cached version exists and no service-worker route match), the UI shows a "offline content unavailable" message with a "connect to sync" prompt (served from the locale-aware `/[locale]/offline` fallback route) instead of a network error or blank screen. The offline fallback page itself is cached at service-worker install time (one copy per locale under `/[locale]/offline`) and loads instantly. The SW `navigateFallback` maps to the matching `/[locale]/offline` path.

- **EC-2. Large queue.** The queue enforces a **hard cap of 50 pending entries**. If a farmer attempts to queue a 51st write, the save is blocked and the farmer sees "offline storage nearly full — connect to sync." `synced` entries are auto-purged from IndexedDB the moment the server confirms them (status `synced`); they do not accumulate. `failed` entries are retained (for manual retry per FR-12) until the farmer dismisses them.

- **EC-3. Duplicate offline submissions.** When the farmer double-taps the submit button while offline, the UI must prevent duplicate queue entries (debounced submit + client-side UUID dedup before inserting into IndexedDB).

- **EC-4. Photo storage quota.** When the offline photo queue approaches the browser's IndexedDB storage quota, the app calls `navigator.storage.estimate()` and, when usage ≥ 50% of `quota` (or `quota` is unavailable), downscales the oldest unsynced photos to 1024px max dimension before storing another photo (matching the online `/api/detect` ≤1024px path). When `QuotaExceededError` is actually thrown by the browser, the farmer sees a "storage full — connect to sync" error and the photo is not saved.

- **EC-5. Conflicting farm edits.** When two devices edit the same farm offline, the server always accepts the first replay and overwrites (last-write-wins by `updated_at`). On 200, if the returned `updated_at` differs from the timestamp the client sent, the losing device's edit is marked `discarded` in the queue and the farmer is shown a "record updated on another device" banner. The server never returns 409 for this case.

- **EC-6. Server-side validation failure on replay.** When a queued write replays and the server returns 422 (validation error — e.g. the farmer entered invalid data while offline), the entry status becomes `failed` with the validation message stored, and the farmer can see and correct the error in a "pending issues" view.

- **EC-7. Service worker update during offline session.** When a new service worker is installed while the farmer is offline, it waits for activation until the farmer comes online and closes all tabs (standard Next.js / Workbox update flow). No offline session is interrupted.

- **EC-8. Empty queue on first load.** When the app loads for the first time (no IndexedDB data), the UI shows the normal online state with no indicator. The indicator only appears when there are pending writes or the network is down.

- **EC-9. Auth expired while offline.** If the farmer's session expires while they are offline and they try to submit a record, the write is queued as pending. On the next sync attempt, the app detects the 401 and clears the entire queue with a "session expired — sign in again" message. Queued work is not recoverable after a 401.

- **EC-10. Partial sync.** When syncing a batch of 20 pending writes and the first 5 succeed, the next 10 fail with 5xx, and the last 5 were never attempted — the successfully-synced 5 are marked `synced`, the failed 10 stay `pending` for retry, and the remaining 5 are not yet sent. Replay is strict FIFO (oldest-first): entries that fail due to entity dependencies (e.g. a record referencing a farm not yet synced) retry on the next drain attempt. The UI reflects partial progress.

- **EC-11. Offline during photo upload.** If the farmer takes a photo, the network drops before upload completes, the photo is stored in the `photos` object store in IndexedDB and a queue entry (`entity=photo`, target `POST /api/detect`) is created. On reconnect, the photo is replayed through `/api/detect` (full detection + Cloudinary upload via `lib/detect/cloudinary.ts`). Its returned `imageUrl` is backfilled into any paired record queue entry, which is then sent to `/api/records`.

- **EC-12. Offline price data.** Price data cached via the service worker remains available. If the farmer tries to set a price alert while offline, the alert creation is queued as a `record`-entity POST to `/api/prices/alerts` and syncs on reconnect.

---

## Out of Scope

- SMS alerts via Twilio (deferred — AGENTS.md lists SMS as out of scope for demo; alerts remain email + in-app only)
- Offline *generation* of new weather advisories (requires online weather API; only previously-generated cached advisories are available offline)
- Caching satellite imagery tiles (size constraints; deferred to future phase)
- Voice input/output for the advisor (out of scope per AGENTS.md)
- Dark mode (out of scope per AGENTS.md)
- Real-time collaborative editing across devices
- Browser push notifications (only in-app notifications and email; not service-worker push)
- Offline support for the satellite monitoring feature's heavy imagery
- Progressive enhancement of the landing site pages beyond basic static caching

---

## Acceptance Criteria

- **AC-1**: `npm run lint` and `npm run build` pass with zero errors.
- **AC-2**: The app is installable as a PWA on mobile (install prompt appears in the farmer app on a cold start after one visit). `manifest.json` is served with icons, `display="standalone"`, and `theme_color`.
- **AC-3**: A service worker is registered and active on every farmer app page (`/dashboard`, `/farms`, `/records`, `/weather`, `/advisor`, `/detect`, `/prices`).
- **AC-4**: After loading the Weather page and Farm list page once online, both load instantly from cache when the device is offline.
- **AC-5**: A farm record created while offline appears in the record list immediately (optimistic render, joined from IndexedDB) and syncs to the server within 60 seconds of the drain starting while the app is in the foreground.
- **AC-6**: A photo taken/selected while offline uploads to Cloudinary and completes sync when the network returns.
- **AC-7**: The network status indicator shows "Offline" with a queued count when `navigator.onLine` is false, "Syncing" during queue drain, and disappears when all writes are synced.
- **AC-8**: After a full page reload while offline, pending writes are still in the IndexedDB queue and sync on the next online transition.
- **AC-9**: When a queued farm edit's server response `updated_at` differs from the timestamp the client sent, last-write-wins: the server record is preserved and the local edit is marked `discarded` with a user-visible "record updated on another device" banner.
- **AC-10**: The `npm run sync:translations` script runs successfully with zero missing keys for the `app.offline.*` namespace across all 8 locales.
- **AC-11**: All new user-visible strings have a `getOfflineBundle()` server-side bundle — no hardcoded copy in client components.
- **AC-12**: The offline status indicator and "offline content unavailable" fallback render correctly under RTL (`dir=rtl`) for Urdu (`ur`) and Pashto (`ps`), inheriting the global `dir` from the root layout without per-component mirroring logic.

---

## Dependencies

- **`next-pwa`** (approved, founder 2026-09-03): Next.js plugin that wraps Workbox. Provides service worker generation, caching strategies, and offline fallback. Maintenance weight: low (actively maintained, standard ecosystem choice). Approval recorded per the constitution's dependency rule.
- **Workbox** (bundled with `next-pwa`): Service worker library for caching strategies and background sync. Comes as a transitive dependency of `next-pwa`.
- **`cloudinary`** npm package (already installed, used by `lib/detect/cloudinary.ts`): Server-side upload for queued photos. No new dependency.
- **No new runtime libraries** for IndexedDB — the queue uses native IndexedDB via a new `lib/offline/idb.ts` promise wrapper (version 1, additive-only `onupgradeneeded`).

## Internal artifacts (new, no new deps)

- `lib/offline/idb.ts` — promise wrapper around native IndexedDB; manages `agropioo_offline` DB (stores `writes`, `photos`, `meta`).
- `lib/offline/queue.ts` — enqueue / drain / retry logic; wires `online`/`offline` events and exponential backoff (FR-12); enforces the 50-pending hard cap (EC-2); handles photo→record `imageUrl` backfill on replay (FR-8).
- `lib/offline/status.ts` — readable store emitting network + sync status for the shell indicator (FR-13).
- `app/[locale]/offline/page.tsx` — locale-aware static offline fallback route (EC-1), pre-cached by `next-pwa` for each of the 8 locales and registered as the SW `navigateFallback`.
- `lib/i18n/server.ts` — add `getOfflineBundle()` following the `getShellBundle` / `getWeatherBundle` pattern; resolves `app.offline.*` from the `translations` table.
- `catalog/{en,ur,pa,ps,sd,skr,bal,hno}.ts` — add `app.offline.*` keys for all 8 locales before `npm run sync:translations`.

## ADRs

See `adrs/` — this feature requires recording the offline caching and sync architecture decision (ADR-0014). Key decisions captured:

- **ADR-0014.1** — Conflict resolution: server always overwrites on PATCH (last-write-wins by `updated_at`); the client detects divergence on the 200 response by comparing returned `updated_at`. No 409 path.
- **ADR-0014.2** — Auth in offline mode: the queue stores no session data; replay uses `credentials: 'include'`. On 401 the queue is cleared.
- **ADR-0014.3** — Replay ordering: strict FIFO (oldest-first); dependency failures retried per FR-12. Photo-record coupling is handled within FIFO (photo entry is queued before its paired record entry, so replay order is preserved).
- **ADR-0014.4** — IndexedDB schema: version 1, three stores (`writes`, `photos`, `meta`), additive-only `onupgradeneeded`.
- **ADR-0014.5** — Scope: SMS alerts (Twilio) deferred to a separate `specs/sms-alerts/` ticket; this feature is PWA + offline sync only.
- **ADR-0014.6** — Service worker scope: registered at root `/` so it caches marketing pages (FR-5) and the farmer app, not just `/(farmer)`.
- **ADR-0014.7** — Sync trigger: the queue drains only when the app is in the foreground (active tab) — a `visibilitychange`/`focus` listener initiates the drain alongside the `online` event, so sync does not run silently in the background.
- **ADR-0014.8** — Online data freshness: the SW uses a network-first strategy for GET /api responses; the SW cache is an offline-only mirror and Next.js's fetch cache / ISR remains the live source of truth (no stale live data served from the SW cache).
- **ADR-0014.9** — Offline UX: the `/offline` fallback is locale-aware (`/[locale]/offline`) so it renders in the farmer's language (Urdu/Pashto RTL included).
