-- 0002 — Authentication schema (specs/authentication/plan.md)
-- Supabase is Postgres ONLY — no Supabase Auth. All access flows through
-- Next.js Route Handlers using the anon key server-side, so no RLS yet.
-- NOTE: user accounts table is named `users` (founder decision 2026-08-24;
-- plan.md's `accounts` was renamed before first apply).

create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  full_name      text not null,
  phone          text,
  password_hash  text not null,
  email_verified boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists users_email_lower_idx on public.users (lower(email));

-- One row per issued pass JWT; jti = JWT jti. Holds the mutable truth:
-- consumed? dead? reset stage? cumulative wrong attempts?
create table if not exists public.pass_states (
  jti         uuid primary key,
  kind        text not null check (kind in ('verify','reset')),
  email       text not null,
  account_id  uuid references public.users(id),
  stage       text not null default 'pending' check (stage in ('pending','code_verified')),
  wrong_total integer not null default 0,
  consumed_at timestamptz,
  dead_at     timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- 6-digit codes stored as sha256 hex. purpose isolation (FR15), last-code-wins
-- via voided_at, 5-wrong-entries kill via dead_at.
create table if not exists public.verification_codes (
  id          uuid primary key default gen_random_uuid(),
  purpose     text not null check (purpose in ('verify','reset')),
  email       text not null,
  account_id  uuid references public.users(id),
  code_hash   text not null,
  wrong_count integer not null default 0,
  consumed_at timestamptz,
  dead_at     timestamptz,
  voided_at   timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists codes_lookup_idx
  on public.verification_codes (purpose, email, created_at desc);

-- Session passes; rows survive restarts, logout revokes one row only.
create table if not exists public.sessions (
  id         uuid primary key,
  account_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists sessions_account_idx on public.sessions (account_id);
