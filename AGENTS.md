# Project Rules — agropioo

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
