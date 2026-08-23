# Project Rules — agropioo

## Constitution

> Phase 0 — persistent rules above every spec and build. Sources: `docs/Agropioo Tech Stack.md`, `docs/brand-identity.md`, `docs/brand-colors.md`, `docs/information-architecture.md`.

### Principles

- Farmer-first copy: lead with what the farmer does and gains, not technology. Plain language over cleverness.
- Pakistan-first: Urdu, Punjabi, Saraiki, Pashto, Balochi, Hindko support is a product requirement, not an i18n afterthought.
- Reuse before adding: existing components, tokens, and libraries win; propose new dependencies, never silently add them.
- Every feature ships with its spec in `specs/<feature>/spec.md`. The spec is the source of truth; code is its output.

### Constraints

- Stack is fixed: full-stack Next.js (Route Handlers ARE the API layer — no separate Express backend), TypeScript, Tailwind CSS v4.
- Supabase is the PostgreSQL database ONLY. Data access always flows Client → Route Handler → Supabase; never client-to-DB directly.
- Chosen libraries for upcoming features (do not substitute): auth hashing `bcryptjs`, JWT `jose`, email `nodemailer` + SMTP provider, validation `zod`, forms `react-hook-form` + `@hookform/resolvers`.
- Zod validates every route-handler input before it reaches the database. Passwords are hashed, never stored plaintext.
- Secrets live only in env vars, read server-side only. Never commit secrets; never log them.
- Colors come only from `--color-agro-*` tokens (`docs/brand-colors.md`) — never inline hex. Light mode; greens dominate; exactly ONE harvest-gold (`--agro-wheat`) conversion moment per page, with dark forest text on it (white fails contrast).
- Typography: Playfair Display sparingly (one–two display moments/page), DM Sans body, IBM Plex Mono/JetBrains Mono for data. Headings roman, sentence case.
- Accessibility is outdoor-mobile: body text ≥ 4.5:1 contrast, touch targets ≥ 44×44px, visible focus rings, `prefers-reduced-motion` respected, no horizontal scroll at 320px.
- UI honesty: no invented metrics, testimonials, logos, or fabricated stats. Icons from the shared SVG set (`components/icons.tsx`); no emoji as icons.
- This is NOT stock Next.js — read the relevant guide in `node_modules/next/dist/docs/` before writing any code (see block below).

### Definition of done

- Behaviour matches the spec including edge cases; acceptance criteria actually checked (tests or manual run-through).
- `npm run lint` and `npm run build` pass.
- A human has reviewed the diff against the spec before merge.
- After every completed change, commit AND push immediately. Never end a turn with uncommitted work.
- Atomic commits only: one commit = one logical unit of work. A single feature across many files (code + its spec/tests) is ONE commit; an unrelated fix, refactor, or dependency bump made alongside it is its OWN commit. Revert test: if reverting one part would break the others, they belong together; if each stands alone, split.
- Meaningful messages, imperative mood (`feat: add farm record form`), describing the change not the activity. Never "update", "changes", "fix stuff". Never mix unrelated files.

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
