# Spec — Farmer-app localization

Status: v3 — amended 2026-08-27 with alignment & responsiveness requirements (FR-13..FR-20, AC-13..AC-21) addressing poor RTL/local-language layout on the farmer dashboard. Prior v2 was clarified with founder 2026-08-25. Findings basis: `research.md` (this folder). No implementation choices here — those belong to `plan.md`.

## Goal

A farmer who prefers Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi, or Hindko can use the entire logged-in app — every label, message, sample advisory, and number — in that language, with layouts that mirror correctly and never clip their script. Today only the marketing site and login/signup are localized; the app a farmer sees after signing in is English-only and its language controls are broken.

Scope ruling (founder): the **whole farmer app ships in one release** — no phased rollout, because partially-localized screens inside a localized app read as unfinished.

## User scenarios

1. A farmer signs in, opens the sidebar, taps the language switcher, chooses **اردو** — the whole app re-renders right-to-left in Urdu, including the greeting on the dashboard, sample advisories, alert messages, prices with Eastern digits, and every button. They close the browser, return tomorrow, and the app still opens in Urdu.
2. A Pashto-speaking farmer requests a password reset from a localized login page — the reset form they land on speaks Pashto too, not English.
3. A Punjabi farmer submits the add-farm form with a missing field — the error message appears in Punjabi, not English.
4. A Sindhi farmer switches back to English from settings — every screen returns to English immediately, and the choice sticks.
5. An Urdu-reading farmer views the prices screen: numerals appear as Eastern Arabic-Indic digits (۴٬۲۰۰), matching what the marketing site already does.

## Functional requirements

- **FR-1 Full-surface coverage:** every farmer-app screen renders all farmer-visible text in the currently selected language — navigation, headings, buttons, labels, empty states, placeholders, confirmation messages, tooltips, page titles/metadata, and accessibility labels (aria-labels, alt-style descriptions such as chart trend labels).
- **FR-2 Sample content counts:** demo/sample content that farmers read — advisories, alerts, weather summaries, farm names/stages, price entries — renders in the selected language like any other text *(confirmed by founder)*.
- **FR-3 Visible switcher everywhere:** a language switcher is reachable on every farmer-app screen (nav on desktop, equivalent access on mobile), per the constitution; the collaborator's dashboard-header placement is retained. Selecting a language re-renders the app in that language **on the spot** — the farmer stays on the screen they were on.
- **FR-4 Persistence:** the selected language persists across sessions. Returning farmers land in their last chosen language without re-selecting.
- **FR-5 Auth-adjacent surfaces included:** verify-code, forgot-password, reset-password, and onboarding screens honor the selected language.
- **FR-6 Safe default:** absent, unknown, or malformed language preference resolves to English everywhere in the app.
- **FR-7 Marketing site unchanged:** public pages continue to behave exactly as shipped (URL-driven language). Nothing in this feature changes URLs a farmer can type or share on public pages.
- **FR-8 App ignores URL language:** farmer-app screens always render in the stored preference; a localized public URL visited before sign-in does not force the app's language afterward.
- **FR-9 Numbers, dates, times:** all numerals, dates, and relative times in the app follow the established digit policy (Eastern Arabic-Indic ۰–۹ for the seven local locales, Western for English) — including prices, weather figures, timestamps, record counts, and chart labels.
- **FR-10 Mirrored layout, verifiable:** RTL locales mirror the layout end-to-end on every farmer-app screen — sidebar/tab-bar side, dashboard card grid flow, farms carousel scroll direction, alert/quick-action row order, tab/arrow icon orientation, progress/checklist indicators, form-field alignment, and the notification/settings panel. English LTR rendering is pixel-identical to today. Non-directional glyphs (checkmarks, search, the logo, numerals, crop-health dots) do not mirror. Directional icons (back/forward chevrons, trend arrows, "add record" arrows) flip to preserve their semantic meaning; a mirrored trend arrow must never imply the opposite trend.
- **FR-11 Script-safe typography:** no Arabic-script text ever renders with added letter-spacing; uppercase transforms do not apply to Arabic-script labels. The two already-shipped violations on the public login form are fixed under this feature's definition of done.
- **FR-12 No clipped script:** Urdu/Nastaliq text renders fully — no cut ascenders/descenders, no ellipsized or hidden words caused by fixed-height containers — at every supported width down to 320px.

**Alignment & responsiveness across languages**

- **FR-13 Responsive text fit:** every translated label, heading, button, chip, and badge renders its real localized string in full — no truncation, no overlap, no forced line-break mid-word — at widths 375px and above. At 320px, non-critical text may wrap or shrink within the accessibility floor (≥14px effective, ≥4.5:1 contrast); it is never truncated mid-word and never hidden behind `overflow: hidden` with no accessible alternative.
- **FR-14 Flexible grids:** card grids on dashboard and farms pages reflow to fit the longest real localized string — multi-column on wide viewports, fewer columns or single-column on narrow viewports. Cards grow with their content (no fixed heights, no `line-clamp` on translated bodies). The farms carousel on mobile wraps into additional rows when labels are longer, rather than relying on off-screen horizontal scroll.
- **FR-15 Content-sized controls:** buttons, chips, tabs, and quick-action tiles size to their content with a minimum inline padding; icon-plus-label buttons grow together with a visible gap between glyph and text. Fixed-pixel widths on text-bearing controls are not permitted in any locale. Touch targets stay ≥44×44px and expand with the translated label.
- **FR-16 Logical-edge alignment:** every farmer-app screen anchors to logical `start`/`end` edges, never physical `left`/`right`. In RTL, navigation items, alert rows, form labels, and card headings sit flush at the inline-start edge; numeric columns and timestamp columns in lists align on their own axis so tabular data scans cleanly in either direction.
- **FR-17 Mixed-direction rows:** Latin fragments inside an RTL sentence — the Agropioo name, crop codes, units, URLs — are wrapped with proper `dir` and `unicode-bidi` isolation so adjacent punctuation, numerals, and RTL words keep correct reading order in every occurrence (advisory cards, alert messages, price rows, chat transcripts).
- **FR-18 Directional indicators, mirrored with meaning:** trend arrows, progress bars, checklist chevrons, and step-flow connectors flip in RTL to preserve semantic direction (progress still reads as advancing; trend-up still means improving). Non-directional glyphs (checkmarks, search, the logo, numerals, crop-health dots) do not flip. A mirrored indicator must never imply the opposite meaning.
- **FR-19 Overflow hierarchy:** when a localized string would overflow its container, the fix order is strict — (a) wrap the text and let the layout grow, (b) adjust the layout (stack, reflow, or switch to a one-column variant), (c) shrink font within the accessibility floor. Truncation with ellipsis is a last resort, used only on non-essential decorative labels, never on translated sentences, and never mid-word on Arabic-script text (which breaks cursive joining).
- **FR-20 RTL stress test:** every farmer-app screen is verified at 320px / 375px / 768px / 1024px widths with real longest Urdu and Pashto strings from the `translations` table — no horizontal scroll, no overlapping touch targets, no clipped glyphs, no broken alignment. The stress set includes: dashboard (greeting + advisory + alerts + quick actions + detect CTA + farms row + checklist), add-farm form, add-record form, settings language list, advisor chat transcript, and farm-detail page.

- **FR-21 Form feedback localized:** validation and error feedback on farmer forms (add/edit farm, add record, detect upload) displays in the selected language.
- **FR-22 Accurate language lists:** any surface listing languages (settings, onboarding) shows exactly the eight registry languages with correct native names and scripts — no "coming soon" flags for shipped languages, no invented codes.
- **FR-23 Honest controls:** every language control in the app either works or does not exist — no control may navigate to a 404.
- **FR-24 Onboarding wired:** onboarding is fixed and becomes a real post-signup step — new signups land on it after account creation, with the language chosen during signup pre-selected (constitution rule), its language list matching FR-22, and completion continuing into the app. Existing users signing in continue straight to the dashboard as merged in PR #16.
- **FR-25 Advisor works per locale:** the advisor's canned replies render in the active language, and trigger-word matching recognizes keywords authored for that locale — so a farmer typing in Urdu gets a relevant Urdu reply, not the fallback.
- **FR-26 Supabase MCP for DB sync:** all translation DB operations use the in-project Supabase MCP connection. No ad-hoc clients, manual scripts, or catalog files — the Supabase `translations` table is the single source of truth, and all sync/migration operations go through MCP.

## Edge cases & rules

- Preference value corrupted or references a retired language → English, silently, no crash.
- Switching language mid-form performs a full reload; unsaved input is lost. Accepted trade-off for this release (matches existing switcher behavior site-wide) — forms are short; noted honestly rather than hidden.
- A translation missing or empty in the Supabase `translations` table falls back to
  English per the established pipeline; a farmer must never see a raw key, blank label,
  or mixed sentence where a full English string was available.
- Longest-language layout stress: Urdu/Pashto strings run longer than English; no surface may introduce horizontal scroll at 320px or overlap touch targets in any locale. The stress set for manual QA is fixed in AC-20.
- Plural/sentence structure differences are handled by translators authoring natural per-locale strings — the UI never concatenates translated fragments around inserted words except through the existing isolated-fallback wrapper.
- Charts, trend arrows, and progress indicators flip direction meaningfully in RTL or use direction-neutral glyphs; a mirrored arrow must never imply the opposite trend (enforced by FR-18, verified by AC-18).
- Overflow is resolved per the FR-19 hierarchy (wrap → reflow → shrink → truncate-last-resort); a layout that needs truncation to fit a translated sentence is treated as a defect, not a trade-off.
- Guest with a stored non-English preference hits a protected page → redirected to login as today; after sign-in they land in the app in their preferred language.
- Supersedes `specs/dashboard/spec.md` FR-2 ("language control is a non-functional placeholder") — that line is amended in the same change that makes the control functional.

## Out of scope

- Voice input/output (constitution exclusion stands).
- Any language beyond the current eight-locale registry.
- Localized URL path segments (routes stay canonical; no `/ur/dashboard`-style URLs inside the app).
- Real advisory intelligence beyond the finite canned reply set — smarter intent handling, free-form answer generation, or memory of past chats. Per-locale replies and trigger keywords are in scope; anything beyond that is not.
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
8. Create a new account with the site language set to Urdu → onboarding appears post-signup with Urdu pre-selected and an accurate 8-language list; completing it enters the dashboard in Urdu. Signing in again as that user goes straight to the dashboard.
9. Inspect rendered Urdu text in a Chromium browser: joined cursive letters show no injected gaps (letter-spacing neutralized); no Nastaliq descenders clipped on dashboard cards, chips, or truncated contexts at 320px, 375px, 768px widths.
10. In the Urdu advisor, type a translated trigger keyword → the relevant canned reply arrives in Urdu; unknown input gets the localized fallback reply.
11. Automated checks pass for: preference resolution rules (absent/unknown/corrupt → English), digit formatting per locale, advisor trigger matching per locale, and dictionary completeness (every new key present × 8 locales before merge).
12. `npm run lint` and `npm run build` pass; all existing tests stay green.
13. **Responsive-text audit (FR-13):** on dashboard, farms list, settings, and the add-farm/add-record forms, no translated label, button, chip, or badge is truncated or overlaps a neighbor at 375px width in any of the eight locales; at 320px the only permitted shrink is wrap or font-size reduction within the accessibility floor, never mid-word truncation or hidden overflow.
14. **Grid reflow audit (FR-14):** dashboard card grid and farms grid render multi-column at ≥768px and collapse to fewer columns or a single column at 375px in Urdu and Pashto; the mobile farms carousel wraps to additional rows rather than requiring horizontal scroll when farm names are long.
15. **Content-sized controls audit (FR-15):** no text-bearing control (primary/secondary button, chip, tab, quick-action tile) uses a fixed-pixel width; every such control grows with its translated label and keeps a ≥44px touch target in every locale.
16. **Logical-edge audit (FR-16):** `grep` across farmer-app files returns zero `left-`/`right-`/`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right` utilities on translated surfaces — only logical `start`/`end` classes. Directional icon flips are opted in via the established `data-flip-rtl` marker; non-directional glyphs remain untouched.
17. **Mixed-direction audit (FR-17):** advisory-card body, alert messages, price rows, and advisor chat bubbles render correctly when a sentence mixes Urdu/Pashto text with Latin fragments (the product name, crop codes, units) — no punctuation stranding, no reversed word order, no flipped parentheses.
18. **Indicator-direction audit (FR-18):** trend arrows, progress bars, checklist chevrons, and step-flow connectors flip semantic direction in RTL (progress still advances; up-trend still means improvement) while checkmarks, search icons, the logo, and numerals stay unmirrored.
19. **Overflow hierarchy audit (FR-19):** no committed layout on a translated surface relies on `line-clamp` or `truncate` to fit a translated sentence; any remaining truncation applies only to non-translated decorative labels and has a screen-reader-accessible full string.
20. **RTL stress pass (FR-20):** manual run-through at 320px / 375px / 768px / 1024px with the longest real Urdu and Pashto strings from the `translations` table shows zero horizontal page scroll, zero overlapping touch targets, zero clipped Nastaliq glyphs, and zero broken alignment on: dashboard, add-farm form, add-record form, settings language list, advisor chat, and farm-detail page.
21. **Nastaliq clipping pass (FR-12 strengthened):** in Chromium, rendered Urdu text on dashboard cards, alert chips, form labels, and chat bubbles shows no clipped ascenders or descenders at any of the four widths; no container uses a fixed pixel height on a translated text node.
