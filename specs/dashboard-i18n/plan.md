# Plan — Farmer-app localization (rev 3)

Basis: `spec.md` v3 (clarified + amended 2026-08-27 with alignment & responsiveness requirements FR-13..FR-20, AC-13..AC-21) + `research.md`, verified line-by-line against the codebase 2026-08-25. Rev 3 adds explicit decisions and tasks for alignment/responsiveness so the RTL/local-language UI on the farmer dashboard is verifiably correct. This doc owns HOW. Every task ends verified against spec and committed.

## Architecture decisions

**D1 — Route model (cookie-driven, Approach B).** Bare URLs stay; **the proxy matcher's hardcoded exclusion list is untouched** — cookie resolution needs zero routing-infrastructure change. `app/(farmer)/layout.tsx` resolves locale server-side from the `agro_locale` cookie via a new pure function `resolveAppLocale(value)` in `lib/i18n/logic.ts` (invalid/absent ⇒ `en`), then emits `<html lang/dir>`, attaches Nastaliq + Noto Sans Arabic font variables for non-English locales (mirroring the proven site-layout pattern), fixes its now-stale "English at launch" comment, and serves a localized default `<title>` via `generateMetadata`. Login/signup are site-group routes and are not affected. Recorded in `adrs/0004-app-cookie-locale.md`.

**D2 — Dictionary delivery.** Same pipeline as the site: Neon `translations` table
is the single source of truth; translations authored directly via SQL/migrations using
Neon MCP (no catalog files). Runtime reads DB via `getDictionary(locale)` with
English fallback. Client views receive typed prop bundles from thin server shells
(group-4e `LoginCopy` pattern). New keys under an `app.*` namespace: `app.shell.*`,
`app.dashboard.*`, `app.farms.*`, `app.detect.*`, `app.records.*`, `app.prices.*`,
`app.weather.*`, `app.notifications.*`, `app.settings.*`, `app.more.*`, `app.advisor.*`,
`app.auth.*`. Parameterized copy (greetings, counts) uses the existing
`formatMessage("{name}")` placeholder helper.

**D3 — Advisor data model.** Each canned reply keeps its id/order in demo-data; per-locale `body` plus per-locale `triggers` lists live in the Neon `translations` table under `app.advisor.replies.<id>.body|triggers` (existing English keywords incl. roman-Urdu variants seed the EN rows). Matcher checks the active locale's triggers, with EN triggers always included as floor.

**D4 — Numbers & times.** All rendering goes through `lib/i18n/format.ts`; every `toLocaleString("en-PK")` and hand-written relative time ("2 hours ago") in app code is replaced. **New pure helper `formatRelativeTime(value, locale)` lands first (T3.5) with unit tests** — format.ts today has only `formatNumber`/`formatCount`. Mono contexts get `"Noto Sans Arabic"` appended to the font fallback chain so Eastern digits resolve consistently (visual QA item).

**D5 — Script-safe typography + overflow hierarchy.** CSS-level guard: inside `[dir="rtl"]`, `letter-spacing` is forced to normal (covers ~60 farmer instances + the 2 shipped login-form eyebrow violations without touching each file). Nastaliq leading tokens (`[lang="ur"]` line-height ≥ 1.9 for body-size text); audit removes `truncate`/`line-clamp` + fixed-height combos on translated strings. Overflow is resolved by the strict FR-19 hierarchy: (a) wrap + let the layout grow, (b) reflow — stack / fewer columns / single-column variant, (c) shrink font within the ≥14px accessibility floor, (d) truncate with ellipsis as a last resort on non-translated decorative labels only, never mid-word on Arabic script. Translated sentences that don't fit are a defect, not a trade-off.

**D6 — Validation errors.** farm-form/record-form/detect-upload error messages move onto the existing literal→key map pattern (`ERROR_KEYS` from group 4e); Zod schemas stay put.

**D7 — Auth-adjacent fixes riding along.**
- Site-group login/signup cross-links point to **bare** `/forgot-password` `/reset-password` `/verify` (they're app surfaces under `(farmer)`; kills the `/ur/forgot-password` 404 family).
- Signup success redirects to `/onboarding`; existing-user login keeps PR #16's `/dashboard`.
- Onboarding rebuilt: registry-driven 8-language grid, pre-selected from cookie, `localStorage["agropioo-language"]` deleted.
- Settings language list derived from registry (no "Soon" flags, no invented codes).
- Every app surface owns a locale-aware `generateMetadata` title.

**D8 — Alignment & responsiveness (FR-13..FR-20).** Four coordinated sweeps on every farmer-app surface:
- **Logical edges only** (FR-16): replace all `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right` utilities on translated surfaces with logical `ms-/me-/ps-/pe-/start-/end-` classes. Grep gate (`grep -E '(ml-|mr-|pl-|pr-|left-|right-|text-left|text-right)' app/\(farmer\)/`) returns zero before merge.
- **Content-sized controls** (FR-15): no fixed-pixel `w-*` on any text-bearing control (buttons, chips, tabs, quick-action tiles). Replace with `min-w-*` + inline padding (`px-4 min-w-11`), so the control grows with the translated label. Touch targets stay ≥44×44px via the existing `h-11 min-h-11` convention.
- **Flexible grids** (FR-14): dashboard card grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with `min-w-0` on children; farms carousel on mobile wraps into additional rows (`flex flex-wrap gap-3`) instead of off-screen horizontal scroll when farm names are long. Cards have no fixed height; no `line-clamp` on translated bodies.
- **Directional icons opt-in** (FR-18): non-directional glyphs (checkmarks, search, logo, numerals, crop-health dots) untouched; directional glyphs (back/forward chevrons, trend arrows, "add record" arrows, progress chevrons) get a `data-flip-rtl` attribute that a single `[dir="rtl"] [data-flip-rtl] { transform: scaleX(-1) }` rule mirrors. A mirrored indicator must never imply the opposite meaning — verified per icon in the AC-18 audit.
- **Mixed-direction isolation** (FR-17): Latin fragments inside RTL sentences are wrapped with the existing `localized()` helper (or inline `<span dir="ltr" lang="en">` where the helper isn't already in scope) so adjacent punctuation, numerals, and RTL words keep correct reading order on advisory cards, alert messages, price rows, and chat transcripts.
- **RTL stress pass** (FR-20, scheduled as T12.5): manual run-through at 320 / 375 / 768 / 1024px with real longest Urdu + Pashto strings from the `translations` table on dashboard, add-farm form, add-record form, settings language list, advisor chat, and farm-detail page — zero horizontal scroll, zero overlapping touch targets, zero clipped Nastaliq glyphs, zero broken alignment.

## Task breakdown (each = one commit, verified)

| # | Task | Verify | Est. keys |
|---|---|---|---|
| T1 | ADR `0004` + `resolveAppLocale()` (+tests) + farmer layout emits lang/dir/fonts from resolved locale + stale-comment fix + localized default metadata | tsc·tests·smoke: cookie `ur` ⇒ `dir=rtl`+fonts, `en` pixel-unchanged | ~2 |
| T2 | Switcher `variant="app"`: current locale passed as prop by server parent (URL parsing is the 404 root cause); same-path reload; `persistChoice` reused | manual smoke all 8 · unit for path logic | 0 |
| T3 | Typography guards + overflow hierarchy: RTL tracking kill-switch, Nastaliq leading tokens, mono digit fallback, login-form eyebrow fix, remove `line-clamp`/`truncate` on translated sentences, replace fixed-height+translate combos with min-height, encode FR-19 overflow order (wrap → reflow → shrink → truncate-last-resort) | grep audits zero remaining violations · visual smoke · no `line-clamp` on translated bodies | 0 |
| T3.5 | `formatRelativeTime(value, locale)` in format.ts (+tests) | vitest green | 0 |
| T4 | Shell + dashboard: `app.shell.*`/`app.dashboard.*` keys seeded in SQL migration via Neon MCP (8 locales); sidebar/tabs/header/dashboard-view/demo-data consume bundles; digits/times via format helpers; dashboard metadata; **D8 logical-property sweep + flexible grid + directional-icon `data-flip-rtl` opt-in + bidi isolation on dashboard mixed-direction rows**; grep gate zero | DB checks · smoke ur dashboard fully RTL · logical-property grep zero · 375px wrap OK | ~115 |
| T5 | Farms suite: list/new/detail/records + farm-form + record-form (D6 error maps) + **D8 flex-wrap farms row (no horizontal scroll on long farm names)** | forms exercise EN+UR error paths · 320px farms row wraps | ~155 |
| T6 | Detect + notifications | smoke both locales | ~50 |
| T7 | Prices + weather: format-helper migration, mixed-direction isolation (FR-17) | digit assertions · smoke | ~80 |
| T8 | Advisor: D3 restructure + matcher per-locale + chat UI + **bidi isolation on chat transcripts** | unit tests: ur trigger → ur reply; unknown → localized fallback | ~40 |
| T9 | Settings + More: registry-derived list (D7), remaining copy | list matches registry exactly | ~40 |
| T10 | Verify/forgot/reset/onboarding: bundles + rebuild onboarding + signup→onboarding redirect + bare-link fixes (D7) | AC-8 flow run-through | ~60 |
| T11 | Full DB verification: counts ((671+N)×8) + SQL spot-checks (coverage test already enforces ×8); no sync script needed | SQL checks + coverage test | — |
| T12 | Gates: tsc/lint/tests/build + automated AC checks (resolution rules, per-locale matching, digit formatting, logical-property grep gate) | all green | — |
| T12.5 | RTL stress pass (FR-20, AC-20/AC-21): Chromium run-through at 320/375/768/1024px with longest Urdu + Pashto strings on dashboard, add-farm, add-record, settings, advisor chat, farm-detail; record results in `specs/dashboard-i18n/verification.md` | zero horiz-scroll · zero overlap · zero clipped Nastaliq · zero broken alignment | — |
| T13 | Manual acceptance run-through (**AC-1..AC-21**) documented in `specs/dashboard-i18n/verification.md`; Chromium cursive inspection (AC-9/AC-21); 320px RTL sweep (AC-12/AC-20); indicator-direction spot-check (AC-18) | checklist signed | — |

Translation keys are seeded via SQL migrations (INSERT statements) applied through
Neon MCP after each catalog-expanding task (missing rows fall back to English, so
partial states never break). Founder edits happen directly in the DB via MCP.

## Risks & contingencies

- **Translation volume is the long pole** (~540 keys × 7). Mitigation: keys seeded
  per task via SQL migrations, translations batched per phase, DB-first approach
  eliminates sync drift risk.
- **Nastaliq clipping + overflow hierarchy** may surface component-level fixes during T12.5/T13 QA beyond planned audits — handled as spec-compliant adjustments per D5 (wrap → reflow → shrink → truncate-last-resort), not scope creep.
- **RTL responsiveness** (D8, FR-13..FR-20): logical-property sweep may miss edge cases in data-heavy views; T12.5 stress pass with real longest strings is the explicit safety net. If any fix breaks English LTR pixel parity (FR-10), the layout regresses before merge.
- **Site regression risk is low**: T1 touches only `(farmer)/layout.tsx`; login/signup/marketing live elsewhere and keep URL-driven behavior.
- **Collaborator overlap**: PRs may land mid-feature; standing constitution rule applies (pull-rebase before every push, their merged intent wins on collision).

## Out of plan (per spec)

Voice, new languages, localized URL segments, real backend/advisory intelligence, dark mode.
