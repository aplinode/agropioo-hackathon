# Agropioo — Constitution

> Phase 0 of Spec-Driven Development (`docs/spec-drvien-dev.md`). These are the persistent project-wide rules that sit above every spec and build. The compact operational copy lives in `AGENTS.md`; **this document is the authoritative, detailed source.** Where a spec conflicts with this constitution, the constitution wins.

**Sources:** `Agropioo Tech Stack.md` · `brand-identity.md` · `brand-colors.md` · `information-architecture.md` · `Agropioo_Project_Documentation.md` · founder interviews (2026-08-23).

---

## 1. Principles

1. **Farmer-first copy.** Lead with what the farmer does and gains ("what to do, when to do it"), never with technology. Plain language over cleverness. A new contributor should understand any file in 5 minutes.
2. **Pakistan-first.** Local languages, crops, practices, and conditions are product requirements, not i18n afterthoughts.
3. **Reuse before adding.** Existing components, tokens, and libraries win. New dependencies require approval (see §9).
4. **Spec-driven.** Every feature ships with its spec in `specs/<feature>/spec.md`. The spec is the source of truth; code is its output. Behaviour changes go into the spec FIRST, then re-derive the code — spec diff and code diff ship in the same commit.

## 2. Language policy (confirmed)

Pakistan-first is grounded in confirmed speaker shares:

| Priority | Language | Speakers | Region |
|---|---|---|---|
| — | English | — | Default UI language at launch |
| 1 | Urdu | ~9% | National language, nationwide lingua franca |
| 2 | Punjabi | ~37% | Dominant in Punjab |
| 3 | Pashto | ~18% | Dominant in Khyber Pakhtunkhwa |
| 4 | Sindhi | ~14% | Dominant in Sindh |
| 5 | Saraiki | ~12% | Southern Punjab |
| 6 | Balochi | ~3% | Dominant in Balochistan |
| 7 | Hindko | ~2% | Hazara, northern Punjab |

Rules:

- **English is the default product language.** Local languages roll out in the priority order above (Urdu first, then by speaker share).
- **A visible language switcher lives in the nav everywhere**, including public pages — not hidden in settings.
- Translated strings are **managed in the database** (admin-editable), not hardcoded dictionary files.
- **Urdu and Pashto render right-to-left** with mirrored layout from the moment each ships. RTL is not a fast-follow.
- Voice input/output for the advisor is **out of scope for now**; text chat only until separately specced.

## 3. Git workflow

- **Hybrid branching.** Tiny fixes commit directly to `main`. Multi-file features work on a feature branch merged back via PR.
- **Review is solo:** the founder reviews every diff against the spec before merge; there is no second reviewer during the hackathon.
- **Commit after every completed change** — even small ones. **Push at feature milestones** (not necessarily per-commit). Never end a working session with uncommitted changes.
- **Atomic commits only.** One commit = one logical unit of work. A single feature across many files (code + its spec/tests) is ONE commit; an unrelated fix, refactor, or dependency bump made alongside it is its OWN commit. Revert test: if reverting one part would break the others, they belong together; if each stands alone, split them.
- **Meaningful messages,** imperative mood (`feat: add farm record form`), describing the change not the activity. Never "update", "changes", "fix stuff". Never mix unrelated files.

## 4. Stack & architecture (fixed)

- **Full-stack Next.js.** Route Handlers ARE the API layer — no separate Express/Node backend. Form submissions also go through Route Handlers; Server Actions are not used.
- **Supabase is the PostgreSQL database ONLY** (no Supabase Auth, no Supabase Storage APIs, no Edge Functions).
- **Data access flows Client → Route Handler → Supabase.** Never client-to-database directly.
- **One shared database client module** (`lib/supabase.ts`). All handlers import from it — no ad-hoc clients per handler.
- **Schema changes live as migration files in the repo**, applied in order. The schema is version-controlled; dashboard-only edits are not allowed.
- TypeScript + Tailwind CSS v4 stay. React Server Components by default.

## 5. Chosen libraries (do not substitute)

| Concern | Library |
|---|---|
| Password hashing | `bcryptjs` |
| JWT sessions | `jose` |
| Email | `nodemailer` + SMTP provider |
| Input validation | `zod` |
| Forms | `react-hook-form` + `@hookform/resolvers` |

Anything outside this table plus what is already installed requires approval before install (§9).

## 6. Security & API rules

- **Zod validates every route-handler input** before it reaches the database — query params and body alike.
- **Passwords are hashed** with bcryptjs, never stored or logged in plaintext.
- **The JWT lives in an httpOnly, Secure, SameSite cookie.** It must be unreadable from client JavaScript.
- **Secrets exist only in env vars, read server-side only.** Never committed, never logged, never sent to the client. `.env.example` lists every required variable with placeholder values and stays up to date.
- **Uniform error shape.** Every route handler returns `{ error: { code, message } }` with a proper HTTP status code. No ad-hoc error formats.
- **Basic per-IP rate limiting protects auth routes** (signup, login, forgot-password) from the start.
- Authorization checks happen server-side in handlers; the client is never trusted.

## 7. Code conventions

- **Server-first components:** every component is a Server Component unless it needs interactivity (forms, state, effects); those get `"use client"` at the smallest possible boundary.
- **Components split by feature:** shared/reused UI lives in `components/`; feature-specific pieces sit near their route. No dumping ground.
- **TypeScript strict mode with zero escapes:** no `any`, no non-null assertions (`!`), no `@ts-ignore`/`@ts-expect-error`.
- **This is NOT stock Next.js:** read the relevant guide in `node_modules/next/dist/docs/` before writing code for any Next.js area (routing, data fetching, route handlers, caching).

## 8. Design system (brand-locked)

- **Light mode only.** `--agro-night` is reserved for future dark mode.
- Colors come ONLY from `--color-agro-*` tokens (`docs/brand-colors.md`) — never inline hex. If a value is missing, add it to `@theme` first.
- Greens dominate. Exactly ONE harvest-gold (`--agro-wheat`) conversion moment per page, always with dark forest text on it (white fails contrast).
- Typography: Playfair Display sparingly (one–two display moments per page), DM Sans body, IBM Plex Mono/JetBrains Mono for data. Headings roman, sentence case.
- Icons come from the shared SVG set (`components/icons.tsx`). No emoji as icons.
- **UI honesty:** no invented metrics, testimonials, logos, or fabricated stats anywhere. Aspirational impact projections from feature docs are never rendered as proven results.

## 9. Accessibility (outdoor-mobile)

- Body text ≥ 4.5:1 contrast (aim higher).
- Touch targets ≥ 44×44px.
- Visible focus rings, never animated in.
- `prefers-reduced-motion` respected.
- No horizontal scroll at 320px viewport width.

## 10. Testing policy

- **Logic gets automated tests:** Zod schemas and route handlers are unit-tested. 
- **UI is verified manually:** acceptance criteria checked by run-through per feature.
- Acceptance criteria become real checks either way — "verify" is never the skipped step.

## 11. Dependencies & decisions

- **New dependency rule: ask first, always.** The agent proposes package + reason + maintenance weight and waits for an explicit yes. Never silently install.
- **Significant architecture decisions get an ADR** in `adrs/` (numbered, short: context → decision → consequences). Examples: picking the LLM provider, choosing a map library, adding a queue.
- **LLM provider for AI features is decided per-feature** in that feature's plan — the constitution does not pin it.

## 12. Hackathon build order (demo scope)

Builds follow the demo priority from `information-architecture.md`:

1. `/onboarding`
2. `/dashboard`
3. `/farms` + records
4. `/advisor` (text chat)
5. `/detect` (disease detection)
6. `/prices` (mandi tracker)
7. `/schemes` (scheme matcher)

Out of scope for the demo: expert/agronomist role, community forum, IVR phone mode, SMS alerts, voice input, dark mode.

## 13. Definition of done

A change is done when ALL of these hold:

- [ ] Behaviour matches the spec including edge cases; acceptance criteria actually checked (tests or manual run-through).
- [ ] `npm run lint` and `npm run build` pass.
- [ ] The diff has been reviewed against the spec (solo review counts).
- [ ] Committed atomically with a meaningful message; pushed if a feature milestone.

---

*Amended through founder interview, 2026-08-23. Changes to this constitution follow the same SDD rule as specs: edit first, then re-derive.*
