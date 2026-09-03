# Research: Offline-First PWA + Sync

**Feature**: 14-offline-pwa (folder renamed from offline-pwa-sms; SMS alerts deferred to specs/sms-alerts)  
**Date**: 2026-09-03  
**Status**: Complete  

## Feature Context

Feature #14 from `docs/Agropioo_features.md`. Listed as a "Wow Factor" (green tier), not part of the hackathon demo build order (features 1–7). The landing page already references this capability via catalog keys (`home.matrix.t3f5Title`, `feat.voice.offlineTitle`, etc.), and the constitution explicitly lists "SMS alerts" as **out of scope for demo**.

## Research Tasks

### 1. Existing Offline Infrastructure

**Finding**: No PWA infrastructure currently exists in the codebase.

- No `next-pwa`, no service worker, no `manifest.json`, no Workbox.
- The project uses stock Next.js 16.3.2 with `next.config.ts` containing only experimental `globalNotFound` and webpack alias for the OpenAI realtime stub.
- `public/` contains SVGs and images but no web app manifest.
- `app/layout.tsx` has no PWA-related metadata (no `apple-mobile-web-app-capable`, no theme color beyond `themeColor: "#F0FDF4"`, no icons array).

**Existing partial pattern**: `hooks/use-offline-prices.ts` implements a simple localStorage cache with TTL for price data. This is a read-through cache, not a write-through queue. It does not support background sync, queued writes, or conflict resolution.

**Conclusion**: PWA infrastructure must be built from scratch. `next-pwa` (the standard Next.js PWA plugin) + Workbox is the standard approach, but this is a new dependency requiring founder approval per the constitution's "New dependency rule."

### 2. Existing SMS/Twilio Infrastructure

**Finding**: No Twilio integration exists anywhere in the codebase.

- No `twilio` package in `package.json`.
- No Twilio configuration in `.env.example` or `.env`.
- The only alerting channel for weather alerts (the closest analog) is email via `nodemailer` + SMTP in `lib/weather/alerts.ts:159-193`, plus in-app notifications stored in the `weather_alerts` table.
- The `users` table (`db/migrations/0002_auth.sql`) has a `phone` column (text), so phone numbers are already collected at signup — though not currently used for SMS.

**Conclusion**: Twilio is a new dependency requiring approval. The phone number field already exists in the user model.

### 3. Data That Needs Offline Support

Based on the feature description and existing codebase patterns:

| Data Type | Already Exists | Offline Need |
|---|---|---|
| Weather advisories | `weather_advisories` table, `/api/weather/forecast` | Cache last 7-day forecast + advisory locally |
| Weather alerts | `weather_alerts` table, `/api/weather/alerts` | Cache active alerts locally |
| Crop guides/disease detection | `knowledge_base` via embeddings | Cache guide content locally |
| Scheme info | `app/(site)/[locale]/features/*` | Cache static feature content |
| Farm records (observations) | `records` table, `POST /api/records` | Queue for offline creation |
| Photo captures | Cloudinary upload in detect feature | Queue uploads for offline |
| P&L calculator | Farm Profit/Loss Calculator (feature #8, not yet built) | Cache inputs and computed results |
| Price data | `use-offline-prices.ts` hook, `mandi_prices` table | Already partially cached |

**Existing write pattern**: Records are created via `POST /api/records` → validated by Zod (`createRecordSchema`) → stored in Postgres via `lib/db.ts`. This is the primary write path that needs offline queuing.

### 4. Sync Strategy Options

**Option A: Service Worker + Background Sync API**
- Workbox provides `backgroundSync` plugin for the service worker
- Queues POST requests when offline, replays when connectivity returns
- Works in Chrome/Edge but has limited support in Safari (background sync is experimental there)
- Requires custom logic for conflict resolution and deduplication

**Option B: Client-side queue in IndexedDB**
- App-level queue table in IndexedDB stores pending writes with a UUID
- On app load and on connectivity change events, drain the queue via API calls
- More control over retry logic, conflict resolution, and user-visible status
- Works across all browsers since it doesn't depend on Background Sync API

**Option C: Hybrid**
- Service worker caches GET responses (static assets + API GETs)
- Client-side IndexedDB queue handles writes via online/offline event listeners

**Assessment**: The constitution allows no new dependencies without approval. Workbox comes bundled with `next-pwa`. However, the Background Sync API and IndexedDB can be used natively (no library needed) — IndexedDB is available in the browser with no wrapper, and the `online`/`offline` events are standard. This reduces dependency surface.

### 5. Next.js PWA Considerations

**Constraint**: The constitution says "Route Handlers ARE the API layer — no separate Express/Node backend" and "Server Actions are not used." This applies to both client and server code. The PWA service worker runs in a separate worker context and cannot directly use Next.js Route Handlers — it must fetch from HTTP endpoints, which is compatible.

**Key decisions**:
- Next.js 16 with App Router. PWA plugins for Next.js typically inject a service worker via Workbox.
- The existing i18n is locale-based via URL slugs (`/ur/...`). The service worker cache strategies must respect locale-aware routing.
- Server-first RSC approach means most data fetching happens server-side. The PWA layer must cache API responses (Route Handler responses) for offline use, not just static assets.

**next-pwa alternative**: Since `next-pwa` is a new dependency, we could also write a custom service worker. However, Workbox provides battle-tested caching strategies and is the industry standard. The constitution's dependency rule applies.

### 6. Existing Alert Delivery System

`lib/weather/alerts.ts` shows the established pattern:
- Alert rules scan forecast data (`scanAlertConditions`)
- Deduplication: one alert per condition type per farm per 6-hour window
- Persists in `weather_alerts` table with `sent_via` JSONB array tracking delivery channels
- Email delivery via `nodemailer` + SMTP
- The `sent_via` column already supports an array — adding `"sms"` alongside `"email"` and `"in_app"` is a natural extension

The `users` table has a `phone` column. Twilio would need:
- Account SID + Auth Token (env vars)
- A Twilio phone number (env var)
- An API route to send SMS (Route Handler, consistent with the architecture)

### 7. Translation System

The existing i18n system must be used for all new UI strings:
- Add keys to `catalog/en.ts` under namespace `app.offline.*`
- Draft translations in all 7 non-English catalog files
- Run `npm run sync:translations` to upsert into the Neon `translations` table
- Add offline indicator strings to `getShellBundle()` in `lib/i18n/server.ts` (tab-bar indicator is the only `"use client"` sub-component)
- Client components receive strings as flat props (per the RSC boundary pattern)

### 8. Existing Tests

Test pattern: `vitest.config.ts` runs `lib/**/*.test.ts`, `catalog/**/*.test.ts`, `app/**/*.test.ts` in node environment. Tests for auth logic, validation schemas, rate limiting, and catalog coverage exist. New logic (sync queueing, conflict resolution) should get unit tests.

## Open Risks

- **Dependency approval**: `next-pwa` + `workbox` — **approved** by founder (2026-09-03). `twilio` deferred with SMS (see Out of Scope). ✅ resolved
- **AGANTS.md conflict**: SMS listed out-of-scope for demo but in the feature doc → **resolved by deferring SMS to `specs/sms-alerts/`**; this feature is PWA+offline only. ✅ resolved
- **Safari support**: Background Sync API not supported in Safari → **acceptable**, since sync uses client-side IndexedDB + `online`/`focus` events (no Background Sync dependency). ✅ resolved
- **Service worker + Next.js cache**: coordinated via network-first strategy; SW cache is an offline-only mirror, Next.js fetch cache/ISR is the live source of truth (ADR-0014.8). ✅ resolved
- **IndexedDB schema management**: versioned DB (v1, three stores) with additive-only `onupgradeneeded`; future entity types add new stores, never alter entry shapes (ADR-0014.4). ✅ resolved
- **Conflict resolution**: last-write-wins by server `updated_at`; client detects divergence on the 200 response, no 409 (ADR-0014.1). ✅ resolved

## Translation Strategy

All new visible strings follow the existing catalog → DB sync pattern:

1. **Authoring**: Add namespaced keys to `catalog/en.ts` under `app.offline.*`.
2. **Drafting**: Add partial translations to the other 7 locale catalog files.
3. **Sync**: Run `npm run sync:translations` to upsert the full key × locale matrix.
4. **Runtime**: Offline indicator strings are added to `getShellBundle()` in `lib/i18n/server.ts` (the tab-bar indicator is the only `"use client"` sub-component, subscribing to `lib/offline/status.ts`); the `/[locale]/offline` fallback page resolves `app.offline.*` via the existing `getDictionary`.
5. **Fallback**: If the DB is unreachable, the build-time catalog draft is used; English is always present as the source of truth.

**Key namespacing convention**: `app.offline.pageTitle`, `app.offline.status.online`, `app.offline.status.offline`, `app.offline.sync.pending`, `app.offline.sync.syncing`, `app.offline.sync.synced`, etc.
