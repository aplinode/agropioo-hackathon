# Spec — Language Compatibility (i18n + RTL)

> Status: DRAFT awaiting founder sign-off. Phase: specify→clarify complete.
> Sources: `research.md` (this folder), founder interviews rounds 1–4, AGENTS.md constitution.

## Goal

Agropioo claims to be Pakistan-first, but today every word of its UI is hardcoded
English. This feature makes the entire public experience work in English plus the seven
constitutional Pakistani languages — Urdu, Punjabi, Pashto, Sindhi, Saraiki, Balochi,
Hindko — with correct right-to-left presentation, culturally authentic typography, and a
language switcher visible on every page. A farmer who reads only Saraiki should be able
to read, navigate, and sign up entirely in Saraiki.

## User scenarios

1. A visitor lands on `/` (English, default). They open the language switcher in the
   header, pick **اردو** — the page becomes `/ur`, fully mirrored right-to-left, every
   visible string in Urdu, headings in Nastaliq style.
2. An Urdu-reading farmer on `/ur/features` clicks "Sign in". They land on `/ur/login`
   still in Urdu, including form labels, error messages, and the advisor-chat preview
   (now in Urdu script).
3. A Pashto speaker types `/ps/signup` directly. They get the full signup page in
   Pashto — no redirects, no English detour.
4. A first-time visitor with no stored choice sees a small dismissible chip offering
   **اردو میں دیکھیں**; tapping it takes them to the Urdu homepage; dismissing it keeps
   it dismissed on every later visit.
5. A user on `/skr/why-agropioo` opens the switcher and picks **English**. They end up
   on `/why-agropioo` (the unprefixed English page), scrolled context preserved by path,
   never dumped on the homepage.
6. Someone visits `/login` (no prefix) while their cookie remembers Urdu. They see
   English — URLs decide language — and the switcher highlights Urdu as their last
   choice.
7. On `/sd/prices`… (future app page) a price renders as Eastern Arabic-Indic digits in
   Sindhi UI and as Western digits in English UI, never scrambled by surrounding RTL
   text.
8. A founder edits an Urdu string in the database (via SQL). The next request to any
   `/ur/...` page shows the new copy — no redeploy.
9. During editing, someone deletes the Saraiki row for the signup headline. `/skr/signup`
   shows that one headline in English (isolated so bidi stays intact); everything else
   stays Saraiki; the gap is visible in coverage tracking.

## Functional requirements

**Languages & registry**
- FR-1 The product supports exactly eight UI languages: English (default) plus Urdu,
  Punjabi (Shahmukhi), Pashto, Sindhi, Saraiki, Balochi, Hindko. Each has one stable
  identity triple: URL slug (`ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`; English =
  no slug), document `lang` tag (`ur`, `pa-Arab`, `ps`, `sd`, `skr`, `bal`, `hno`,
  `en`), and direction (RTL for the seven, LTR for English).
- FR-2 Every page emits `<html lang>` and `dir` from that single registry — never from
  independent logic — and the emitted pair always agrees (e.g. `pa-Arab` ⇒ `rtl`).

**Routing (hybrid model)**
- FR-3 All marketing pages (`/`, why-agropioo, features, how-it-works, vision) and all
  auth pages (signup, login; forgot/reset when they exist) exist in eight locale
  variants. Prefixed variants live under `/{slug}/…` and are directly linkable,
  crawlable, and refresh-safe.
- FR-4 Unprefixed paths always render English regardless of cookies, headers, or IP.
  There are no automatic locale redirects anywhere, for anyone.
- FR-5 An unknown locale prefix (e.g. `/xx/features`) returns a proper 404, not a
  redirect and not English content.
- FR-6 Switching language from any page lands on the same page in the target language:
  same path (re-slugged), same query string, same hash. It never navigates home.

**Switcher**
- FR-7 A language switcher is visible on every page in scope: in the site header on
  marketing pages (desktop dropdown; same options inside the mobile menu sheet), and in
  a corner control on the standalone auth pages.
- FR-8 Each option shows the language's native name in its own script (English, اردو,
  پنجابی, پښتو, سنڌي, سرائیکی, بلوچی, ہندکو) with its own `lang` attribute; the active
  language is visibly marked. Touch targets ≥ 44×44 px; keyboard operable; Escape closes
  the dropdown.
- FR-9 While a switch is in flight the control is disabled; double-taps cannot fire two
  navigations.

**Translations & catalog**
- FR-10 Every user-visible string on translated surfaces — headings, body, buttons,
  labels, placeholders, validation messages, aria-labels, alt text, page `<title>` and
  meta descriptions, and demo snippets such as the login advisor preview — comes from
  the shared translation catalog. English rendering uses the same catalog (single source
  of truth; no parallel hardcoded copy drifting elsewhere).
- FR-11 The catalog lives in the database (constitution) and is editable there without
  redeploying; each entry belongs to one namespace/key and one language, and a key can
  hold at most one value per language.
- FR-12 When a string is missing or empty for a language, that segment renders the
  English value wrapped so it is announced/read as English and does not corrupt
  surrounding RTL text. Raw catalog keys are never shown to users. Missing segments are
  never silently hidden.
- FR-13 Coverage is measurable: it is possible to list, per language, which keys fall
  back to English (a coverage/status signal exists even though no admin UI ships).

**Right-to-left presentation**
- FR-14 In RTL locales the whole layout mirrors: navigation order, text alignment,
  spacing sides, icon direction where directional (back arrows, arrows-in-buttons),
  borders and rounded corners on the logical start/end. Non-directional imagery (logo,
  photos, checkmarks, search icons, numerals) does not mirror.
- FR-15 Mixed-direction content inside RTL text — prices, phone numbers, Latin tokens
  like "Agropioo"/"NDVI", dates — renders in correct reading order with adjacent
  punctuation on the correct side, everywhere it appears.
- FR-16 Free-text inputs (names, farm/chat text) auto-detect typed direction;
  email/password/phone inputs stay left-to-right even on RTL pages.

**Typography & digits**
- FR-17 Arabic-script locales render display/headings in a Nastaliq-style face and
  smaller UI text (buttons, labels, badges, data) in a clearer Arabic-script face; both
  load only when serving those locales — English pages never download them.
- FR-18 Arabic-script body text never clips: line-height accommodates Nastaliq
  overhang, containers size with min-heights rather than fixed heights, minimum body
  size 16px, weights medium or heavier, and text is never italicized or letter-spaced/
  uppercased (those treatments don't apply to the script).
- FR-19 Numerals render per locale: Eastern Arabic-Indic digits (۰–۹) in the seven
  local languages, Western digits in English — applied uniformly to prices, counts,
  dates, areas, phone displays — through one consistent formatting behavior, with
  thousands separators appropriate to the locale.

**First-visit suggestion**
- FR-20 A visitor with no stored language choice may see one dismissible suggestion chip
  offering Urdu (اردو میں دیکھیں) linking to the Urdu equivalent of the current page.
  Dismissing it stores that decision; it then never reappears. It appears at most once
  per visit and never blocks content. (Urdu is suggested because it is the national
  lingua franca; other languages remain reachable via the switcher.)

**Persistence**
- FR-21 The last explicitly chosen language persists across visits in a cookie readable
  server-side. The cookie influences only: switcher highlighting, suggestion-chip
  suppression, and (future) onboarding pre-selection. It never changes what an
  unprefixed URL renders.

**SEO**
- FR-22 Every locale variant self-canonicalizes. Hreflang alternates are emitted only
  where a valid code exists (`en`, `ur`, `ps`, `sd`) as one reciprocal cluster listing
  every member including itself; `x-default` points at the English homepage. `pa`,
  `skr`, `bal`, `hno` get correct `lang`, canonical, and sitemap presence but no
  hreflang (Google accepts no safe code for them).
- FR-23 Localized metadata (title/description) is served for every prefixed page, and
  localized pages are discoverable in the sitemap.

**Preserved existing behavior**
- FR-24 English rendering of every existing page remains visually unchanged from today
  except for the added switcher/chip.
- FR-25 The three "languages we support" chip arrays show all seven local languages
  including Sindhi (today Sindhi is missing), and continue to render RTL chips inside
  the LTR page.
- FR-26 Accessibility floor holds in every locale: localized labels/errors/aria-labels,
  visible focus rings, ≥44px targets, no horizontal scroll at 320px widths using the
  longest real strings in each language.

## Edge cases & rules

- **Unknown/unsupported locale slug** → 404. Never guess, never redirect.
- **Corrupted or invalid cookie value** → treated as no stored choice.
- **Cookie disagrees with URL** (cookie=ur on `/pa/features`) → URL wins; switcher marks
  the URL's language.
- **Missing OR empty catalog value** → both count as missing (English fallback path).
- **Duplicate key within a language** → rejected at write time; one value per key per
  language.
- **Longest-real-word test**: Urdu/Pashto/Sindhi words don't hyphenate and breaking
  joined script mid-word destroys shaping — layouts must fit 320px using real longest
  strings, never `overflow-wrap: anywhere` on Arabic-script text.
- **Switching away from a half-filled auth form** loses typed input (full navigation).
  Accepted for this build; noted so it's a decision, not a surprise.
- **Crawler/bot hits any prefixed URL directly** → full rendered page; no header/IP
  logic exists to trip over.
- **Both suggestion-chip conditions collide** (first visit AND user immediately picks a
  language from the switcher) → chip disappears; choosing counts as deciding.
- **Fallback isolation**: an English fallback sentence inside an Urdu paragraph carries
  its own `lang`/`dir` so trailing punctuation and neighboring words keep correct order.

## Out of scope

- Voice input/output, IVR, SMS alerts (constitution).
- Admin UI for editing translations — DB edits happen via SQL/migrations for now.
- Account-level preference sync (login persistence across devices) — deferred wholly to
  the future auth/database spec; this feature is cookie-only.
- The `/onboarding` screens themselves — next feature; it will consume this system
  (pre-selected language from switcher/cookie is recorded as intent here, built there).
- The farmer app (dashboard/farms/advisor/detect/prices/schemes) — routes don't exist
  yet; they inherit this system when built.
- Making the future AI advisor *respond* in the selected language — advisor feature's
  concern.
- Automatic Accept-Language/IP detection or redirects — deliberately rejected.
- Runtime machine translation.
- Dark mode, expert role, community forum (constitution).

## Acceptance criteria

- [ ] AC-1 Each of the 8×(5 marketing + 2 auth) = 56 route variants returns 200 with
      fully translated visible text (spot-check matrix pass; zero English leaks beyond
      declared fallbacks).
- [ ] AC-2 `/ur/login`, `/pa/features`, `/sd/signup` each emit matching `lang` + `dir`
      (`ur`/rtl, `pa-Arab`/rtl, `sd`/rtl); `/login` emits `en`/ltr.
- [ ] AC-3 With cookie=ur, visiting `/features` renders English; switcher highlights
      اردو; clicking اردو goes to `/ur/features`.
- [ ] AC-4 Switching from `/skr/why-agropioo#vision` to English lands on
      `/why-agropioo#vision`.
- [ ] AC-5 `/xx/features` returns 404; `/ur/nonexistent` returns a 404 presented in Urdu
      chrome or plain — never an English page masquerading.
- [ ] AC-6 Deleting one Saraiki value in the DB makes only that segment render English
      (isolated, valid `lang=en`) on `/skr/...`; restoring the row restores Saraiki on
      next request without redeploy.
- [ ] AC-7 On `/ur/...` pages: layout mirrored, price-like figures render ۳٬۵۰۰-style
      digits, phone/email fields stay LTR, free-text field aligns to typed script,
      headings render Nastaliq-style, buttons/badges show no clipped glyphs.
- [ ] AC-8 English pages show zero visual diff vs current build except switcher/chip,
      and transfer no Arabic-script webfont bytes.
- [ ] AC-9 First visit shows the Urdu suggestion chip once; dismiss persists; choosing
      any language suppresses it.
- [ ] AC-10 View-source checks: self-canonical on all variants; reciprocal hreflang
      cluster among en/ur/ps/sd; `x-default` → `/`; no hreflang on pa/skr/bal/hno
      variants; sitemap lists prefixed URLs.
- [ ] AC-11 Chip arrays on landing/features/why pages list seven languages incl. سنڌي.
- [ ] AC-12 At 320px width, RTL pages have no horizontal scroll with real longest
      strings; all switcher options ≥44px tall; keyboard-only user can switch language.
- [ ] AC-13 `npm run lint` and `npm run build` pass; automated tests cover the locale
      registry (tags/dir agreement) and the missing-fallback resolution rule.
