<!--
Sync Impact Report
Version change: none → 1.0.0
Modified principles: N/A (initial constitution from placeholders)
Added sections: Core Principles (6), Non-Negotiable Constraints, Quality Gates & Definition of Done, Governance
Removed sections: N/A
Templates requiring updates: ✅ aligned (plan-template.md, spec-template.md, tasks-template.md already compatible)
Follow-up TODOs: None
-->
# Agropioo Constitution

## Table of Contents

- [Core Principles](#core-principles)
  - [I. Farmer-First](#i-farmer-first)
  - [II. Pakistan-First, Global-Ready](#ii-pakistan-first-global-ready)
  - [III. Spec-Driven Development](#iii-spec-driven-development)
  - [IV. Stack Discipline & Reuse](#iv-stack-discipline--reuse)
  - [V. Security & Data Integrity](#v-security--data-integrity)
  - [VI. Accessibility & Outdoor-Mobile Design](#vi-accessibility--outdoor-mobile-design)
- [Non-Negotiable Constraints](#non-negotiable-constraints)
- [Quality Gates & Definition of Done](#quality-gates--definition-of-done)
- [Governance](#governance)
- [Changelog](#changelog)

## Core Principles

### I. Farmer-First

Every feature, message, and decision must lead with what the farmer does and gains. Plain language over cleverness. A new contributor should understand any file in 5 minutes.

### II. Pakistan-First, Global-Ready

Pakistan is the initial market; local languages, crops, practices, and conditions are product requirements, not i18n afterthoughts. The platform ships in English first, with Urdu as priority 1, then Punjabi, Pashto, Sindhi, Saraiki, Balochi, and Hindko. Urdu and Pashto render right-to-left with mirrored layout from the moment each ships. Translated strings are managed in the database (admin-editable), not hardcoded dictionary files.

### III. Spec-Driven Development

Every feature ships with its spec in `specs/<feature>/spec.md`. The spec is the source of truth; code is its output. Phase order is strict and non-negotiable: research findings (`specs/<feature>/research.md`) → `spec.md` → clarify-by-interview (answers folded back into the spec) → `plan.md` → task breakdown → implement one task at a time. Never start building before the spec is clarified and the plan is approved; never write code during research or specify phases. Found a gap mid-build? Stop → fix spec → continue.

### IV. Stack Discipline & Reuse

Full-stack Next.js. Route Handlers ARE the API layer — no separate Express/Node backend. Form submissions also go through Route Handlers; Server Actions are not used. Neon Lakebase Postgres is the PostgreSQL database. Data access always flows Client → Route Handler → Postgres; never client-to-DB directly. One shared database client module (`lib/db.ts`). All handlers import from it — no ad-hoc clients. Schema changes live as migration files in the repo, applied in order.

Chosen libraries: `bcryptjs` for password hashing, `jose` for JWT sessions, `nodemailer` + SMTP for email, `zod` for validation, `react-hook-form` + `@hookform/resolvers` for forms. New dependencies require approval before install. Server-first components by default; interactive pieces get `"use client"` at the smallest possible boundary. Components split by feature: shared UI in `components/`, feature-specific near their route.

TypeScript strict mode, zero escapes: no `any`, no `!` assertions, no `@ts-ignore` or `@ts-expect-error`.

### V. Security & Data Integrity

Zod validates every route-handler input before it reaches the database — query params and body alike. Passwords are hashed with bcryptjs, never stored or logged in plaintext. The JWT lives in an httpOnly, Secure, SameSite cookie, unreadable from client JavaScript. Secrets exist only in env vars, read server-side only. Never committed, never logged. `.env.example` lists every required variable with placeholder values and stays up to date.

Uniform error shape: every route handler returns `{ error: { code, message } }` with a proper HTTP status. No ad-hoc error formats. Basic per-IP rate limiting protects auth routes (signup, login, forgot-password) from the start. Authorization checks happen server-side in handlers; the client is never trusted.

### VI. Accessibility & Outdoor-Mobile Design

Light mode only; `--agro-night` reserved for future dark mode. Colors come only from `--color-agro-*` tokens — never inline hex; missing values get added to `@theme` first. Greens dominate; exactly ONE harvest-gold (`--agro-wheat`) conversion moment per page, with dark forest text on it (white fails contrast). Typography: Playfair Display sparingly (one–two display moments/page), DM Sans body, IBM Plex Mono/JetBrains Mono for data. Headings roman, sentence case. Icons from the shared SVG set (`components/icons.tsx`); no emoji as icons.

Accessibility is outdoor-mobile: body text ≥ 4.5:1 contrast, touch targets ≥ 44×44px, visible focus rings never animated in, `prefers-reduced-motion` respected, no horizontal scroll at 320px.

## Non-Negotiable Constraints

- Full-stack Next.js with Route Handlers as the API layer; no separate Node.js/Express backend.
- Neon Lakebase Postgres as the sole PostgreSQL provider; data access strictly Client → Route Handler → Postgres.
- One shared database client module (`lib/db.ts`) — no ad-hoc clients.
- TypeScript strict mode with zero escapes (`any`, `!`, `@ts-ignore` forbidden).
- Chosen libraries only: `bcryptjs`, `jose`, `nodemailer`, `zod`, `react-hook-form`, `@hookform/resolvers`. Any addition requires approval.
- Server-first components; `"use client"` only at the smallest interactive boundary.
- Components split by feature: shared UI in `components/`, feature-specific near their route.
- UI honesty: no invented metrics, testimonials, logos, or fabricated stats anywhere. Aspirational projections are never rendered as proven results.

## Quality Gates & Definition of Done

- Logic gets automated tests (Zod schemas + route handlers); UI is verified by manual run-through of acceptance criteria.
- "Verify" is never the skipped step either way.
- A change is done when ALL hold:
  1. Behaviour matches the spec including edge cases; acceptance criteria actually checked (tests or manual run-through).
  2. New or updated UI strings have translation keys inserted in the Neon `translations` table for all 8 locales before merge.
  3. `npm run lint` and `npm run build` pass.
  4. The diff has been reviewed against the spec (solo review counts).
  5. Committed atomically with a meaningful message; pushed if a feature milestone.

## Governance

This constitution supersedes all other practices. Amendments require documentation, founder approval, and a migration plan. All diffs are reviewed against the constitution before merge. Complexity must be justified; use `docs/` for runtime development guidance.

Versioning follows semantic versioning: MAJOR for backward-incompatible governance or principle removals, MINOR for new principles or materially expanded guidance, PATCH for clarifications and wording fixes.

Compliance is solo: the founder reviews every diff against the spec and constitution before merge. Atomic commits only — one commit = one logical unit of work. Commit after every completed change; push at feature milestones. Pull before every commit-and-push: `git pull --rebase origin main`. If the pull surfaces conflicts, merge safely: never override collaborator commits; reconcile around their intent, then verify gates before pushing.

**Version**: 1.0.0 | **Ratified**: 2026-08-30 | **Last Amended**: 2026-08-30

## Changelog

### [1.0.0] - 2026-08-30

**Added**
- Initial constitution from placeholders
- Core Principles: Farmer-First, Pakistan-First, Spec-Driven Development, Stack Discipline & Reuse, Security & Data Integrity, Accessibility & Outdoor-Mobile Design
- Non-Negotiable Constraints
- Quality Gates & Definition of Done
- Governance rules and versioning policy
