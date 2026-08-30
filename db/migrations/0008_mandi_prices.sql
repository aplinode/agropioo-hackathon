-- 0008 — Mandi Price Tracker & Predictor schema
-- Feature 002: current prices, history, predictions, alerts, preferences.

-- Crop catalog with 8-locale names.
create table if not exists public.crops (
  id          varchar(64) primary key,
  name_en     text not null,
  name_ur     text not null,
  name_pa     text not null,
  name_ps     text not null,
  name_sd     text not null,
  name_skr    text not null,
  name_bal    text not null,
  name_hno    text not null,
  category    varchar(32) not null,
  unit        varchar(16) default 'Maund' not null,
  icon_svg    text,
  created_at  timestamptz default now() not null
);

-- Market (mandi) master list across Pakistan.
create table if not exists public.mandis (
  id                    varchar(64) primary key,
  name_en               text not null,
  name_ur               text not null,
  district              varchar(64) not null,
  province              varchar(32) not null,
  bordering_districts   text[] not null default '{}',
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  is_hub                boolean default false not null,
  created_at            timestamptz default now() not null
);

-- Daily price entries per crop per market.
create table if not exists public.mandi_prices (
  id            bigserial primary key,
  mandi_id      varchar(64) not null references public.mandis(id),
  crop_id       varchar(64) not null references public.crops(id),
  date          date not null,
  modal_price   numeric(10,2) not null,
  min_price     numeric(10,2) not null,
  max_price     numeric(10,2) not null,
  unit          varchar(16) default 'Maund' not null,
  is_holiday    boolean default false not null,
  source        varchar(64) not null,
  created_at    timestamptz default now() not null,
  unique (mandi_id, crop_id, date)
);

create index if not exists idx_mandi_prices_mandi_crop_date
  on public.mandi_prices (mandi_id, crop_id, date desc);
create index if not exists idx_mandi_prices_crop_date
  on public.mandi_prices (crop_id, date desc);

-- Cached 14-day predictions + recommendation per crop per market.
create table if not exists public.price_predictions (
  id                    bigserial primary key,
  crop_id               varchar(64) not null references public.crops(id),
  mandi_id              varchar(64) not null references public.mandis(id),
  calculated_at         timestamptz not null,
  forecast_json         jsonb not null,
  recommendation        varchar(8) check (recommendation in ('SELL', 'HOLD')),
  recommendation_reason text not null,
  volatility_warning    boolean default false not null,
  model_confidence      numeric(4,3) not null,
  unique (crop_id, mandi_id, calculated_at)
);

create index if not exists idx_price_predictions_crop_mandi_calculated
  on public.price_predictions (crop_id, mandi_id, calculated_at desc);

-- Farmer target-price alerts.
create table if not exists public.price_alerts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id),
  crop_id             varchar(64) not null references public.crops(id),
  mandi_id            varchar(64) references public.mandis(id),
  target_price_pkr    numeric(10,2) not null,
  status              varchar(16) not null check (status in ('active', 'paused')),
  last_triggered_at   timestamptz,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create index if not exists idx_price_alerts_user_status
  on public.price_alerts (user_id, status);
create index if not exists idx_price_alerts_crop_status
  on public.price_alerts (crop_id, status);

-- In-app notification center (reused by price alerts and other features).
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.users(id),
  type        varchar(32) not null,
  title       text not null,
  body        text not null,
  link_url    text,
  pinned      boolean default false not null,
  read_at     timestamptz,
  created_at  timestamptz default now() not null
);

create index if not exists idx_notifications_account_pinned
  on public.notifications (account_id, pinned desc, created_at desc);

-- Favorite/tracked crops for dashboard widget.
create table if not exists public.user_crop_preferences (
  user_id         uuid not null references public.users(id),
  crop_id         varchar(64) not null references public.crops(id),
  display_order   int default 0 not null,
  primary key (user_id, crop_id)
);
