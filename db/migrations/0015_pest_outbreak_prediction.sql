-- 0015 — AI Pest Outbreak Prediction schema (specs/pest-outbreak-prediction/spec.md)

create table if not exists public.pest_predictions (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms(id) on delete cascade,
  account_id        uuid not null references public.users(id) on delete cascade,
  prediction_date   date not null,
  risk_score        numeric(5,2) not null check (risk_score >= 0 and risk_score <= 100),
  predicted_pest    text,
  confidence        numeric(5,2) check (confidence >= 0 and confidence <= 100),
  model_version     text not null default 'v1',
  weather_snapshot  jsonb,
  farm_snapshot     jsonb,
  province          text,
  district          text,
  status            text not null default 'active' check (status in ('active','monitoring','archived')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint pest_predictions_farm_date_unique unique (farm_id, prediction_date)
);
create index if not exists pest_predictions_account_date_idx
  on public.pest_predictions (account_id, prediction_date desc);
create index if not exists pest_predictions_farm_date_idx
  on public.pest_predictions (farm_id, prediction_date desc);

create table if not exists public.pest_alerts (
  id                        uuid primary key default gen_random_uuid(),
  farm_id                   uuid not null references public.farms(id) on delete cascade,
  account_id                uuid not null references public.users(id) on delete cascade,
  pest_type                 text not null,
  risk_score                numeric(5,2) not null check (risk_score >= 0 and risk_score <= 100),
  severity                  text not null check (severity in ('warning','critical')),
  recommendation_text       text not null,
  recommendation_key        text,
  recommendation_translation_key text,
  sent_via                  jsonb not null default '[]'::jsonb,
  sent_at                   timestamptz,
  read_at                   timestamptz,
  dismissed_at              timestamptz,
  escalation_of_id          uuid references public.pest_alerts(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index if not exists pest_alerts_farm_created_idx
  on public.pest_alerts (farm_id, created_at desc);
create index if not exists pest_alerts_account_unread_idx
  on public.pest_alerts (account_id, created_at desc) where read_at is null;

create table if not exists public.pest_incidence_records (
  id              uuid primary key default gen_random_uuid(),
  province        text not null,
  district        text not null,
  crop            text not null,
  pest_type       text not null,
  reported_count  integer,
  source_url      text,
  data_date       date not null,
  raw_payload     jsonb,
  fetched_at      timestamptz not null default now(),
  data_may_be_outdated boolean not null default false
);
create index if not exists pest_incidence_province_district_crop_date_idx
  on public.pest_incidence_records (province, district, crop, data_date);

create table if not exists public.pest_treatments (
  id                uuid primary key default gen_random_uuid(),
  pest_type         text not null,
  treatment_name    text not null,
  type              text not null check (type in ('chemical','organic')),
  base_cost_pkr     numeric(10,2) not null,
  unit              text not null,
  description_key   text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.pest_price_snapshots (
  id            uuid primary key default gen_random_uuid(),
  treatment_id  uuid not null references public.pest_treatments(id) on delete cascade,
  price_pkr     numeric(10,2) not null,
  source        text not null,
  fetched_at    timestamptz not null default now()
);
create index if not exists pest_price_snapshots_treatment_idx
  on public.pest_price_snapshots (treatment_id, fetched_at desc);
