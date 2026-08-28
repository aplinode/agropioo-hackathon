# Plan — Language Compatibility

> Status: DRAFT awaiting founder sign-off. Implements `spec.md` in this folder.
> Stack constraints honored: Next.js 16 App Router, Route Handlers as API layer,
> Neon Lakebase Postgres, zero ad-hoc clients, no new runtime deps without approval.

## Approach in one paragraph

Nest every translatable page under a single `app/[locale]/…` route tree whose layouts
read the locale once and emit `lang`/`dir`/fonts from one registry. A root `proxy.ts`
(the Next-16 replacement for middleware) rewrites unprefixed URLs to their `/en`
counterparts *internally* (browser URL stays bare), passes real prefixed URLs through,
and owns the locale cookie. Strings live in the Neon `translations` table as the
single source of truth — no catalog files exist; translations are authored directly in
the database via SQL/migrations. Pages resolve text through a server-only loader with
per-request dedupe and short-TTL caching, falling back to isolated English when a row
is missing. RTL correctness comes from logical Tailwind utilities plus a few
scoped `[dir="rtl"]` overrides; Arabic-script faces (Nastaliq display + Arabic sans UI)
load only where text uses them.

## Key decisions & trade-offs

| # | Decision | Chosen | Alternatives rejected (why) |
|---|---|---|---|
| K1 | Locale routing | Single `[locale]` tree + proxy **rewrite** of bare URLs to `/en/…` (URL never changes) | Duplicated English + locale trees (every future route added twice, drift); full-prefix-everywhere incl. English (breaks FR-4's "unprefixed = English"); optional-catch-all segments (fragile matching) |
| K2 | Catalog storage | **Neon `translations` table = single source of truth**; translations authored directly via SQL/migrations using Neon MCP; runtime reads DB | JSON dictionaries (violates constitution's DB-managed requirement); catalog files as intermediate source (unnecessary indirection, sync drift risk); runtime-only seeding (unreviewable diffs); ad-hoc sync scripts (MCP preferred) |
| K3 | i18n library | **None** — ~150-line in-house core (registry + loader + formatter) | next-intl et al. assume file catalogs + own routing; our hybrid + DB catalog fights them; new dependency needs approval anyway |
| K4 | Cache strategy | `unstable_cache` on the whole-dictionary fetch, **60s TTL**, plus React `cache()` per-request dedupe | Tag-based invalidation (founder's SQL edits bypass app tags → stale forever until manual tag bust); no cache (extra DB round-trip per render) |
| K5 | Fonts | `Noto Nastaliq Urdu` (display/headings/prose) + `Noto Sans Arabic` (UI chrome, labels, data) via `next/font/google`, subsets `arabic`; families applied only under RTL scopes so English never fetches them | Naskh everywhere (loses Nastaliq identity farmers expect); Nastaliq everywhere (clips at UI sizes, heavy); Jameel Noori/Gulzar (licensing + coverage unclear) |
| K6 | Client strings | Client components (auth forms, SiteHeader, CTA) receive **already-translated props** from their server shells; no catalog ships to the browser | Client-side dictionary loading (bundle bloat, dual fetch paths) |
| K7 | Cookie | `agro_locale=<slug>`, 1 year, `SameSite=Lax`, readable by JS (switcher/chip need it; non-sensitive) | httpOnly (chip dismissal + switcher highlight need JS access; nothing secret inside) |
| K8 | Testing | **Requesting approval to add `vitest` (devDependency)** for: registry tag/dir agreement, fallback resolution, digit formatting, proxy path parsing. UI verified by manual AC run-through | node:test without TS runner (repo is TS; adding tsx ≈ same weight as vitest); no tests (violates constitution's testing policy) |
| K9 | Digits | One `formatNumber(value, locale)` using `Intl.NumberFormat` with per-locale numbering (arabext for the seven); data tables accept the mono-font fallback for Eastern digits | Hardcoding digit conversion (locale bugs); keeping Western digits (contradicts approved spec) |

## File map (new/moved/touched)

```
proxy.ts                                  NEW  locale parse + rewrite-to-/en + cookie write
db/migrations/0001_translations.sql    NEW  translations table + seed data (INSERTs for all 8 locales)
lib/i18n/config.ts                        NEW  registry: 8 entries {slug, langTag, dir, nativeName, englishName} + guards
lib/i18n/server.ts                        NEW  server-only loader: getDictionary(locale) → t(); unstable_cache(60s) + cache()
lib/i18n/format.ts                        NEW  formatNumber/locale digits; localeHref(path, locale)
lib/i18n/logic.ts                         NEW  pure functions shared by server+tests (fallback resolution, prefix parsing)
components/language-switcher.tsx          NEW  client dropdown; native names; path/query/hash preserving
components/suggestion-chip.tsx            NEW  client; one-time dismissible اردو میں دیکھیں chip (English pages)
app/[locale]/layout.tsx                   NEW  emits <html lang dir>, font vars, localized-not-found boundary
app/[locale]/(pages…)                     MOVE existing page trees under [locale]; sections take dict/t props
app/layout.tsx                            EDIT becomes minimal shell (fonts registered; html attrs from params)
app/sitemap.ts                            NEW  all variants + alternates.languages
app/globals.css                           EDIT [dir=rtl] overrides (.eyebrow tracking/uppercase off, marquee flip),
                                               Arabic line-height/min-height rules, [data-flip-rtl] mirror rule
components/SiteHeader.tsx                 EDIT + switcher slot, logical utilities, translated strings
app/login|signup                          EDIT shells pass translated props; corner switcher; LTR field dirs
11 orphaned components                    EDIT translated like everything else (D5) — last batch
specs/language-compatibility/{research,spec}.md   already committed
adrs/0001-hybrid-locale-routing.md        NEW
adrs/0002-db-backed-translations.md       NEW
```

## Behavior notes the plan pins down

- **Rewrite, never redirect**: `/features` renders the `en` variant through an internal
  rewrite; crawlers/users only ever see bare URLs for English. Prefixed URLs render
  as-is. Invalid slugs fall through to `[locale]` validation → localized 404.
- **Link policy**: internal English links stay bare; locale links are
  `/{slug}{path}` via `localeHref()`. Switcher links disable prefetch.
- **Fallback rendering**: missing/empty value → English string wrapped with
  `lang="en" dir="ltr"`; dev builds additionally mark it visually; production doesn't.
- **RTL sweep**: replace physical utilities (`ml-/mr-/pl-/pr-/left-/right-/text-left`)
  with logical ones in every touched file; directional icons opt into mirroring via
  `data-flip-rtl`; grep gate added to review checklist.
- **Landing page stays fully `"use client"`** for now (out-of-scope refactor); its
  translated strings arrive as props from the server page. Same for CTA/EarlyAccess.
- **Seed flow**: translations are seeded via SQL migration files (INSERT statements)
  that populate the `translations` table with all 8 locales, applied through Neon
  MCP. Founder edits happen directly in the DB via MCP; no re-sync needed. Coverage
  tests verify all keys × 8 locales exist before merge.

## Build order (tasks follow after plan approval)

1. Registry + pure logic + tests · 2. Migration with seed data + empty translation
skeleton · 3. `[locale]` tree move + proxy + html lang/dir/fonts ·
4. Loader/formatter wired · 5. Switcher + chip · 6. Surface-by-surface extraction
(header → landing → marketing pages → auth → orphans), committing per surface ·
7. Metadata/hreflang/sitemap · 8. RTL polish pass + 320px audit · 9. Full AC run-through.

## Risks

- **~400 keys × 8 languages ≈ 3,200 rows** of AI-drafted copy to review — biggest time
  sink; mitigated by per-surface commits so review happens incrementally.
- Turbopack/LightningCSS logical-property minification bug (research §5.1): verify
  compiled CSS after any tooling upgrade.
- Google-served Nastaliq subset coverage for sd/ps/bal special letters: glyph spot-test
  per language before sign-off (test sentences included in catalog).
