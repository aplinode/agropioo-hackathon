# Research — Platform localization & RTL (i18n/rtl)

> Status: MERGED 2026-08-30 from two research documents:
> `archive/language-compatibility/research.md` (marketing + auth; **SHIPPED**) and
> `archive/dashboard-i18n/research.md` (farmer app; **PENDING**).
> Findings only — decisions live in `spec.md`, HOW in `plan.md`. Facts below were
> re-verified against the codebase on the merge date; where the shipped code has
> drifted from a prior finding, the drift is called out.

## 1. Ruled decisions so far (founder interviews)

| # | Question | Decision | Source |
|---|---|---|---|
| D1 | Launch languages | **All 8 fully translated**: en + ur, pa, ps, sd, skr, bal, hno | lang-compat |
| D2 | Locale in URL | **Hybrid**: marketing + auth pages get `/{locale}` prefixes; app is cookie-driven | lang-compat |
| D3 | Surfaces in scope | Public marketing + signup/login (+forgot/reset/verify when built) + onboarding shell | lang-compat |
| D4 | Translation copy | AI-drafted agricultural copy, founder reviews diffs | lang-compat |
| D5 | Orphaned components | 11 unimported components frozen in place (dead code), not deleted | lang-compat |
| D6 | Farmer rollout | **Whole farmer app ships in one release** — no phased, partial screens | dashboard-i18n |
| — | Voice input/output | Out of scope (constitution) | both |

## 2. The shipped system (site + auth; verified 2026-08-30)

1. **Registry** — `lib/i18n/config.ts`: `LOCALES` (8), `LOCALE_REGISTRY` (identity triple
   `urlSlug`/`htmlLang`/`dir` + native/English names + `hreflang`), `DEFAULT_LOCALE`,
   `APP_LOCALE_COOKIE = "agro_locale"`, pure guards. This is the single source a
   `<html lang dir>` pair is derived from.
2. **Routing (hybrid)** — `proxy.ts` (Next-16 middleware replacement) rewrites bare
   paths internally to `/en/*` (URL never changes); real `/{slug}/...` prefixes pass
   through; farmer paths are excluded from rewriting. Site pages live under
   `app/(site)/[locale]/...`; unknown slugs fall to the localized catch-all 404.
3. **String source — EVOLVED FROM THE ORIGINAL SPEC** — typed catalog trees
   `catalog/*.ts` (English `en.ts` is the full source; 7 mirrors) + test
   `catalog/catalog.test.ts` + `scripts/sync-translations.mts` which upserts rows into
   Neon `translations`. *(Original lang-compat spec/plan mandated "no catalog files —
   DB is the only source of truth"; implementation and AGENTS.md moved to the
   catalog+sync model. See `spec.md` conflict **C1**.)*
4. **Runtime loader** — `lib/i18n/server.ts` `getDictionary(locale)`: React `cache()`
   dedupe, English fallback per-key, typed prop bundles for client views
   (`getShellBundle`, `getDashboardBundle`, `getFarmsBundle`, `getAdvisorBundle`,
   `getDetectBundle`, `siteHeaderStrings`). `lib/i18n/resolve.ts` serves the fast
   site path; `lib/i18n/logic.ts` is the pure shared core (`resolveAppLocale`,
   `splitLocalePrefix`, `localeHref`, `switchedPathname`, `resolveString`,
   `formatMessage`) used by server, proxy, and switcher.
5. **Farmer locale (cookie-driven)** — ADR `0004-app-cookie-locale.md`; farmer layout
   resolves `agro_locale` → `lang`/`dir`/metadata and is `force-dynamic`. Switcher
   (`components/language-switcher.tsx`) gained app mode via a `currentLocale` prop and
   same-path reload — fixing the collaborator PR's 404-on-switch.
6. **Formatting** — `lib/i18n/format.ts`: `formatNumber`, `formatCount`,
   `formatRelativeTime` (Eastern Arabic-Indic ۰–۹ for the 7 locales via Intl).
   `lib/i18n/localized.tsx` wraps English fallbacks and Latin fragments in
   `lang="en" dir="ltr"` so bidi stays intact.
7. **Testing** — `lib/i18n/logic.test.ts`, `lib/i18n/format.test.ts`, `catalog.test.ts`
   cover registry agreement, fallback resolution, digits, relative-time, path parsing.
8. **Fonts — KNOWN DEVIATION** — the root `app/layout.tsx` registers all five font
   variables (Playfair, DM Sans, Geist Mono, Noto Nastaliq Urdu, Noto Sans Arabic)
   unconditionally, so English pages do transfer Arabic-script bytes. The letter of
   lang-compat FR-17 ("load only when serving those locales") is not met as shipped.
   See `spec.md` conflict **C4**.

## 3. Farmer-app inventory (the pending scope)

38 files under `app/(farmer)/`: thin server shells + `"use client"` views + typed
demo-data modules. Main surfaces: shell (sidebar/tabs/`Sign out`/"Built for Pakistan"),
dashboard (greeting, advisory, weather, alerts, quick actions, checklist, detect CTA),
farms (list/new/detail/records + farm-form + record-form), advisor, detect,
notifications, prices, weather, settings, more, plus auth-adjacent
onboarding/verify/forgot/reset.

Scale: **~305 English-bearing strings** across views/shell/demo-data plus **~570 lines
of typed demo content** (advisories, alerts, farm names/crops/stages, chat
transcripts). Demo content is product-shaped text farmers read — dashboard-i18n
resolved it as in-scope (D6, spec FR-2).

Key machinery facts for translation work:
- Numbers/dates bypass `format.ts` inside the app (`toLocaleString("en-PK")`,
  hand-written relative times, English SVG chart aria-labels).
- Advisor replies are keyword-matched canned responses keyed on English trigger words.
- `farm-form.tsx` hand-rolls validation with inline English errors (no Zod /
  `ERROR_KEYS` map) — divergent from the auth-forms pattern that localizes cleanly.
- ~60 `uppercase tracking-*` instances across ~17 farmer files + 2 shipped login-form
  eyebrow labels — cursive-joining hazard in Chromium (R1 below).
- 7 uses of `truncate`/`line-clamp` + fixed-height chips/badges — Nastaliq clipping
  hazards (R2 below).
- Client views need typed prop bundles across the RSC boundary (the `LoginCopy` →
  `*Bundle` pattern already shipped in `lib/i18n/server.ts`).

## 4. Discovered defects on main (status as of merge)

| # | Defect | Status |
|---|---|---|
| 1 | Dashboard language dropdown 404s (`/ur/dashboard` doesn't exist) | **RESOLVED** — app-mode switcher (same-path cookie reload) |
| 2 | `/onboarding` unreachable (post-login redirect → `/dashboard`); wrong codes (`sk`/`hi`), Gurmukhi Punjabi, misspelled native names, third persistence mechanism (`localStorage["agropioo-language"]`), never applies the choice, ignores signup-language pre-selection | STILL PRESENT (verified: `sk`/`hi` codes + localStorage) |
| 3 | Settings language list stale: marks ur/pa/ps/sd "Soon", omits skr/bal/hno | STILL PRESENT (verified) |
| 4 | Localized logins link `/ur/forgot-password` etc. → lands in site catch-all → localized 404 | STILL PRESENT — plan D7 fixes via bare cross-links (see conflict C2) |
| 5 | login-form Urdu eyebrows with `tracking-*` letter-spacing | STILL PRESENT — T3 |
| 6 | Root layout registers Arabic fonts for English too (FR-17 lazy-load) | KNOWN DEVIATION — conflict C4 |

## 5. Approach space for app locale resolution (farmer)

**A. URL-prefix parity** (`/ur/dashboard`) — one model everywhere; shareable URLs.
− Largest restructure; unusual for an authenticated app; most churn pre-demo.

**B. Cookie-driven, single route set (CHOSEN)** — bare URLs stay; `(farmer)` layout
resolves the cookie server-side → `lang/dir/fonts/strings`. − Two mental models
(marketing = URL, app = preference), documented in both layouts. Consistent with
industry: next-intl documents cookie-only locale as first-class (`localePrefix:
'never'`), created precisely for "large applications with almost everything behind
authentication" — our hybrid shape is next-intl's official "public URLs prefixed, app
via preference" example. Recorded in ADR 0004.

**C. Fix-the-lies-only** — honest dropdown + onboarding/settings fixes, defer
translation. Rejected under D6 (whole app ships localized).

## 6. Technical risk register

- **R1 — Letter-spacing breaks Arabic-script cursive joining** (Chromium applies
  gaps, Firefox doesn't). Rule: no `letter-spacing` on Arabic-script text, ever.
  Mitigation: `[dir="rtl"] { letter-spacing: normal !important }` kill-switch rather
  than 60+ file edits.
- **R2 — Noto Nastaliq Urdu has unbounded vertical metrics.** Line boxes grow beyond
  any fixed height; clipping guaranteed under fixed-height + truncated containers.
  Mandate generous line-height (≥1.9 body), `min-height` not `height`, no
  `line-clamp`/`truncate` on translated sentences.
- **R3 — Mono fonts lack Arabic-Indic glyphs** (Geist Mono is Latin-only). Localized
  digits inside `font-mono` data cells fall back to system fonts → inconsistent
  baselines. Options: append `Noto Sans Arabic` to the mono chain, or tolerate Western
  digits in mono cells. See conflict **C3**.
- **R4 — Mixed-direction rows** in price rows / advisory cards / chat — solved by the
  `localized()` wrapper; mechanical audit item.
- **R5 — Advisor keyword matcher breaks under translation.** Per-locale triggers +
  EN floor (plan D3). Unit-testable.
- **R6 — Form validation divergence** (farm-form). Migrate onto Zod + `ERROR_KEYS`.

## 7. Sizing estimate (pending farmer work)

Approx **~450–550 new keys × 8 locales ≈ 3,600–4,400 new DB rows** across
shell(~25) / dashboard(~90) / farms(~110) / records(~45) / detect(~50) / prices,
weather, notifications, settings, more(~130) / advisor(~40) / auth-adjacent(~55).
Translation authoring is the long pole; verification tooling from the shipped site
work is reusable as-is.

## 8. Open items

- Conflicts **C1–C4** (catalog source of truth, auth-adjacent route model, mono
  digits, lazy fonts) — pending founder ruling in `spec.md`.
- Per-surface completion status for farm-app translation (which bundles are consumed
  where) to be confirmed on the resumption of work (see `plan.md` statuses).