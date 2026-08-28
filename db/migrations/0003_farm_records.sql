-- 0003 — Farm Records schema (specs/farm-records/spec.md)

create table if not exists public.farms (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.users(id) on delete cascade,
  name          text not null,
  location      text not null,
  district      text not null,
  lat           numeric(9,6) not null,
  lng           numeric(9,6) not null,
  crops         jsonb not null default '[]'::jsonb,
  acres         numeric(6,2) not null check (acres > 0),
  growth_stages jsonb not null default '{}'::jsonb,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists farms_account_idx on public.farms (account_id, archived_at, created_at desc);

create table if not exists public.records (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms(id) on delete cascade,
  account_id    uuid not null references public.users(id) on delete cascade,
  type          text not null check (type in ('sowing','planting','irrigation','fertilizer','pesticide','disease','harvest')),
  season        text not null check (season in ('Summer','Winter','Rainy','Dry')),
  year          text not null,
  event_date    date not null,
  title         text,
  note          text,
  weather       jsonb not null default '{}'::jsonb,
  yield_qty     numeric(10,2),
  labor_cost    numeric(10,2),
  transport_cost numeric(10,2),
  created_at    timestamptz not null default now()
);
create index if not exists records_farm_idx on public.records (farm_id, event_date desc, created_at desc);
create index if not exists records_account_idx on public.records (account_id);
