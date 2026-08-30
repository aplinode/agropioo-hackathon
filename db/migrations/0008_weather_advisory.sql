-- 0008 — Weather Advisory schema (specs/001-weather-advisory)
-- Extends farms with advisory inputs and adds weather_advisories + weather_alerts.

-- 1. Extend farms with weather-advisory inputs.
alter table public.farms
  add column if not exists primary_crop text,
  add column if not exists sowing_date date,
  add column if not exists soil_type text,
  add column if not exists irrigation_method text;

create index if not exists farms_primary_crop_idx on public.farms (primary_crop);

-- Backfill primary_crop from the first crop in the crops array for existing farms.
update public.farms
set primary_crop = crops->>0
where primary_crop is null and jsonb_array_length(crops) > 0;

-- 2. Weather Advisory: one personalized recommendation per farm per day.
create table if not exists public.weather_advisories (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms(id) on delete cascade,
  account_id       uuid not null references public.users(id) on delete cascade,
  advisory_date    date not null,
  forecast_snapshot jsonb not null default '{}'::jsonb,
  growth_stage     text,
  advice_key       text not null,
  advice_text      text not null,
  severity         text not null default 'info'
                     check (severity in ('info', 'warning', 'critical')),
  acknowledged     boolean not null default false,
  acted_upon       boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (farm_id, advisory_date)
);
create index if not exists weather_advisories_farm_date_idx
  on public.weather_advisories (farm_id, advisory_date desc);
create index if not exists weather_advisories_account_idx
  on public.weather_advisories (account_id, created_at desc);

-- 3. Weather Alert: time-sensitive notification triggered by forecast conditions.
create table if not exists public.weather_alerts (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id) on delete cascade,
  account_id        uuid not null references public.users(id) on delete cascade,
  alert_type        text not null
                      check (alert_type in ('heavy_rain', 'frost', 'extreme_heat', 'disease_risk')),
  condition_met     jsonb not null default '{}'::jsonb,
  recommendation    text not null,
  recommendation_key text not null,
  severity          text not null default 'warning'
                      check (severity in ('warning', 'critical')),
  sent_via          jsonb not null default '[]'::jsonb,
  sent_at           timestamptz,
  read_at           timestamptz,
  dismissed_at      timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists weather_alerts_farm_idx
  on public.weather_alerts (farm_id, created_at desc);
create index if not exists weather_alerts_account_unread_idx
  on public.weather_alerts (account_id, read_at) where read_at is null;
