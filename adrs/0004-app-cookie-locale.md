# ADR 0004 — Farmer-app locale is cookie-driven (no URL segments)

Date: 2026-08-25 · Status: accepted · Implements `specs/dashboard-i18n/plan.md` D1.

## Context

Marketing pages resolve language from the URL (`/ur/features`, bare = English via
proxy rewrite — ADR-adjacent lang-compat FR-3/FR-4). The farmer app lives at bare
URLs under `app/(farmer)` and its proxy matcher entries are excluded from
rewriting entirely. Localizing the app raised the routing question: prefix every
app route with a locale segment, or resolve language another way? Constraints:
pre-demo timeline (least churn wins), collaborator PR #16 already ships a
dashboard switcher that writes the `agro_locale` cookie and full-reloads, and
lang-compat FR-21 already reserves server-side readability for that cookie.
Industry practice converges here: next-intl documents cookie-only locales as a
first-class mode and created `localePrefix: 'never'` specifically for apps
"with almost everything behind authentication".

## Decision

1. **App URLs never carry a language segment.** The `(farmer)` root layout
   resolves the display locale server-side: `await connection()` → `cookies()` →
   `resolveAppLocale(value)` (new pure function in `lib/i18n/logic.ts`;
   absent/empty/unknown ⇒ `en`), then emits `<html lang dir>` and attaches the
   Nastaliq + Noto Sans Arabic font variables only for non-English locales —
   mirroring the site layout pattern. The proxy matcher is untouched.
2. **Persistence stays exactly as shipped** (FR-21): `document.cookie`
   `agro_locale=<code>`, 1-year max-age, SameSite=Lax; switching does a full page
   load so `<html>` re-emits correctly. No new storage mechanism; the onboarding
   page's parallel `localStorage` key is deleted when that surface lands (T10).
3. **Every farmer route renders dynamically** (`force-dynamic` at the group root;
   cookies() also opts routes into dynamic rendering) so a prerendered static
   shell can never leak the wrong direction/fonts — same reasoning as ADR 0003's
   guarded-segment rule.
4. **Shared links do not carry language.** A farmer opening an app link sees it
   in their own last-chosen language (spec FR-8); this is accepted, documented
   behavior of the cookie model, not a bug.

## Consequences

+ Smallest possible diff to a working app; no route moves, no matcher surgery,
  no guard redirect changes.
+ Switcher fix is localized: current-locale comes from the resolved value passed
  down as props, not URL parsing (the root cause of today's 404-on-switch).
− Two mental models coexist: marketing = URL decides; app = preference decides.
  Documented in both layouts' header comments to keep contributors honest.
− Cookie tampering yields fallback-to-en at worst (harmless by construction).
