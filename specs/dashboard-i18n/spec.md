# Spec — Farmer-app localization

Status: draft v1 for founder review. Findings basis: `research.md` (this folder). No implementation choices here — those belong to `plan.md`.

## Goal

A farmer who prefers Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, or Hindko can use the entire logged-in app — every label, message, sample advisory, and number — in that language, with layouts that mirror correctly and never clip their script. Today only the marketing site and login/signup are localized; the app a farmer sees after signing in is English-only and its language controls are broken.

## User scenarios

1. A farmer signs in, opens the sidebar, taps the language switcher, chooses **اردو** — the whole app re-renders right-to-left in Urdu, including the greeting on the dashboard, sample advisories, alert messages, prices with Eastern digits, and every button. They close the browser, return tomorrow, and the app still opens in Urdu.
2. A Pashto-speaking farmer requests a password reset from a localized login page — the reset form they land on speaks Pashto too, not English.
3. A Punjabi farmer submits the add-farm form with a missing field — the error message appears in Punjabi, not English.
4. A Sindhi farmer switches back to English from settings — every screen returns to English immediately, and the choice sticks.
5. An Urdu-reading farmer views the prices screen: numerals appear as Eastern Arabic-Indic digits (۴٬۲۰۰), matching what the marketing site already does.

## Functional requirements

- **FR-1 Full-surface coverage:** every farmer-app screen renders all farmer-visible text in the currently selected language — navigation, headings, buttons, labels, empty states, placeholders, confirmation messages, tooltips, page titles/metadata, and accessibility labels (aria-labels, alt-style descriptions such as chart trend labels).
- **FR-2 Sample content counts:** demo/sample content that farmers read — advisories, alerts, weather summaries, farm names/stages, price entries, chat replies — renders in the selected language like any other text. *(Assumed: demo content is product-shaped text; confirm in review.)*
- **FR-3 Visible switcher everywhere:** a language switcher is reachable on every farmer-app screen (nav on desktop, equivalent access on mobile), per the constitution. Selecting a language re-renders the app in that language **on the spot** — the farmer stays on the screen they were on.
- **FR-4 Persistence:** the selected language persists across sessions. Returning farmers land in their last chosen language without re-selecting.
- **FR-5 Auth-adjacent surfaces included:** verify-code, forgot-password, reset-password, and onboarding screens honor the selected language.
- **FR-6 Safe default:** absent, unknown, or malformed language preference resolves to English everywhere in the app.
- **FR-7 Marketing site unchanged:** public pages continue to behave exactly as shipped (URL-driven language). Nothing in this feature changes URLs a farmer can type or share on public pages.
- **FR-8 App ignores URL language:** farmer-app screens always render in the stored preference; a localized public URL visited before sign-in does not force the app's language afterward.
- **FR-9 Numbers, dates, times:** all numerals, dates, and relative times in the app follow the established digit policy (Eastern Arabic-Indic ۰–۹ for the seven local locales, Western for English) — including prices, weather figures, timestamps, record counts, and chart labels.
- **FR-10 Mirrored layout:** RTL locales mirror the layout (sidebar side, tab order, icon arrows, progress/checklist indicators); LTR rendering of English is pixel-identical to today.
- **FR-11 Script-safe typography:** no Arabic-script text ever renders with added letter-spacing; uppercase transforms do not apply to Arabic-script labels. The two already-shipped violations on the public login form are fixed under this feature's definition of done.
- **FR-12 No clipped script:** Urdu/Nastaliq text renders fully — no cut ascenders/descenders, no ellipsized or hidden words caused by fixed-height containers — at every supported width down to 320px.
- **FR-13 Form feedback localized:** validation and error feedback on farmer forms (add/edit farm, add record, detect upload) displays in the selected language.
- **FR-14 Mixed-direction integrity:** Latin fragments inside RTL sentences (e.g., the Agropioo name, crop codes) remain readable and correctly ordered.
- **FR-15 Accurate language lists:** any surface listing languages (settings, onboarding) shows exactly the eight registry languages with correct native names and scripts — no "coming soon" flags for shipped languages, no invented codes.
- **FR-16 Honest controls:** every language control in the app either works or does not exist — no control may navigate to a 404.

## Edge cases & rules

- Preference value corrupted or references a retired language → English, silently, no crash.
- Switching language mid-form performs a full reload; unsaved input is lost. Accepted trade-off for this release (matches existing switcher behavior site-wide) — forms are short; noted honestly rather than hidden.
- A translation missing or empty in the database falls back to English per the established pipeline; a farmer must never see a raw key, blank label, or mixed sentence where a full English string was available.
- Longest-language layout stress: Urdu/Pashto strings run longer than English; no surface may introduce horizontal scroll at 320px or overlap touch targets in any locale.
- Plural/sentence structure differences are handled by translators authoring natural per-locale strings — the UI never concatenates translated fragments around inserted words except through the existing isolated-fallback wrapper.
- Charts, trend arrows, and progress indicators flip direction meaningfully in RTL or use direction-neutral glyphs; a mirrored arrow must never imply the opposite trend.
- Guest with a stored non-English preference hits a protected page → redirected to login as today; after sign-in they land in the app in their preferred language.
- Supersedes `specs/dashboard/spec.md` FR-2 ("language control is a non-functional placeholder") — that line is amended in the same change that makes the control functional.

## Out of scope

- Voice input/output (constitution exclusion stands).
- Any language beyond the current eight-locale registry.
- Localized URL path segments (routes stay canonical; no `/ur/dashboard`-style URLs inside the app).
- Real backend data, real advisory generation, or making the advisor's keyword matching multilingual beyond translating its existing sample replies and trigger words.
- Dark mode, SMS/IVR channels, expert roles, community features.
- Re-translating marketing pages (done in prior groups).

## Acceptance criteria

1. Sign in → switch to Urdu via the app switcher → dashboard, farms, detect, prices, weather, notifications, settings, advisor, more all render fully in Urdu with mirrored layout; browser back/forward and manual refresh preserve the choice.
2. Kill the session, sign in again → app opens in Urdu without any selection.
3. Repeat (1) for each of the seven local locales — no English leakage on any screen except isolated Latin fragments wrapped for readability.
4. Prices and weather numerals appear in Eastern digits in Urdu; in English they remain Western.
5. Submit the farm form empty in Urdu → error text is Urdu; correct the input → success flow completes in Urdu.
6. Follow a localized forgot-password link from `/ur/login` → reset flow renders in Urdu end-to-end (fixes the current 404).
7. Settings language list matches the registry exactly (8 languages, correct names/scripts, no false "Soon"); choosing one switches immediately.
8. Onboarding screen (if retained) shows the same accurate list and honors the signup-carried pre-selection per the constitution.
9. Inspect rendered Urdu text in a Chromium browser: joined cursive letters show no injected gaps (letter-spacing neutralized); no Nastaliq descenders clipped on dashboard cards, chips, or truncated contexts at 320px, 375px, 768px widths.
10. Automated checks pass for: preference resolution rules (absent/unknown/corrupt → English), digit formatting per locale, and dictionary completeness (every new key present × 8 locales before merge).
11. `npm run lint` and `npm run build` pass; all existing tests stay green.
