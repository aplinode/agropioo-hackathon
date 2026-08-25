# Research — Farmer-app localization (dashboard & friends)

Status: findings only. No design, no decisions — those happen in `spec.md` after founder review.
Scope question this research answers: what exists, what breaks, what the realistic approaches are.

---

## 1. How i18n works today (site side — the system to inherit)

**Pipeline** (all working, verified in groups 4d/4e):

1. `catalog/{en,ur,pa,ps,sd,skr,bal,hno}.ts` — typed authoring source of truth. **671 keys × 8 locales = 5368 values.**
2. `scripts/sync-translations.mts` upserts catalog → Supabase `public.translations` (unique `(key, locale)`), MD5-verified.
3. Runtime: `lib/i18n/server.ts` `getDictionary(locale)` reads DB rows (`status='translated'`) **overlaid on** the build-time catalog; missing/empty → English fallback; per-request dedupe via React `cache()`; layouts are `force-dynamic` so founder SQL edits land next request.
4. Locale resolution for site pages: **URL only** (`next/root-params`). Proxy (`proxy.ts`, K1): bare paths rewrite internally to `/en/*`; `/{slug}/*` passes through; no cookies/headers involved (FR-4). English has **no slug** (`urlSlug: ""`), so `/en/*` is not a real URL family.
5. `<html lang>` + `dir` + fonts: each route group owns its own `<html>`. `(site)/[locale]/layout.tsx` emits registry pair and attaches Nastaliq + Noto Sans Arabic font variables **only for non-English locales** (FR-17). Farmer layout hardcodes `lang="en" dir="ltr"` with Latin faces only.
6. Persistence: `LanguageSwitcher` sets `agro_locale=<locale>` cookie (FR-21) on every switch; cookie influences switcher highlight + suggestion-chip suppression only — never what a URL renders. A server-side-readable cookie already exists as a mechanism.
7. Digits/dates: `lib/i18n/format.ts` implements FR-19 (Eastern Arabic-Indic ۰–۹ for the 7 local locales via Intl).
8. Fallback isolation: `localized()` wraps English-fallback segments in `<span lang="en" dir="ltr">` inside RTL pages (FR-12).

## 2. Farmer-app inventory

38 files under `app/(farmer)/`. Structure: thin server page shells + `"use client"` view components + typed demo-data modules.

| Surface | Files | Notes |
|---|---|---|
| Shell | `(dashboard)/layout.tsx`, `app-sidebar.tsx`, `bottom-tab-bar.tsx` | Auth choke point (`requireSessionPage()`); nav labels hardcoded ("Dashboard", "Farms", … "Sign out", "Built for Pakistan") |
| Dashboard | `page.tsx`, `dashboard-view.tsx` (648), `demo-data.ts` (135) | Heaviest screen; greeting, advisory, weather, alerts, quick actions, checklist, detect CTA |
| Advisor / Detect / Notifications / Prices / Weather / More / Settings / Farms(+new,+detail,+records) / Records-new | ~20 more files | Client forms (farm-form 224, record-form 249, detect-upload 250, advisor-chat 169) all hardcoded English |
| Auth-adjacent | `onboarding/page.tsx` (59), `verify/` , `forgot-password/`, `reset-password/` | See defects below |

Scale: pattern-based grep (quoted sentences, JSX text nodes ≥5 chars, aria-labels, placeholders) finds **~305 English-bearing strings** across views/shell/demo-data, plus **~570 lines of typed demo content** (`demoFarmer`, `demoAdvisory`, alerts, farm names/crops/stages, chat transcripts). Heaviest files: dashboard demo-data 31, reset-password-form 23, weather demo-data 22, farms demo-data 21. Demo content is *product-shaped text* farmers will read (advice sentences, alert messages) — deciding its fate is a core spec question.

Additional inventory facts:

- **Numbers/dates bypass FR-19 inside the app:** `prices/page.tsx` and demo-data use `toLocaleString("en-PK")` directly instead of `lib/i18n/format.ts`; relative times are hand-written ("2 hours ago"); SVG trend charts get aria-labels from English templates.
- **Advisor replies are keyword-matched canned responses keyed on English words** (`demo-data.ts` matches "water", "wheat", …) — translation breaks the matcher regardless of which language the user types in.
- **farm-form.tsx hand-rolls validation with inline English error strings** (no Zod, no `ERROR_KEYS` map) — divergent from the auth-forms pattern that already localizes cleanly.
- **Truncation/clipping hazards:** 7 uses of `truncate`/`line-clamp` plus fixed-height chips/badges across the app (see §7 Nastaliq risks).
- **~60 `uppercase tracking-[0.05–0.25em]` instances across ~17 farmer files** — see §6 letter-spacing risk.

Architecture constraints that carry over from login/signup work:
- Views are client components → dictionaries must cross the RSC boundary as **typed prop bundles** (the `LoginCopy` pattern), or views stay server-rendered where possible.
- Zod validation lives in route handlers/lib with English literals; forms translate via literal→key maps (`ERROR_KEYS` pattern from group 4e).
- FR-13 (dashboard spec): logical CSS properties already used throughout (`start/end` classes seen) — RTL mirroring groundwork exists but untested.

## 3. Discovered defects & conflicts (collaborator PRs #15/#16, merged)

These exist on `main` today and any localization work collides with them:

1. **Dashboard language dropdown is functional-looking but 404s.** PR #16 dropped `LanguageSwitcher` into `dashboard-view.tsx`. It navigates to `/ur/dashboard`, `/pa/dashboard`, … Those routes don't exist; the proxy matcher *excludes* farmer paths from rewriting, and the request lands in the site's `[locale]/[...rest]` catch-all → localized 404 page. Switching language from the dashboard currently destroys the session's page.
2. **New `/onboarding` page is unreachable and off-spec.** PR #16 changed `decideLoginRedirect()` → `/dashboard`, so nothing links to `/onboarding` anymore (dead route). Independently it: invents its own language list with **wrong codes** (`sk` instead of `skr`, `hi` instead of `hno`), renders Punjabi in **Gurmukhi** (ਪੰਜਾਬੀ) violating the Pakistan-first Shahmukhi policy, misspells native names vs the registry (سنڌي/سرائیکی/ہندکو), persists to a third mechanism (`localStorage["agropioo-language"]`), never applies the choice, and ignores the constitution rule "language chosen during signup carries into onboarding as pre-selected default".
3. **Settings shows a stale, wrong language list.** `settings-view.tsx` marks Urdu/Punjabi/Pashto/Sindhi "Soon" (false — all 8 languages shipped site-side) and omits Saraiki/Balochi/Hindko entirely. Fourth divergent language surface (registry, switcher, onboarding, settings).
4. **Pre-existing broken link:** localized logins link `/ur/forgot-password` etc., but forgot/reset/verify live only at bare URLs under `(farmer)/` → site catch-all → localized 404. Language-compat spec FR-3 anticipated this ("forgot/reset when they exist") — they now exist and are unreachable in 7 locales.

5. **Shipped-site defect (pre-dates PRs):** `login-form.tsx:135,181` render Urdu eyebrow labels (`font-mono uppercase tracking-[0.18–0.22em]`) — letter-spacing on Arabic-script text is a cursive-joining hazard (§6) and `uppercase` is a no-op that signals the styling was designed Latin-only. Same pattern exists ~60× across farmer files.

## 4. Approach space for locale resolution inside the app

**A. URL-prefix parity** — farmer routes move under a `[locale]` segment (`/ur/dashboard`, bare = en via proxy rewrite, matcher updated).
+ One mental model everywhere; shareable/bookmarkable localized URLs; switcher works unchanged; SSR locale from URL; extends FR-3..FR-6 naturally.
− Largest restructure (every route file moves/wraps); proxy matcher + guard redirects need care; unusual for an authenticated app; most churn right before a demo.

**B. Cookie-driven, single route set** — keep bare URLs; `(farmer)` layout reads `agro_locale` server-side → `getDictionary(locale)` → emits matching `<html lang/dir/fonts>`; invalid/absent cookie ⇒ `en`.
+ Smallest diff; reuses existing cookie mechanism (FR-21 explicitly reserves server-side readability); matches collaborator's direction (their switcher already writes the cookie + full-reloads, which correctly re-renders `<html>`); force-dynamic already set.
− Two models (marketing=URL, app=cookie); shared links don't carry language; cookie tampering just yields fallback-to-en (harmless); deviates from strict "URL decides" inside the app — needs explicit founder sign-off as an amendment.

**C. Fix-the-lies-only now, translate later** — make the dropdown honest (disabled placeholder again or hidden until B ships), fix onboarding codes/script/persistence, unify settings list to the registry; defer actual translation.
+ Tiny; removes user-facing breakage before demo.
− Leaves constitution's "switcher visible inside the farmer app" unmet; localization momentum lost.

Any approach still needs these sub-decisions:
- **Demo content strategy:** translate mock content through the catalog (~200–300 new keys × 8 ≈ 1600–2400 rows) vs localize chrome/UI only and keep advisory/alert bodies English (fallback-wrapped per FR-12). Cost/realism trade-off.
- **Digits, dates, relative times** through `format.ts` everywhere data renders.
- **RTL audit** of shell + heaviest screens at 320px with longest real strings (edge case in lang-compat spec).
- **Auth interplay:** guards redirect to bare `/login`; verify/forgot/reset surfaces and whether they enter scope; post-login redirect carrying language intent.
- **Onboarding:** dead route today — delete, wire as post-signup step consuming `agro_locale` pre-selection (constitution), or leave out of scope explicitly.

## 5. Industry patterns (web research)

How established i18n frameworks handle authenticated apps:

- **next-intl documents cookie-based locale without URL prefixes as a first-class mode** ("without i18n routing"): `getRequestConfig` reads `cookies()`, no `[locale]` segment exists. Its docs explicitly recommend this when URLs don't need to carry language.
- **`localePrefix: 'never'` was created for exactly our case.** Maintainer on GitHub (#366): *"for large applications with almost everything behind authentication … SEO is not a concern … there's an opportunity for `localePrefix: 'never'`, where you always use the cookie value."*
- **The hybrid we already have is a mainstream pattern:** next-intl's official examples list includes *"Locale prefixes on public routes with a login to a protected app"* (app-router-saas) — public marketing pages keep URL prefixes; the logged-in area switches via user preference.
- **Resolution-order convention** across frameworks: explicit URL prefix > user preference (cookie/profile) > `Accept-Language` header > default. Our site does URL-only today; an app-side cookie slot is consistent with convention, not an invention.
- **Known caveat:** changing locale by cookie without a URL change means cached output can leak between locales — mitigated by full-page reload on switch (already implemented in `LanguageSwitcher`) plus `force-dynamic` layouts (already set).

Implication: Approach B (cookie-driven app + URL-driven marketing) is the pattern specialized tools converged on for this exact shape of application, not a hack.

## 6. Technical risk register

**R1 — Letter-spacing breaks Arabic-script cursive joining (high confidence, browser-inconsistent).**
CSS Text spec: spacing must not be applied to *cursive scripts* if it breaks connections; Firefox honors this, Chromium still applies gaps between joined letters (open bug 40618336). W3C i18n issue I18N-ISSUE-354 tracks the problem. Practical rule used by Arabic-script design systems: **no `letter-spacing` on Arabic-script text, ever** — behavior differs per browser so we cannot rely on UA correctness. Consequence for us: every `uppercase tracking-*` label needs conditional neutralization for RTL locales (~60 farmer instances + 2 shipped login-form instances). `uppercase` itself is harmless for Arabic (no case) but should ride along for consistency.

**R2 — Noto Nastaliq Urdu has unbounded vertical metrics (high confidence).**
Google Fonts maintainers confirm Nastaliq line boxes can grow beyond any fixed metric ("text set in Nastaliq style can grow to have a potentially unbounded line height… any clipping will cause problems"). Field reports (Android/web): excessive vertical space, glyphs sitting low in containers, clipping under fixed heights, unexpected wraps. W3C Urdu Layout Requirements (`w3.org/TR/arab-ur-lreq`) flags ascenders/descenders extending far beyond Latin. Consequence: the dashboard's 7 `truncate`/`line-clamp` uses and fixed-height chips/badges are systematic clipping hazards under Urdu; spec must mandate generous line-height for Nastaliq text, no fixed-height+truncate combos on translated strings, and device-level visual QA.

**R3 — Mono fonts lack Arabic-Indic glyphs (medium confidence, verify visually).**
Geist Mono covers Latin/Cyrillic/Greek only. Localized numerals (۰–۹ per FR-19) inside `font-mono` data contexts fall back to whatever system font resolves — inconsistent weight/baseline in dense tables. Options to weigh in plan: Western digits inside mono data cells regardless of locale (common practice), or an Arabic-capable fallback chain. Needs a deliberate decision either way.

**R4 — Mixed-direction rows (known pattern, low novelty).**
Localized prices page renders Urdu crop names beside numbers/currency. Existing precedent (`item.urduName` inline, FR-12 `localized()` wrapper) works; risk is forgetting isolation on new surfaces. Mechanical audit item.

**R5 — Demo-data keyword matcher breaks under translation (advisor).**
Canned replies match English keywords; localized UI around an English-only brain reads as broken. Either translate reply bodies too (then matching needs language-aware keywords) or scope advisor out explicitly for v1.

**R6 — Form validation divergence (farm-form).**
Inline English errors vs auth-forms' Zod+`ERROR_KEYS` translation path. Localization work should migrate farm-form/record-form/detect-upload errors onto the existing pattern rather than invent a second one.

## 7. Sizing estimate

| Slice | New catalog keys (est.) |
|---|---|
| Shell (sidebar, tabs, headers, sign-out) | ~25 |
| Dashboard screen incl. demo content | ~90 |
| Farms (list/new/detail/records/form) | ~110 |
| Records-new form | ~45 |
| Detect | ~50 |
| Prices / Weather / Notifications / Settings / More | ~130 |
| Advisor (if in scope) | ~40 |
| Forgot/reset/verify/onboarding fixes | ~55 |
| **Total** | **~450–550 keys × 8 locales ≈ 3600–4400 new DB rows** |

Translation authoring is the long pole; sync + verification tooling from groups 4d/4e is reusable as-is.

## 8. Open questions for clarify phase (preview, not exhaustive)

1. Which surfaces are in scope for v1: dashboard only? whole `((dashboard))` group? onboarding? forgot/reset/verify?
2. URL model: is B's cookie-driven deviation acceptable as a constitution amendment?
3. Demo content: translate everything farmers read, or UI-chrome first?
4. What happens to the collaborator's dropdown/onboarding/settings code — build on, replace, or revert?
5. Does switching language inside the app need to preserve form input (current full-reload loses it)?
6. Digits policy inside `font-mono` data cells (R3): Western digits everywhere in data contexts vs Arabic-Indic with fallback chain?
7. Advisor in or out of v1 scope given the keyword-matcher problem (R5)?
