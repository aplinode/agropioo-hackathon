# Project Rules — agropioo

## Constitution

> Phase 0 — persistent rules above every spec and build. Amended through founder interview, 2026-08-23. Sources: `docs/Agropioo Tech Stack.md`, `docs/brand-identity.md`, `docs/brand-colors.md`, `docs/information-architecture.md`.

### Principles

- Farmer-first copy: lead with what the farmer does and gains ("what to do, when to do it"), not technology. Plain language over cleverness. A new contributor should understand any file in 5 minutes.
- Pakistan-first: local languages, crops, practices, and conditions are product requirements, not i18n afterthoughts.
- Reuse before adding: existing components, tokens, and libraries win; new dependencies require approval (see Dependencies).
- Every feature ships with its spec in `specs/<feature>/spec.md`. The spec is the source of truth; code is its output.

### Language policy (confirmed)

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

- Local languages roll out in priority order above (Urdu first, then by speaker share).
- A visible language switcher lives in the nav everywhere — public pages, `/signup`, `/login`, and inside the farmer app — not hidden in settings. Language chosen before/during signup carries into onboarding as the pre-selected default.
- Translated strings are managed in the database (admin-editable), not hardcoded dictionary files.
- Urdu and Pashto render right-to-left with mirrored layout from the moment each ships.
- Voice input/output for the advisor is out of scope for now; text chat only until separately specced.

### Git workflow

- Hybrid branching: tiny fixes commit directly to `main`; multi-file features work on a feature branch merged via PR.
- Review is solo: the founder reviews every diff against the spec before merge.
- Commit after every completed change; push at feature milestones. Never end a working session with uncommitted changes.
- Atomic commits only: one commit = one logical unit of work. A single feature across many files (code + its spec/tests) is ONE commit; an unrelated fix, refactor, or dependency bump made alongside it is its OWN commit. Revert test: if reverting one part would break the others, they belong together; if each stands alone, split.
- Meaningful messages, imperative mood (`feat: add farm record form`), describing the change not the activity. Never "update", "changes", "fix stuff". Never mix unrelated files.

### Stack & architecture (fixed)

- Full-stack Next.js. Route Handlers ARE the API layer — no separate Express/Node backend. Form submissions also go through Route Handlers; Server Actions are not used.
- Supabase is the PostgreSQL database ONLY (no Supabase Auth, Storage APIs, or Edge Functions). Data access always flows Client → Route Handler → Supabase; never client-to-DB directly.
- One shared database client module (`lib/supabase.ts`). All handlers import from it — no ad-hoc clients.
- Schema changes live as migration files in the repo, applied in order. Dashboard-only schema edits are not allowed.
- TypeScript + Tailwind CSS v4 stay. React Server Components by default.
- This is NOT stock Next.js — read the relevant guide in `node_modules/next/dist/docs/` before writing any code (see block below).

### Chosen libraries (do not substitute)

Password hashing `bcryptjs` · JWT sessions `jose` · email `nodemailer` + SMTP provider · validation `zod` · forms `react-hook-form` + `@hookform/resolvers`. Anything outside this table plus what is already installed requires approval before install.

### Security & API rules

- Zod validates every route-handler input before it reaches the database — query params and body alike.
- Passwords are hashed with bcryptjs, never stored or logged in plaintext.
- The JWT lives in an httpOnly, Secure, SameSite cookie, unreadable from client JavaScript.
- Secrets exist only in env vars, read server-side only. Never committed, never logged. `.env.example` lists every required variable with placeholder values and stays up to date.
- Uniform error shape: every route handler returns `{ error: { code, message } }` with a proper HTTP status. No ad-hoc error formats.
- Basic per-IP rate limiting protects auth routes (signup, login, forgot-password) from the start.
- Authorization checks happen server-side in handlers; the client is never trusted.

### Code conventions

- Server-first components: every component is a Server Component unless it needs interactivity; those get `"use client"` at the smallest possible boundary.
- Components split by feature: shared UI lives in `components/`; feature-specific pieces sit near their route. No dumping ground.
- TypeScript strict mode, zero escapes: no `any`, no non-null assertions (`!`), no `@ts-ignore`/`@ts-expect-error`.

### Design system & accessibility

- Light mode only; `--agro-night` reserved for future dark mode.
- Colors come only from `--color-agro-*` tokens (`docs/brand-colors.md`) — never inline hex; missing values get added to `@theme` first. Greens dominate; exactly ONE harvest-gold (`--agro-wheat`) conversion moment per page, with dark forest text on it (white fails contrast).
- Typography: Playfair Display sparingly (one–two display moments/page), DM Sans body, IBM Plex Mono/JetBrains Mono for data. Headings roman, sentence case.
- Icons from the shared SVG set (`components/icons.tsx`); no emoji as icons.
- UI honesty: no invented metrics, testimonials, logos, or fabricated stats anywhere. Aspirational projections are never rendered as proven results.
- Accessibility is outdoor-mobile: body text ≥ 4.5:1 contrast, touch targets ≥ 44×44px, visible focus rings never animated in, `prefers-reduced-motion` respected, no horizontal scroll at 320px.

### Testing policy

Logic gets automated tests (Zod schemas + route handlers); UI is verified by manual run-through of acceptance criteria. "Verify" is never the skipped step either way.

### Dependencies & decisions

- New dependency rule: ask first, always. Propose package + reason + maintenance weight, wait for explicit yes. Never silently install.
- Significant architecture decisions get a short ADR in `adrs/` (context → decision → consequences): e.g. LLM provider, map library, queue.
- The LLM provider for AI features is decided per-feature in that feature's plan — not pinned here.

### Hackathon build order (demo scope)

1. `/onboarding` · 2. `/dashboard` · 3. `/farms` + records · 4. `/advisor` (text chat) · 5. `/detect` · 6. `/prices` · 7. `/schemes`

Out of scope for demo: expert/agronomist role, community forum, IVR phone mode, SMS alerts, voice input, dark mode.

### Definition of done

A change is done when ALL hold:

- Behaviour matches the spec including edge cases; acceptance criteria actually checked (tests or manual run-through).
- `npm run lint` and `npm run build` pass.
- The diff has been reviewed against the spec (solo review counts).
- Committed atomically with a meaningful message; pushed if a feature milestone.

## Spec-Driven Development (SDD)

Full course: `docs/spec-drvien-dev.md`. Thesis: **the spec is the source of truth; code is a build output.** Agree on the **what** before generating the **how**.

### The loop: Constitution → Research → Specify → Clarify → Build

1. **Research before writing.** Never spec from a blank page. Investigate separately: how this is usually done, main approaches + trade-offs, what in this repo it must fit (read the code, respect Next.js conventions in the block below), failure modes/edge cases. Output = findings doc (`specs/<feature>/research.md`). No design, no code.
2. **Specify (`spec.md`)** — six sections, always:
   - Goal (the why, 2–3 sentences)
   - User scenarios ("when user does X, they get Y")
   - Functional requirements (each specific enough that a build ignoring it visibly fails)
   - Edge cases & rules (empty, huge, duplicate, malformed, unauthorized)
   - Out of scope (what this does NOT do — never skip)
   - Acceptance criteria (the checklist that says done)
   - **NO HOW:** no database, framework, file layout, or tech choices — that belongs to the plan. Implementation detail in a spec is a bug.
   - Precision test per line: could a competent person build the wrong thing and still technically satisfy this line? Then tighten it.
3. **Clarify by interview — never skip.** Before building anything, interview the user about the spec: one question at a time, ambiguities, missing edge cases, unstated assumptions, until the spec could be handed to a stranger and built correctly. Fold every answer back into the spec. This is the cheapest place to fix mistakes.
4. **Build, right-sized:**
   - One-sentence fix → just do it, no plan.
   - Uncertain approach / few files → propose plan first; human reviews before any code.
   - Multi-file/architectural → plan → small checkable steps → verify each step vs spec → commit after each step.
   - Convert acceptance criteria into real checks (tests, or manual run-through). Code that runs ≠ code that agrees. Verify is never the skipped step.
   - Periodic design pass: list files touched, rules written twice, names that lie. Read the code yourself.

### Keeping the spec true

- Behaviour changes? **Edit the spec FIRST, then re-derive the code.** Spec diff and code diff ship in the SAME commit.
- Found a gap mid-build? Stop → fix spec → continue.
- Drift recovery: paste the ignored FR, shrink task to only that, re-check acceptance criteria.
- Specs live in `specs/`. Check they still agree with each other; conflicts are settled by these rules.

### Judgment

- Full SDD when: multi-file/state/permissions/data/money, maintained later, fuzzy requirements, multiple stakeholders.
- Just vibe when: throwaway script, tiny tweak, exploring to learn what you want.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
