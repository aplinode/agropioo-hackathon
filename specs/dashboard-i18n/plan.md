# Plan — Farmer-app localization (rev 2)

Basis: `spec.md` v2 (clarified) + `research.md`, verified line-by-line against the codebase 2026-08-25. Rev 2 corrects assumptions found during verification (login/signup live in `(site)/[locale]/`; ADR numbering convention; no relative-time formatter exists yet). This doc owns HOW. Every task ends verified against spec and committed.

## Architecture decisions

**D1 — Route model (cookie-driven, Approach B).** Bare URLs stay; **the proxy matcher's hardcoded exclusion list is untouched** — cookie resolution needs zero routing-infrastructure change. `app/(farmer)/layout.tsx` resolves locale server-side from the `agro_locale` cookie via a new pure function `resolveAppLocale(value)` in `lib/i18n/logic.ts` (invalid/absent ⇒ `en`), then emits `<html lang/dir>`, attaches Nastaliq + Noto Sans Arabic font variables for non-English locales (mirroring the proven site-layout pattern), fixes its now-stale "English at launch" comment, and serves a localized default `<title>` via `generateMetadata`. Login/signup are site-group routes and are not affected. Recorded in `adrs/0004-app-cookie-locale.md`.

**D2 — Dictionary delivery.** Same pipeline as the site: Supabase `translations` table
is the single source of truth; translations authored directly via SQL/migrations using
Supabase MCP (no catalog files). Runtime reads DB via `getDictionary(locale)` with
English fallback. Client views receive typed prop bundles from thin server shells
(group-4e `LoginCopy` pattern). New keys under an `app.*` namespace: `app.shell.*`,
`app.dashboard.*`, `app.farms.*`, `app.detect.*`, `app.records.*`, `app.prices.*`,
`app.weather.*`, `app.notifications.*`, `app.settings.*`, `app.more.*`, `app.advisor.*`,
`app.auth.*`. Parameterized copy (greetings, counts) uses the existing
`formatMessage("{name}")` placeholder helper.

**D3 — Advisor data model.** Each canned reply keeps its id/order in demo-data; per-locale `body` plus per-locale `triggers` lists live in the Supabase `translations` table under `app.advisor.replies.<id>.body|triggers` (existing English keywords incl. roman-Urdu variants seed the EN rows). Matcher checks the active locale's triggers, with EN triggers always included as floor.

**D4 — Numbers & times.** All rendering goes through `lib/i18n/format.ts`; every `toLocaleString("en-PK")` and hand-written relative time ("2 hours ago") in app code is replaced. **New pure helper `formatRelativeTime(value, locale)` lands first (T3.5) with unit tests** — format.ts today has only `formatNumber`/`formatCount`. Mono contexts get `"Noto Sans Arabic"` appended to the font fallback chain so Eastern digits resolve consistently (visual QA item).

**D5 — Script-safe typography.** CSS-level guard: inside `[dir="rtl"]`, `letter-spacing` is forced to normal (covers ~60 farmer instances + the 2 shipped login-form eyebrow violations without touching each file). Nastaliq leading tokens (`[lang="ur"]` line-height ≥ 1.9 for body-size text); audit removes `truncate`/`line-clamp` + fixed-height combos on translated strings.

**D6 — Validation errors.** farm-form/record-form/detect-upload error messages move onto the existing literal→key map pattern (`ERROR_KEYS` from group 4e); Zod schemas stay put.

**D7 — Auth-adjacent fixes riding along.**
- Site-group login/signup cross-links point to **bare** `/forgot-password` `/reset-password` `/verify` (they're app surfaces under `(farmer)`; kills the `/ur/forgot-password` 404 family).
- Signup success redirects to `/onboarding`; existing-user login keeps PR #16's `/dashboard`.
- Onboarding rebuilt: registry-driven 8-language grid, pre-selected from cookie, `localStorage["agropioo-language"]` deleted.
- Settings language list derived from registry (no "Soon" flags, no invented codes).
- Every app surface owns a locale-aware `generateMetadata` title.

## Task breakdown (each = one commit, verified)

| # | Task | Verify | Est. keys |
|---|---|---|---|
| T1 | ADR `0004` + `resolveAppLocale()` (+tests) + farmer layout emits lang/dir/fonts from resolved locale + stale-comment fix + localized default metadata | tsc·tests·smoke: cookie `ur` ⇒ `dir=rtl`+fonts, `en` pixel-unchanged | ~2 |
| T2 | Switcher `variant="app"`: current locale passed as prop by server parent (URL parsing is the 404 root cause); same-path reload; `persistChoice` reused | manual smoke all 8 · unit for path logic | 0 |
| T3 | Typography guards: RTL tracking kill-switch, Nastaliq leading tokens, mono digit fallback, login-form eyebrow fix | grep audits zero remaining violations · visual smoke | 0 |
| T3.5 | `formatRelativeTime(value, locale)` in format.ts (+tests) | vitest green | 0 |
| T4 | Shell + dashboard: `app.shell.*`/`app.dashboard.*` keys seeded in SQL migration via Supabase MCP (8 locales); sidebar/tabs/header/dashboard-view/demo-data consume bundles; digits/times via format helpers; dashboard metadata | DB checks · smoke ur dashboard fully RTL | ~115 |
| T5 | Farms suite: list/new/detail/records + farm-form + record-form (D6 error maps) | forms exercise EN+UR error paths | ~155 |
| T6 | Detect + notifications | smoke both locales | ~50 |
| T7 | Prices + weather: format-helper migration, mixed-direction isolation (FR-14) | digit assertions · smoke | ~80 |
| T8 | Advisor: D3 restructure + matcher per-locale + chat UI | unit tests: ur trigger → ur reply; unknown → localized fallback | ~40 |
| T9 | Settings + More: registry-derived list (D7), remaining copy | list matches registry exactly | ~40 |
| T10 | Verify/forgot/reset/onboarding: bundles + rebuild onboarding + signup→onboarding redirect + bare-link fixes (D7) | AC-8 flow run-through | ~60 |
| T11 | Full DB verification: counts ((671+N)×8) + SQL spot-checks (coverage test already enforces ×8); no sync script needed | SQL checks + coverage test | — |
| T12 | Gates: tsc/lint/tests/build + automated AC checks (resolution rules, per-locale matching, digit formatting) | all green | — |
| T13 | Manual acceptance run-through (AC 1–10) documented in `specs/dashboard-i18n/verification.md`; Chromium cursive inspection; 320px RTL sweep | checklist signed | — |

Translation keys are seeded via SQL migrations (INSERT statements) applied through
Supabase MCP after each catalog-expanding task (missing rows fall back to English, so
partial states never break). Founder edits happen directly in the DB via MCP.

## Risks & contingencies

- **Translation volume is the long pole** (~540 keys × 7). Mitigation: keys seeded
  per task via SQL migrations, translations batched per phase, DB-first approach
  eliminates sync drift risk.
- **Nastaliq clipping** may surface component-level fixes during T13 QA beyond planned audits — handled as spec-compliant adjustments, not scope creep.
- **Site regression risk is low**: T1 touches only `(farmer)/layout.tsx`; login/signup/marketing live elsewhere and keep URL-driven behavior.
- **Collaborator overlap**: PRs may land mid-feature; standing constitution rule applies (pull-rebase before every push, their merged intent wins on collision).

## Out of plan (per spec)

Voice, new languages, localized URL segments, real backend/advisory intelligence, dark mode.
