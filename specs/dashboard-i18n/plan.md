# Plan — Farmer-app localization

Basis: `spec.md` v2 (clarified) + `research.md`. This doc owns HOW. Every task ends verified against spec and committed.

## Architecture decisions

**D1 — Route model (cookie-driven, Approach B).** Bare URLs stay. `(farmer)/layout.tsx` resolves locale server-side from the `agro_locale` cookie via a new pure function `resolveAppLocale(value)` (invalid/absent ⇒ `en`), then emits `<html lang/dir>` and attaches Nastaliq + Noto Sans Arabic font variables for non-English locales — mirroring the proven site-layout pattern. No URL changes anywhere. Recorded in `adrs/app-cookie-locale.md`.

**D2 — Dictionary delivery.** Same pipeline as the site: keys authored in `catalog/*.ts` (typed source of truth), synced to Supabase, served via `getDictionary(locale)` with English fallback. Client views receive typed prop bundles from their thin server shells (group-4e `LoginCopy` pattern). New keys live under an `app.*` namespace: `app.shell.*`, `app.dashboard.*`, `app.farms.*`, `app.detect.*`, `app.records.*`, `app.prices.*`, `app.weather.*`, `app.notifications.*`, `app.settings.*`, `app.more.*`, `app.advisor.*`, `app.auth.*` (verify/forgot/reset/onboarding).

**D3 — Advisor data model.** Each canned reply gets per-locale `body` plus per-locale `triggers` lists; matcher checks the active locale's triggers (English triggers always included as floor). Replies move into catalog under `app.advisor.replies.<id>.body|triggers`; demo-data holds only ids/order.

**D4 — Numbers.** All rendering goes through `lib/i18n/format.ts`; every `toLocaleString("en-PK")` and hand-written relative time in app code is replaced. Mono contexts get `"Noto Sans Arabic"` appended to the font fallback chain so Eastern digits resolve consistently (visual QA item, R3).

**D5 — Script-safe typography.** CSS-level guard: inside `[dir="rtl"]`, `letter-spacing` is forced to normal (covers ~60 farmer instances + the 2 shipped login-form eyebrow violations without touching each file). Nastaliq leading tokens (`[lang="ur"]` line-height ≥ 1.9 for body-size text); audit removes `truncate`/`line-clamp` + fixed-height combos on translated strings (R2).

**D6 — Validation errors.** farm-form/record-form/detect-upload error messages move onto the existing literal→key map pattern (`ERROR_KEYS` from group 4e); Zod schemas stay put.

**D7 — Auth-adjacent fixes riding along.**
- Login/signup cross-links point to **bare** `/forgot-password` `/reset-password` `/verify` (they're app surfaces now; kills the `/ur/forgot-password` 404 family).
- Signup success redirects to `/onboarding`; existing-user login keeps PR #16's `/dashboard`.
- Onboarding rebuilt: registry-driven 8-language grid, pre-selected from cookie, `localStorage["agropioo-language"]` deleted.
- Settings language list derived from registry (no "Soon" flags, no invented codes).

## Task breakdown (each = one commit, verified)

| # | Task | Verify | Est. keys |
|---|---|---|---|
| T1 | ADR + `resolveAppLocale()` (+tests) + farmer layout emits lang/dir/fonts from resolved locale | tsc·tests·smoke: cookie `ur` ⇒ `dir=rtl`+fonts, `en` pixel-unchanged | 0 |
| T2 | In-place app switcher (cookie write + reload same path; dropdown works, no 404) | manual smoke all 8 · unit for path logic | 0 |
| T3 | Typography guards: RTL tracking kill-switch, Nastaliq leading tokens, mono digit fallback, login-form eyebrow fix | grep audits zero remaining violations · visual smoke | 0 |
| T4 | Shell + dashboard: `app.shell.*`/`app.dashboard.*` EN authoring + 7 translations; sidebar/tabs/header/dashboard-view/demo-data consume bundles; digits via format helpers | catalog tests · smoke ur dashboard fully RTL | ~115 |
| T5 | Farms suite: list/new/detail/records + farm-form + record-form (D6 error maps) | forms exercise EN+UR error paths | ~155 |
| T6 | Detect + notifications | smoke both locales | ~50 |
| T7 | Prices + weather: format-helper migration, mixed-direction isolation (FR-14) | digit assertions · smoke | ~80 |
| T8 | Advisor: D3 restructure + matcher per-locale + chat UI | unit tests: ur trigger → ur reply; unknown → localized fallback | ~40 |
| T9 | Settings + More: registry-derived list (D7), remaining copy | list matches registry exactly | ~40 |
| T10 | Verify/forgot/reset/onboarding: bundles + rebuild onboarding + signup→onboarding redirect + bare-link fixes (D7) | AC-8 flow run-through | ~60 |
| T11 | Full DB sync + counts ((671+N)×8) + MD5 spot-verification | sync script output + SQL checks | — |
| T12 | Gates: tsc/lint/tests/build + automated AC-11 checks (resolution rules, per-locale matching, digit formatting) | all green | — |
| T13 | Manual acceptance run-through (AC 1–10) documented in `specs/dashboard-i18n/verification.md`; Chromium cursive inspection; 320px RTL sweep | checklist signed | — |

Sync runs incrementally after each catalog-expanding task (missing rows fall back to English, so partial states never break).

## Risks & contingencies

- **Translation volume is the long pole** (~540 keys × 7). Mitigation: EN authored per task, translations batched per phase, sync incremental.
- **Nastaliq clipping** may surface component-level fixes during T13 QA beyond planned audits — handled as spec-compliant adjustments, not scope creep.
- **Collaborator overlap**: PRs may land mid-feature; standing constitution rule applies (pull-rebase first, their merged intent wins on collision).

## Out of plan (per spec)

Voice, new languages, localized URL segments, real backend/advisory intelligence, dark mode.
