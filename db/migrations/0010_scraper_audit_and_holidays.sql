-- 0010 — Mandi Price Tracker scraper audit + mandi holidays
-- Feature 002 (002-scraper): adds `source_code` to mandi_prices, drops
-- the legacy two-value `source` CHECK, introduces `scraper_runs` for
-- per-request audit (7-day retention) and `mandi_holidays` so the drift
-- detector can distinguish a public holiday from a portal schema break.

-- 1. mandi_prices: replace the `('govt_api','admin_manual')` source CHECK
--    with a single-value `source` + the new `source_code` enum.
alter table public.mandi_prices
  drop constraint if exists mandi_prices_source_check;

alter table public.mandi_prices
  alter column source set default 'govt_api',
  alter column source set not null;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='mandi_prices' and column_name='source_code'
  ) then
    alter table public.mandi_prices
      add column source_code varchar(32) not null default 'seed_pk_initial'
      check (source_code in (
        'amis_pk', 'samis_pk', 'fmis_kp', 'bmis_balochistan', 'pbs_spi', 'seed_pk_initial'
      ));
  end if;
end$$;

create index if not exists idx_mandi_prices_source_code_date
  on public.mandi_prices (source_code, date desc);

-- 2. scraper_runs: per-request audit log; pruned by the nightly maintenance job
--    to a 7-day window.
create table if not exists public.scraper_runs (
  id              bigserial primary key,
  received_at     timestamptz default now() not null,
  source_code     varchar(32) not null
                  check (source_code in (
                    'amis_pk','samis_pk','fmis_kp','bmis_balochistan','pbs_spi'
                  )),
  status          varchar(32) not null
                  check (status in (
                    'ok','partial','drift_suspected','rate_limited','unauthorized','server_error'
                  )),
  rows_written    integer not null default 0,
  rows_rejected   integer not null default 0,
  caller_ip       inet,
  request_id      uuid not null default gen_random_uuid()
);

create index if not exists idx_scraper_runs_received_at_desc
  on public.scraper_runs (received_at desc);
create index if not exists idx_scraper_runs_source_received
  on public.scraper_runs (source_code, received_at desc);

-- 3. mandi_holidays: pre-flagged closures so the drift detector doesn't
--    false-positive on a 0-row day that is just a market holiday.
create table if not exists public.mandi_holidays (
  id            bigserial primary key,
  mandi_id      varchar(64) references public.mandis(id),
  province      varchar(32),
  date          date not null,
  label         text not null,
  source_code   varchar(32) not null
                check (source_code in (
                  'amis_pk','samis_pk','fmis_kp','bmis_balochistan','pbs_spi'
                )),
  -- Either a specific mandi or a province-wide flag; never both null.
  check ((mandi_id is not null) <> (province is not null))
);

create unique index if not exists uq_mandi_holidays_mandi_date
  on public.mandi_holidays (mandi_id, date)
  where mandi_id is not null;
create unique index if not exists uq_mandi_holidays_province_date
  on public.mandi_holidays (province, date)
  where province is not null;
create index if not exists idx_mandi_holidays_date
  on public.mandi_holidays (date);
