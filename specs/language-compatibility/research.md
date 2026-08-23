# Language Compatibility — Research Findings

> Phase 1 output. Feeds `spec.md`. No design decisions here except where the founder
> has already ruled (§1). Sources: local Next.js 16 docs (`node_modules/next/dist/docs/`),
> repo inventory (2026-08-23), web research on RTL/Nastaliq/bidi/SEO/a11y practices,
> founder interview round 1.

## 1. Decisions already made (founder, round 1)

| # | Question | Decision |
|---|---|---|
| D1 | Launch languages | **All 8 fully translated**: English + ur, pa-Arab, ps, sd, skr, bal, hno |
| D2 | Locale in URL | **Hybrid**: marketing pages get `/{locale}` path prefixes; app/auth pages stay cookie-driven |
| D3 | Surfaces in scope | Public marketing pages + signup/login (+forgot/reset when built) + `/onboarding` shell |
| D4 | Translation copy | AI-drafted agricultural copy, founder reviews diffs |
| — | Voice input/output | Out of scope (constitution) |
| — | Admin string-editor UI | Out of demo scope; strings live in DB, editable via SQL/migrations |

## 2. How this is usually done

- **Next.js 16 App Router i18n (official guide):** nest everything under `app/[lang]`,
  read `lang` from route params (or `next/root-params()` in any Server Component),
  set `<html lang>` in the `[lang]/layout.tsx`, use `generateStaticParams` per locale.
  Redirect-by-header examples exist but Google explicitly warns against automatic
  Accept-Language/IP redirects (crawlers get misrouted; AI crawlers send synthetic
  English headers).
- **Middleware is deprecated in Next 16 → renamed `proxy.ts`** (same capabilities;
  file must sit at project root next to `app/`). Any locale redirect/rewrite/cookie
  logic lives there.
- **Dictionary pattern:** server-only dictionary loader keyed by locale; translations
  resolved during RSC render so strings never bloat the client bundle. Client
  components receive already-translated strings as props.
- **DB-backed catalogs** (our requirement): key-value rows `(key, locale, value,
  status)` fetched server-side and cached; used instead of JSON dictionary files when
  non-developers must edit copy. Trade-off: needs caching + seed migrations; gains
  runtime editability and coverage tracking.
- **Libraries** (next-intl etc.) assume file-based catalogs and add routing machinery;
  our catalog is DB-backed and our routing is custom-hybrid, so the standard libraries
  fit poorly. Zero new dependencies appears feasible (constitution requires approval
  anyway). ICU MessageFormat remains the recommended *format* for plural/gender-capable
  messages (Urdu cardinals: `one`/`other`; gendered verbs need whole-sentence keys).

## 3. Main approaches + trade-offs

| Approach | Pros | Cons |
|---|---|---|
| Full `[locale]` path prefix everywhere | Canonical, shareable, hreflang-clean | Doubles route surface incl. auth/app; forces login redirects through prefixes; heavy for hackathon pace |
| Cookie-only, flat URLs | Simplest; one route set | No localized URLs at all; weak SEO story for Pakistan-first brand |
| **Hybrid (chosen D2)** | Localized crawlable marketing pages; app stays simple cookie-driven | Two resolution contexts; needs strict precedence rule + hreflang discipline on prefixed cluster only |

**Precedence (recommended):** URL prefix > cookie > fixed English default.
Accept-Language sniffing **disabled** — minority-language speakers' browsers rarely
advertise skr/hno/bal, so sniffing misroutes exactly our audience; a dismissible
"view in Urdu" suggestion chip is the Google-aligned alternative to redirects.

## 4. Repo fit (what this feature lands on)

- **Routes today:** `/` (fully `"use client"` page composing 10 landing sections),
  `/features`, `/how-it-works`, `/vision`, `/why-agropioo` (server sections),
  `/login` + `/signup` (client forms in server shells), `GET /api/health`.
  One root layout only; `<html lang="en">` hardcoded at `app/layout.tsx:36`;
  header/footer included per-page, not layout-level.
- **Client-component census:** `app/page.tsx`, `app/sections/CTA.tsx`,
  `components/SiteHeader.tsx`, `components/EarlyAccessForm.tsx`, `components/Nav.tsx`,
  both auth forms. Everything else is Server Components (cheap to feed strings).
- **String volume:** ~350–400 visible strings across ~35 files. Largest:
  FeatureMatrix (~45), signup form (~35), Horizons (~22), login form (~22).
  Plus ~14 metadata title/description pairs across layout + pages.
- **Fonts:** Playfair Display, DM Sans, Geist Mono — all `subsets: ["latin"]`.
  **No Arabic-script font exists in the project.** Blocking gap.
- **LTR assumptions baked into CSS:** `.eyebrow` uses uppercase + wide letter-spacing
  (meaningless in Arabic script); `.marquee-track` translates X (direction-sensitive);
  physical utilities (`left-*`, `ml-*`) appear throughout sections.
- **Existing Urdu touchpoints to survive:** three duplicated language-chip arrays
  (`VoiceAccess.tsx`, `CoreFeatures.tsx`, `Differentiators.tsx` — six languages listed,
  **Sindhi missing**, pre-constitution), Roman-Urdu advisor mock in `login-form.tsx`
  (Latin script, stays LTR), mixed literal `"Urdu · پنجابی · Saraiki"` in
  `FeaturesHero.tsx:126`.
- **Dead code:** `components/Nav.tsx`, `Footer.tsx`, `Hero.tsx`, `Features.tsx`,
  `PakistanFirst.tsx`, `Journey.tsx`, `FinalCta.tsx`, `EarlyAccessForm.tsx`, `Logo.tsx`,
  `FurrowMotif.tsx`, `icons.tsx` are imported by no page (orphans; only each other).
  Live surfaces: `SiteHeader` + `app/sections/*`. Translation effort should not be
  spent on orphans without a founder ruling.
- **Infra state:** no migrations folder yet (this feature likely ships the first one);
  none of the constitution's chosen libs installed yet; `design-system/MASTER.md` is
  stale (contradicts code); git branch `main`, tree dirty only with the Next-injected
  AGENTS.md block.

## 5. Failure modes & guardrails (from web research)

### 5.1 RTL mechanics (Tailwind v4)
- Logical utilities (`ms/me/ps/pe/start/end/text-start/rounded-s/e`) flip automatically
  with ancestor `dir`; v4 `space-x` is logical but fragile on wrapped children → prefer
  `flex gap-*`. Physical utilities (`ml/mr/pl/pr/left-/right-/text-left`) stay pinned
  and produce "half-mirrored" pages.
- `rtl:`/`ltr:` variants only for transforms/gradients/animations. Directional icons
  flip via an opt-out marker; logos/numerals/search icons never mirror.
- Known tooling landmine: Turbopack/LightningCSS minification has rewritten logical →
  physical properties guarded by legacy `:lang()` lists (missing `skr`/`bal`/`hno`);
  compiled CSS must be diffed after build-tool upgrades.

### 5.2 Nastaliq/Arabic-script typography
- All 7 languages are Arabic-script (Shahmukhi/Nastaliq tradition). Correct BCP47 tags:
  `ur, pa-Arab, ps, sd, skr, bal, hno` (verified against IANA; bare `pa` is ambiguous
  with Gurmukhi).
- Nastaliq glyphs extend far beyond font metrics: fixed heights + tight line-height clip
  ک گ سے. Body text wants `line-height ≈ 2–2.2`, ≥16px, medium+ weights; buttons/chips/
  inputs need `min-height` + generous padding, never fixed height; audit every
  `overflow-hidden`.
- Split strategy from practitioners: **Nastaliq for display/prose** (culturally expected),
  **Naskh-class face for UI chrome/data** (cleaner small sizes). Fallback stacks may
  silently substitute Naskh for missing Nastaliq glyphs — verify per-language glyph
  coverage against the exact served woff2 with real sample sentences.
- Sizes: NNU woff2 ~480–600KB served (v4 re-engineering cut TTF 1.2MB→~317KB).
  Load only on non-English locales (locale-scoped font variable), `display: swap`.
  Arabic script has no italic tradition — never synthesize slants.

### 5.3 Bidi (mixed-direction content)
- Latin letters strong LTR, digits weak, neutrals inherit base direction → `+92…`,
  "Rs 3,500", trailing punctuation, "NDVI:" all scramble inside RTL sentences unless
  isolated.
- Markup-first hierarchy: wrap opposite-direction phrases in elements carrying `dir`;
  `<bdi>`/`dir="auto"` for unknown/user content; Unicode isolates (FSI/PDI) only in
  plain-text channels; never LRE/RLE, never `bidi-override`.
- Inputs: free text gets `dir="auto"`; email/password/phone stay hard `dir="ltr"`.
- Brand name, prices, phones render through dedicated isolating components — no naked
  interpolation of dynamic values.

### 5.4 Switching & persistence
- Fixed precedence URL > cookie > default (see §3). Every prefixed pageview refreshes
  the cookie (proxy owns writes; CDN caching can drop Set-Cookie otherwise).
- Switcher navigates to same path+query+hash under new prefix; disabled while
  transitioning; locale-changing links must not prefetch.
- Logged-in preference authoritative server-side; cookie is its cache, reconciled at
  session start; signup/onboarding seeds from current cookie (constitution mandate).

### 5.5 Missing-translation policy
- Recommended: **fallback to English**, rendered isolated with `lang="en" dir="ltr"`
  (an unprotected English sentence inside an Urdu paragraph corrupts surrounding bidi);
  never hide elements, never raw keys in production; dev builds may mark fallbacks.
- Track status per row (`translated/missing/stale` + source-hash staleness) so coverage
  is measurable; gate any future locale launch on core-flow coverage.
- Messages authored as ICU-style full sentences with named slots; no fragment
  concatenation (gender/politeness makes fragments untranslatable).

### 5.6 SEO (hybrid reality)
- hreflang accepts only ISO 639-1 codes → `en, ur, ps, sd` expressible; **`skr`, `bal`,
  `hno` cannot appear in hreflang at all** (no faking as ur/pa). Those locales rely on
  correct `<html lang>` + self-canonical + sitemap.
- Self-canonical on every locale page; reciprocal clusters listing all members incl.
  self; single `x-default` → English home; one declaration method site-wide.
- Zero IP/Accept-Language redirects anywhere (Google guidance + AI-crawler skew).
- Untranslated locale routes shouldn't be publicly crawlable (launch gating aligns).

### 5.7 Accessibility
- Single locale registry emits `lang`+`dir` together (unit-testable against IANA list).
- Embedded foreign-language fragments carry own `lang` (WCAG 3.1.2 AA) — including
  English fallbacks and the switcher items themselves (each named in its own language).
- Screen-reader voice support for skr/hno/bal effectively nonexistent — tags still
  mandatory (braille/conformance/future voices); document as known limitation, manual
  TalkBack pass for Urdu.
- No `overflow-wrap: anywhere` on Arabic text (breaks joined shaping mid-word); 320px
  pass must use longest real words; focus rings outline-based with offsets safe for
  Nastaliq overhang; aria-labels/error messages localized like any other string.

## 6. Open questions (going to founder interview)

1. Fate of the 11 orphaned components — delete before translating, or freeze?
2. Hybrid boundary detail: exactly which routes are prefixed (`/ur/...`) — marketing
   only, or also `/signup`/`/login`? Default landing for `/` in a non-English cookie?
3. Missing-string policy confirmation: English-fallback-with-isolation OK?
4. Typography split: Nastaliq display + Naskh UI chrome — approved? Which face for UI?
5. Digits: Western (`3,500`) vs Eastern Arabic-Indic (`۳٬۵۰۰`) in Urdu UI?
6. First-visit suggestion banner ("اردو میں دیکھیں") — in scope?
7. Metadata (titles/descriptions): translated per locale or English-only for demo?
8. Switcher shape: dropdown in SiteHeader + item in mobile sheet + auth-page placement?
9. Where does the language *preference for the advisor* (vs UI) diverge later — record
   as out-of-scope note or spec a field now?
10. Sindhi added to the three demo language-chip arrays (currently missing)?
