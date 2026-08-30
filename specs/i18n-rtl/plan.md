# Plan — Platform localization & RTL (merged)

Basis: `spec.md` (merged; conflicts C1–C4 table for founder ruling) + `research.md`.
How ownership: this doc. Status: **site + auth ledger is SHIPPED** (§A); the
**farmer-app plan is the active work** (§B). Every task ends verified against the
spec and committed (Phases are founder-gated per AGENTS.md).

## A. Shipped ledger — site + auth (record, not work)

What actually shipped for the public experience, per `archive/language-compatibility/`:

- **`proxy.ts`** bare→`/en/*` internal rewrite; prefixed slugs pass through; farmer
  paths excluded; unknown slug falls to localized 404.
- **`lib/i18n/config.ts`** registry (8 identity triples + `hreflang` + cookie name);
  **`lib/i18n/logic.ts`** pure core (`splitLocalePrefix`, `localeHref`,
  `switchedPathname`, `resolveAppLocale`, `resolveString`, `formatMessage`);
  **`lib/i18n/server.ts`** `getDictionary` + typed bundles; **`lib/i18n/resolve.ts`**
  site fast-path; **`lib/i18n/format.ts`** (`formatNumber`, `formatCount`,
  `formatRelativeTime`); **`lib/i18n/localized.tsx`** bidi-safe fallback wrapper.
- **`catalog/*.ts`** typed key trees (en source + 7 mirrors) + `catalog.test.ts` +
  **`scripts/sync-translations.mts`** upserting into Neon `translations`
  — the evolved answer to the archived "no catalog files" rule (**C1**).
- **`language-switcher.tsx`** with `currentLocale` app mode, **`suggestion-chip.tsx`**,
  `(site)/[locale]/*` tree, metadata/hreflang/sitemap.
- **Farmer** `(farmer)/layout.tsx` (cookie → `lang/dir`/metadata, `force-dynamic`),
  ADR `0004`.
- Legacy notes: the archived site plan's `adrs/0001`/`0002` were never written as
  files — the decisions were recorded in code headers and ADR 0004; grandfathering
  them into this folder's spec (FR-04..FR-07, FR-13..FR-16) is sufficient.

## B. Active plan — farmer-app localization (whole app, one release — D6)

Architecture decisions (carried from `archive/dashboard-i18n/plan.md` rev 3):

- **D1 Route model** — cookie-driven (ADR 0004): bare URLs stay, proxy matcher
  untouched; `(farmer)` layout resolves `agro_locale` via `resolveAppLocale`
  (invalid ⇒ en). *SHIPPED (T1).*
- **D2 Dictionary delivery** — Neon `translations` single source; `catalog/*.ts`
  authored via the sync script / MCP (C1 ruled: ratify shipped model); runtime
  `getDictionary`; client views get typed `*Bundle` prop sets from thin server
  shells. *Helpers SHIPPED; per-surface consumption pending.*
- **D3 Advisor data model** — per-locale reply `body` + per-locale `triggers` under
  `app.advisor.replies.<id>.*`; matcher checks active locale, EN floor.
- **D4 Numbers & times** — everything through `format.ts` (incl. `formatRelativeTime`,
  shipped T3.5); mono data cells get `Noto Sans Arabic` appended (C3 ruled: Eastern
  digits everywhere, Western only in English).
- **D5 Script-safe type + overflow** — `[dir="rtl"]` letter-spacing kill-switch,
  Nastaliq leading ≥1.9, audit removes `line-clamp`/`truncate`+fixed-height on
  translated text, strict FR-19 overflow hierarchy.
- **D6 Validation errors** — farm-form/record-form/detect-upload onto the
  literal→key map (`ERROR_KEYS`) pattern.
- **D7 Auth-adjacent** — cross-links to forgot/reset/verify point at the bare app
  routes (kills the `/ur/forgot-password` 404 family); localized public pages seed
  the cookie with their URL language before navigating so the reset flow speaks the
  selected language end-to-end (C2 ruled); signup→onboarding redirect; onboarding
  rebuilt registry-driven with `localStorage` cleanup; settings list from registry;
  locale-aware `generateMetadata` everywhere.
- **D8 Alignment & responsiveness** — logical-edges grep gate, content-sized
  controls (`min-w-*` + `px-*`), flexible grids (`grid-cols-1 sm:2 lg:3`, `min-w-0`,
  farms row `flex flex-wrap`), `data-flip-rtl` icon opt-in, `localized()` wraps for
  mixed-direction rows, T12.5 RTL stress pass at 4 widths.

Task board (status verified at merge):

| # | Task | Status at merge | Keys |
|---|---|---|---|
| T1 | ADR 0004 + `resolveAppLocale` + farmer layout lang/dir/fonts/metadata | **SHIPPED** (fonts application re-verify) | ~2 |
| T2 | Switcher `variant="app"` (`currentLocale` prop, same-path reload) | **SHIPPED** | 0 |
| T3 | Typography guards + overflow hierarchy + login eyebrow fix + line-clamp audit | PENDING — verify `[dir="rtl"]` tracking kill-switch exists | 0 |
| T3.5 | `formatRelativeTime` | **SHIPPED** (+ tests) | 0 |
| T4 | Shell + dashboard surface (`app.shell.*`/`app.dashboard.*`, views consume bundles, D8 sweep) | PARTIAL — bundles exist; view adoption + D8 to verify | ~115 |
| T5 | Farms suite (list/new/detail/records, D6 error maps, wrap row) | PARTIAL — `getFarmsBundle` exists | ~155 |
| T6 | Detect + notifications | PARTIAL — detect bundle exists; notifications unknown | ~50 |
| T7 | Prices + weather (format-helper migration, mixed-direction isolation) | PENDING | ~80 |
| T8 | Advisor (D3 restructure + per-locale matcher + chat UI) | PARTIAL — bundle exists; matcher restructure pending | ~40 |
| T9 | Settings + More (registry list, remaining copy) | PENDING — stale list verified present | ~40 |
| T10 | Verify/forgot/reset/onboarding (D7; blocked on C2) | PENDING — wrong codes + localStorage verified | ~60 |
| T11 | Full DB verification (counts ((~672+N)×8), SQL spot-checks) | PENDING | — |
| T12 | Gates: lint/tsc/tests/build + automated AC checks | PENDING | — |
| T12.5 | RTL stress pass (FR-32/AC-20/21), record in `specs/i18n-rtl/verification.md` | PENDING | — |
| T13 | Manual AC run-through (AC-08..AC-21) → `verification.md` | PENDING | — |

New/moved files on top of the shipped ledger:

```
lib/i18n/server.ts          EDIT: remaining *Bundle builders
catalog/*.ts                EDIT: app.* keys (per task, via sync script + MCP)
app/(farmer)/**             EDIT per T4–T10 (views consume bundles, D5/D8 sweeps)
app/(site)/[locale]/**      EDIT: login/signup cross-links → bare auth paths (D7, C2)
app/(farmer)/onboarding/    REBUILD: registry list, no localStorage, redirect target
specs/i18n-rtl/verification.md   NEW: T12.5/T13 results
```

Flow: for each task — seed its `app.*` keys (8 locales) → write bundles → wire views
→ verify (smoke both locales + grep/logical/width audits) → commit. Missing rows
fall back to English, so partial states never break.

## Risks & contingencies

- **Translation volume is the long pole** (~500 keys × 7). Keys seeded per task;
  translations batched; DB-first means no sync drift.
- **Nastaliq clipping/overflow** may surface component fixes during T12.5/T13 —
  handled per D5 hierarchy, not scope creep.
- **RTL responsiveness sweep** may miss data-heavy edges — T12.5 with real longest
  strings is the safety net; any fix that breaks English parity (FR-20) regresses.
- **Site regression risk low** — T1..T10 touch `(farmer)` + catalog; marketing stays
  URL-driven.
- **Collaborator overlap** — pull-rebase before every push; their merged intent wins
  on collision (constitution).
- **Unverified statuses** in the board above must be confirmed before each task
  starts (the merge only compared docs against a code snapshot).