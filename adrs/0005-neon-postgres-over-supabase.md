# ADR 0005 — Lakebase Postgres on Neon replaces Supabase as the core database

Date: 2026-08-29 · Status: accepted

## Context

The application was originally built against Supabase using only its PostgreSQL
database surface — no Supabase Auth, Storage, Edge Functions, or Realtime. All
data access flows through Next.js Route Handlers, with the Supabase JavaScript
client acting as a query transport. That arrangement works, but it couples the
project to a Backend-as-a-Service (BaaS) contract even though we only need a
managed Postgres database.

Neon provides Lakebase Postgres as a standalone, branchable, serverless Postgres
service. Because our architecture already treats the database as a plain
PostgreSQL backend accessed through server-side handlers, moving to Neon removes
the unused BaaS abstraction while keeping the same data model and access
patterns.

## Decision

1. **Neon Lakebase Postgres is the application's core database.** Supabase is
   retired as a dependency; the `@supabase/supabase-js` client and
   `SUPABASE_*` environment variables are removed.
2. **Database access uses `@neondatabase/serverless`.** Route handlers and
   scripts execute SQL through a single shared client module (`lib/db.ts`),
   replacing the previous `lib/supabase.ts` Supabase client.
3. **Migrations live in `db/migrations/` and are applied directly to the active
   Neon branch.** The previous `supabase/migrations/` directory is archived under
   `archive/supabase/` for history.
4. **Environment variables follow Neon's pulled shape:** `DATABASE_URL` (pooled,
   for application queries), `DATABASE_URL_UNPOOLED` (for migrations and admin
   tasks), and `NEON_BRANCH`.
5. **Auth, row-level security, and business logic remain in the application
   layer.** Neon is used as Postgres only; no Neon Auth or other primitives are
   introduced unless a future feature explicitly requires them.

## Consequences

+ Removes an unused BaaS dependency while preserving a fully managed,
  branchable, serverless Postgres database.
+ Simplifies the mental model: the application talks to Postgres, not to a
  Supabase-specific API.
+ Enables branch-first development via the Neon CLI (`neon checkout`) and
  per-branch environment variables.
− Requires rewriting existing Supabase query-builder calls to SQL.
− Migrations and connection strings must be managed directly instead of through
  Supabase's dashboard and tooling.
