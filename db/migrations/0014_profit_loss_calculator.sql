-- 0014 — Farm Profit/Loss Calculator schema (specs/profit-loss-calculator/spec.md)

create table if not exists public.seasons (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.users(id) on delete cascade,
  farm_id       uuid not null references public.farms(id) on delete cascade,
  crop_id       varchar(64) not null references public.crops(id),
  season        text not null check (season in ('Summer','Winter','Rainy','Dry')),
  year          text not null,
  start_date    date not null,
  acres         numeric(6,2) not null check (acres > 0),
  status        text not null default 'active' check (status in ('active','harvested','completed')),
  expected_yield numeric(10,2),
  expected_price numeric(10,2),
  actual_yield   numeric(10,2),
  actual_price   numeric(10,2),
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists seasons_account_idx on public.seasons (account_id, archived_at, created_at desc);
create index if not exists seasons_farm_idx on public.seasons (farm_id, season, year);

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  season_id     uuid not null references public.seasons(id) on delete cascade,
  account_id    uuid not null references public.users(id) on delete cascade,
  category      text not null check (category in ('seed','fertilizer','labor','irrigation','transport','other')),
  amount        numeric(10,2) not null check (amount > 0),
  date          date not null,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists expenses_season_idx on public.expenses (season_id, date desc, created_at desc);
create index if not exists expenses_account_idx on public.expenses (account_id);

create table if not exists public.projected_costs (
  id                uuid primary key default gen_random_uuid(),
  season_id         uuid not null references public.seasons(id) on delete cascade,
  category          text not null check (category in ('seed','fertilizer','labor','irrigation','transport')),
  per_acre_cost_pkr numeric(10,2) not null,
  total_projected_pkr numeric(10,2) not null,
  created_at        timestamptz not null default now()
);
create index if not exists projected_costs_season_idx on public.projected_costs (season_id, category);
