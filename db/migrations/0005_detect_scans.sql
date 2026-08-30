-- 0005 — AI Crop Disease Detection scans (specs/ai-crop-disease-detection/spec.md, plan.md)

create table if not exists public.detect_scans (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.users(id) on delete cascade,
  farm_id       uuid references public.farms(id) on delete set null,
  image_url     text not null,
  disease_name  text not null,
  confidence    numeric(5,2) not null,
  severity      text not null check (severity in ('watch','treat_now','clear')),
  crop          text not null,
  causes        text not null,
  treatment_steps jsonb not null default '[]'::jsonb,
  rescan_timing  text not null,
  caution       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists detect_scans_account_idx
  on public.detect_scans (account_id, created_at desc);
