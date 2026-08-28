-- 0001 — Translation catalog (specs/language-compatibility/spec.md FR-10..FR-13)
-- One row per (key, locale). All eight locales always have a row: value IS NULL
-- with status 'missing' marks untranslated keys so coverage is countable.
-- Writes happen only via the service role (scripts/sync-translations.mts) or
-- founder SQL; anon reads are public marketing copy.

create table if not exists public.translations (
  key        text        not null,
  locale     text        not null,
  value      text,
  status     text        not null default 'translated',
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);

alter table public.translations
  add constraint translations_locale_check
    check (locale in ('en', 'ur', 'pa', 'ps', 'sd', 'skr', 'bal', 'hno')),
  add constraint translations_status_check
    check (status in ('translated', 'missing')),
  add constraint translations_value_status_check
    check ((status = 'translated' and value is not null and length(btrim(value)) > 0)
        or (status = 'missing' and value is null));

alter table public.translations enable row level security;

create policy "translations are publicly readable"
  on public.translations
  for select
  using (true);
