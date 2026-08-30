# Spec — Platform localization & RTL (i18n / rtl)

> Status: **MERGED 2026-08-30** from `specs/i18n-rtl/` sources. Supersedes the two
> archived specs: marketing + auth part is **SHIPPED**; farmer-app part is
> **PENDING** (scope ruling: whole farmer app ships in one release). The four
> conflicts the merge surfaced were ruled by the founder on 2026-08-30 (see
> §Conflict rulings); the merged wording below already reflects them. Tag `[S]` =
> shipped behaviour to preserve, `[P]` = pending build.

## Goal

Every user of Agropioo — a visitor on the public site, someone signing up, or a
farmer inside the logged-in app — can read, navigate, and act in any of the eight
constitutional languages (English plus Urdu, Punjabi–Shahmukhi, Pashto, Sindhi,
Saraiki, Balochi, Hindko), with correct right-to-left presentation, culturally
authentic typography, and no clipped or scrambled script. A farmer who reads only
Saraiki can use the entire product in Saraiki, from landing page to a localized
advisor reply.

## User scenarios

1. A visitor on `/` opens the header switcher and picks **اردو** — the page becomes
   `/ur`, fully mirrored RTL, every string in Urdu, headings in Nastaliq style.
2. An Urdu-reading farmer on `/ur/features` clicks "Sign in" → `/ur/login`, still in
   Urdu including form labels and errors.
3. A Pashto speaker types `/ps/signup` directly — full signup page in Pashto, no
   redirects.
4. First visit with no stored choice shows a dismissible **اردو میں دیکھیں** chip;
   dismissing it keeps it dismissed.
5. A user on `/skr/why-agropioo` picks English → `/why-agropioo`, same path, context
   preserved.
6. `/login` (no prefix) with `agro_locale=ur` still renders English (URLs decide on
   public pages); the switcher highlights اردو.
7. [P] A Punjabi farmer signs in, switches to پنجابی in the sidebar — the whole app
   re-renders RTL in Punjabi (greeting, advisories, prices in Eastern digits, errors
   in Punjabi), stays chosen across sessions, and they keep the screen they were on.
8. [P] A Pashto-speaking farmer requests a password reset from a localized login —
   the reset form speaks Pashto, not English.
9. [P] An Urdu farmer asks the advisor a question using Urdu keywords — the canned
   reply comes back in Urdu, not the English fallback.

## Functional requirements

**Languages & registry**
- FR-01 [S] Exactly eight UI languages: English (default) plus ur, pa (Shahmukhi),
  ps, sd, skr, bal, hno. Each has one identity triple: URL slug (English = none),
  `lang` tag (`pa-Arab` for Punjabi), direction (RTL for the seven, LTR for English).
  *(merged from L1, D9)*
- FR-02 [S] Every page emits `<html lang>` and `dir` from the single registry, never
  independent logic; the pair always agrees (`pa-Arab` ⇒ `rtl`). Unit-tested.
  *(L2)*
- FR-03 [S] The registry is also the only source for language lists: any surface
  listing languages (switcher, settings, onboarding) shows exactly the eight with
  correct native names/scripts — no "coming soon" flags for shipped languages, no
  invented codes. *(L8 + D22)*

**Routing (hybrid, two resolution contexts)**
- FR-04 [S] Public marketing + auth pages exist in eight locale variants under
  `/{slug}/…`, directly linkable, crawlable, refresh-safe. English is the bare URL
  (no slug). *(L3)*
- FR-05 [S] Unprefixed paths always render English (URL decides on public pages);
  cookies, headers, and IP never redirect anyone anywhere. *(L4)*
- FR-06 [S] An unknown locale prefix returns a real 404 — never a redirect, never an
  English page masquerading. *(L5)*
- FR-07 [S] Switching language lands on the same page in the target language: same
  path re-slugged, same query, same hash — never home. *(L6)*
- FR-08 [P] Farmer-app screens always render the persisted preference; a localized
  public URL visited before sign-in never forces the app's language afterward.
  *(D8 — ADR 0004)*
- FR-09 [S] Public-page URLs a farmer can type or share are unchanged by app
  localization. *(D7)*
- FR-10 [S/P] Auth-adjacent surfaces (forgot/reset/verify) are included in the
  localized experience: public pages that link into them seed the cookie with their
  URL language before navigating, so the reset flow speaks the selected language
  end-to-end. *(ruled C2)*

**Switcher**
- FR-10 [S] A language switcher is visible on every in-scope page: site header on
  public pages (desktop dropdown + mobile sheet item), corner control on auth pages,
  and nav/sidebar on every farmer-app screen. *(L7 + D3)*
- FR-11 [S] Options show native names in their own script with own `lang`; active is
  marked; ≥44×44px targets; keyboard operable; Escape closes. *(L8)*
- FR-12 [S] The control is disabled while a switch is in flight (no double-taps) and
  on the app side switching re-renders on the spot (same path, full reload). *(L9 +
  D3)*

**Translations & database**
- FR-13 [S] Every user-visible string on translated surfaces — headings, body,
  buttons, labels, placeholders, validation messages, aria-labels, alt text,
  `<title>`/description, demo snippets — comes from the Neon `translations` table
  (single runtime source of truth, no parallel hardcoded copy). *(L10/D1)*
- FR-14 [S] Typed catalog files (`catalog/*.ts`, English the full source + 7
  mirrors) are the developable source of keys; they feed the Neon table via
  `scripts/sync-translations.mts` or the Neon MCP, and `catalog.test.ts` gates
  ×8 coverage before merge. *(ruled C1 — supersedes the archived "no catalog
  files" wording)*
- FR-15 [S] A key holds at most one value per language (rejects duplicates);
  missing OR empty values are equivalent (missing). *(L11-part, edge)*
- FR-16 [S] Missing/empty values render the English value wrapped with own
  `lang`/`dir` so it reads as English and never corrupts surrounding bidi; raw keys
  are never shown; missing segments are never silently hidden. *(L12)*
- FR-17 [S] Coverage is measurable — per-language fallback lists exist
  (`catalog.test.ts`, DB `status` column) even with no admin UI. *(L13)*

**Right-to-left presentation**
- FR-18 [S] In RTL, the whole layout mirrors (order, alignment, spacing sides,
  directional icons); non-directional imagery (logo, photos, checkmarks, search,
  numerals, crop-health dots) does not. *(L14)*
- FR-19 [S] Mixed-direction content inside RTL — prices, phones, Latin tokens
  ("Agropioo", "NDVI"), dates — reads correctly with adjacent punctuation on the
  right side. *(L15)*
- FR-20 [S] Free-text inputs auto-detect typed direction; email/password/phone stay
  LTR even on RTL pages. *(L16)*
- FR-21 [P] RTL mirrors farmer-app layout end-to-end: sidebar/tab-bar side, grid
  flow, carousel scroll, row order, icon orientation, progress/checklist indicators,
  form alignment. English LTR rendering stays pixel-identical to today.
  *(D10)*
- FR-22 [P] Directional indicators flip with meaning: trend-up still means
  improving, progress still advances, a mirrored arrow never implies the opposite.
  *(D18)*

**Typography & digits**
- FR-23 [S] All five webfonts (Playfair, DM Sans, Geist Mono, Noto Nastaliq Urdu,
  Noto Sans Arabic) are registered at the root layout and served on every page —
  including English. Accepted as shipped. *(ruled C4)*
- FR-24 [S] Arabic-script locales present Nastaliq-style faces for display/headings
  and a clearer Arabic-script face for UI/data; the script never gets
  letter-spacing, italics, or uppercase transforms. *(L17/L18/D11)*
- FR-25 [S] Arabic-script text never clips: Nastaliq line-height ≥1.9 at body size,
  `min-height` containers (never fixed heights + truncate on translated text), ≥16px
  body, ≥14px effective minimum in tight spots, no `overflow-wrap: anywhere` or
  mid-word breaks on joined script. *(L18/D19)*
- FR-26 [S] Numerals render per locale: Eastern Arabic-Indic (۰–۹) for the seven
  local languages, Western for English — for prices, counts, dates, areas, relative
  times, phone displays — via one formatting behavior with locale-appropriate
  separators. In `font-mono` data cells the Eastern digits resolve via a `Noto Sans
  Arabic` fallback on the mono chain, so tables agree with the UI. *(L19/D9; ruled
  C3)*

**First-visit suggestion**
- FR-27 [S] With no stored choice, one dismissible chip may offer
  اردو میں دیکھیں linking to the Urdu equivalent of the current page; dismissal
  persists; it never blocks content. *(L20)*

**Persistence**
- FR-28 [S/P] Last explicit choice persists in a server-readable cookie
  (`agro_locale`). On public pages it influences only switcher highlight, chip
  suppression, and future onboarding pre-selection — never what a URL renders. Inside
  the farmer app it is the display-language source. Absent/unknown/corrupt value ⇒
  English silently. When a public page links into auth-adjacent app surfaces
  (forgot/reset/verify) it seeds the cookie with its own URL language, so the reset
  flow speaks the selected language end-to-end. *(L21/D4/D6/D7; ruled C2)*

**SEO**
- FR-29 [S] Every locale variant self-canonicalizes; reciprocal hreflang cluster
  among en/ur/ps/sd only; `x-default` → English home; pa/skr/bal/hno get correct
  `lang`, canonical, sitemap but no hreflang. *(L22)*
- FR-30 [S] Localized metadata (title/description) on every prefixed page; localized
  pages in the sitemap; the app's seedling metadata is locale-aware once translated.
  *(L23/D7)*

**Farmer-app surface coverage**
- FR-31 [P] Full-surface coverage: every farmer screen renders all farmer-visible
  text in the active language — nav, labels, empty states, placeholders,
  confirmations, tooltips, metadata, aria-labels — and demo/sample content farmers
  read (advisories, alerts, weather, farm data, price entries, chat) counts as text.
  *(D1/D2)*
- FR-32 [P] Form feedback (farm/record/detect validation and errors) shows in the
  active language. *(D21)*
- FR-33 [P] Alignment & responsiveness: translated labels/buttons/chips/badges render
  in full (no truncation/overlap/mid-word breaks) at ≥375px; flexible card grids
  reflow; controls content-size with ≥44px targets; logical `start`/`end` classes
  only on translated surfaces; overflow resolved strictly wrap → reflow → shrink
  (≥14px) → truncate-last-resort on decorative text only. *(D13–D16, D19)*
- FR-34 [P] RTL stress pass: dashboard, add-farm, add-record, settings language list,
  advisor chat, farm-detail verified at 320 / 375 / 768 / 1024px with the longest
  real Urdu and Pashto strings — no horizontal scroll, no overlapping targets, no
  clipped glyphs. *(D20)*
- FR-35 [P] Advisor responds per locale: canned reply bodies localized, trigger-word
  matching recognizes keywords authored for the active locale (EN triggers always as
  a floor). *(D25)*
- FR-36 [P] Onboarding is a real post-signup step: language chosen during signup is
  pre-selected, list matches FR-03, completion continues into the app; existing users
  go straight to the dashboard; the legacy `localStorage` mechanism is deleted.
  *(D24)*
- FR-37 [P] Every app surface has a locale-aware `generateMetadata` title. *(D7)*

**Preserved behavior**
- FR-38 [S] English rendering of every existing page is visually unchanged except the
  added switcher/chip. *(L24)*
- FR-39 [S] The three demo "languages we support" arrays show all seven local
  languages including Sindhi. *(L25)*
- FR-40 [S] Accessibility floor holds in every locale: localized labels/errors/
  aria-labels, visible focus rings, ≥44px targets, no horizontal scroll at 320px.
  *(L26)*

## Edge cases & rules

- Unknown/unsupported locale slug → 404. Never guess, never redirect.
- Corrupted/invalid cookie → no stored choice (public) or English (app). Cookie
  disagreeing with URL on public pages → URL wins; switcher marks the URL's language.
- Missing OR empty DB value → both missing (isolated English fallback).
- Duplicate key/language → rejected at write time.
- Switching mid-form loses typed input (full reload). Accepted, documented.
- Longest-real-word rule: Urdu/Pashto/Sindhi words don't hyphenate; breaking joined
  script mid-word destroys shaping — 320px layouts use real longest strings, never
  `overflow-wrap: anywhere` on Arabic-script text.
- Fallback isolation: an English sentence inside an Urdu paragraph carries its own
  `lang`/`dir`.
- Guest with a stored non-English preference hits a protected page → redirected to
  login as today; after sign-in they land in the app in their preferred language.
- Plural/sentence differences are authored as whole natural per-locale strings; the
  UI never concatenates translated fragments around inserted words (only the
  placeholder `{name}` helper, `formatMessage`).
- Supersedes `archive/dashboard/…` dashboard spec FR-2 ("language control is a
  non-functional placeholder") — amended by FR-10/FR-12.

## Out of scope

- Voice input/output, IVR, SMS (constitution).
- Any language beyond the eight-locale registry.
- Localized URL segments inside the farmer app (no `/ur/dashboard`).
- Admin string-editor UI — DB edits via Neon MCP / the sync script for now.
- Account-level preference sync across devices — cookie-only this release.
- Real advisory intelligence beyond finite canned replies (per-locale replies +
  triggers are in scope; free-form generation is not).
- Runtime machine translation; Accept-Language/IP detection or redirects.
- Re-translating marketing pages (done); dark mode; expert role; community.

## Acceptance criteria

- [ ] AC-01 All 8×(5 marketing + 2 auth) = 56 site variants return 200 with fully
      translated visible text; `/login`/bare renders English; spot-check zero leaks.
- [ ] AC-02 `/ur/login`, `/pa/features`, `/sd/signup` emit matching `lang`+`dir`;
      `/login` emits `en`/ltr.
- [ ] AC-03 Cookie=ur + `/features` → English, switcher highlights اردو, click →
      `/ur/features`. Switching `/skr/why-agropioo#vision` → English lands on
      `/why-agropioo#vision`. `/xx/features` → 404.
- [ ] AC-04 Deleting one DB value makes only that segment fall back (isolated
      `lang=en`); restoring shows it next request. Coverage test enforces ×8.
- [ ] AC-05 English pages: no visual regression except switcher/chip; chip appears
      once then stays dismissed; chip arrays list sete languages incl. سنڌي.
- [ ] AC-06 Self-canonical on all variants; reciprocal hreflang among en/ur/ps/sd;
      `x-default` → `/`; none on pa/skr/bal/hno; sitemap lists prefixed URLs.
- [ ] AC-07 Site: mirrored layout, ۳٬۵۰۰-style digits, LTR phone/email fields,
      autodetect free-text, Nastaliq headings, no clipped glyphs; at 320px no
      horizontal scroll; switcher keyboard-operable.
- [ ] AC-08 Sign in → switch to Urdu in the app → dashboard/farms/detect/prices/
      weather/notifications/settings/advisor/more render fully in Urdu, mirrored;
      refresh and back/forward preserve; re-login lands in Urdu (repeat for all 7).
- [ ] AC-09 Prices/weather numerals Eastern in Urdu, Western in English.
- [ ] AC-10 Submit empty farm form in Urdu → Urdu error; success flow in Urdu.
- [ ] AC-11 Follow localized forgot-password link from `/ur/login` → reset flow
      renders in Urdu end-to-end.
- [ ] AC-12 Settings language list matches registry exactly; no false "Soon";
      choosing switches immediately.
- [ ] AC-13 New account with Urdu site language → onboarding post-signup with Urdu
      pre-selected, accurate 8-language list; completion enters dashboard in Urdu;
      re-login goes straight to dashboard.
- [ ] AC-14 Urdu advisor: translated trigger keyword → localized reply; unknown input
      → localized fallback reply.
- [ ] AC-15 Responsive-text/grid/control audits (FR-31): no truncation or overlap at
      375px in any locale; grids reflow; no fixed-pixel widths on text controls.
- [ ] AC-16 Logical-edge grep across `app/(farmer)/` returns zero
      `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right` on translated surfaces;
      directional flips via `data-flip-rtl` only.
- [ ] AC-17 Mixed-direction audit: price rows, advisory cards, alert messages, chat
      bubbles correct with Latin fragments (no punctuation stranding).
- [ ] AC-18 Indicator-direction spot-check: trend arrows/progress/chevrons keep
      meaning in RTL; checkmarks/search/logo/numerals unmirrored.
- [ ] AC-19 No committed layout uses `line-clamp`/`truncate` on a translated
      sentence; remaining truncation only on decorative labels.
- [ ] AC-20 RTL stress pass (320/375/768/1024px, longest real ur/ps strings) on
      dashboard, add-farm, add-record, settings, advisor chat, farm-detail: zero
      horizontal scroll, zero overlaps, zero clipped glyphs.
- [ ] AC-21 Chromium cursive inspection: no injected letter-spacing gaps in Urdu;
      no Nastaliq descenders clipped.
- [ ] AC-22 Automated checks: preference resolution rules, fallback resolution,
      digit formatting, relative time, registry tag/dir agreement, catalog coverage
      ×8; `npm run lint` and `npm run build` pass; all existing tests stay green.

## Conflict rulings (founder, 2026-08-30)

Four contradictions surfaced when merging the two archived specs against the shipped
code. All ruled; the wording above already reflects each:

- **C1 — String source of truth.** Archived "no catalog files, DB only" vs shipped
  `catalog/*.ts` + `sync-translations.mts` + `catalog.test.ts` (endorsed by AGENTS.md).
  **Ruled: ratify the shipped model** — catalog files are the typed developable
  source, Neon `translations` is the runtime source of truth, sync via Neon MCP or
  the script (FR-14).
- **C2 — Auth-adjacent routes.** Cookie-driven app surfaces vs URL-decides public
  pages leaving no-cookie visitors on an English reset. **Ruled: seed the cookie on
  click** — a localized public page (e.g. `/ur/login`) sets `agro_locale` to its URL
  language before navigating into forgot/reset/verify, so the reset flow speaks the
  selected language end-to-end (FR-10, FR-28, AC-11).
- **C3 — Digits in mono/data cells.** **Ruled: Eastern everywhere** — `Noto Sans
  Arabic` appended to the mono fallback chain so ۰–۹ resolve in data cells too, one
  digit policy in all seven locales, Western only in English (FR-26).
- **C4 — Font loading.** Shipped root layout serves all five fonts on English pages
  too. **Ruled: accept as shipped** — simpler, modest weight; FR-23 records the
  behavior instead of the archived lazy-load intent.