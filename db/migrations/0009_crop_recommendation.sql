-- 0009_crop_recommendation.sql
-- Crop Recommendation Engine — enums, reference tables, seed data, transactional tables.
-- Idempotent: CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING on seeds.

begin;

-- ───────────────────────────── Enums ─────────────────────────────
do $$ begin
  create type season_enum as enum ('summer','winter','autumn','spring','rainy','windy');
exception when duplicate_object then null; end $$;

do $$ begin
  create type soil_type_enum as enum (
    'sandy','sandy_loam','loamy','clay_loam','clay','silty','saline','rocky','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type budget_bracket_enum as enum ('low','medium','high','very_high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type irrigation_type_enum as enum ('rainfed','canal','tubewell','mixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crop_category_enum as enum ('staple','cash','pulse','vegetable');
exception when duplicate_object then null; end $$;

-- ─────────────────────────── Reference tables ───────────────────────────
create table if not exists crops (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_key text not null,
  category crop_category_enum not null,
  typical_yield_per_acre_kg numeric(8,2) not null check (typical_yield_per_acre_kg > 0),
  growing_duration_days integer not null check (growing_duration_days > 0),
  season_windows season_enum[] not null,
  water_requirement_level text not null default 'medium' check (water_requirement_level in ('low','medium','high')),
  labour_cost_level text not null default 'medium' check (labour_cost_level in ('low','medium','high')),
  capital_requirement_per_acre_pkr integer not null check (capital_requirement_per_acre_pkr > 0),
  market_risk_baseline text not null default 'medium' check (market_risk_baseline in ('low','medium','high')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists crops_name_en_key on crops (name_en);
create index if not exists crops_category_idx on crops (category);
create index if not exists crops_season_windows_gin on crops using gin (season_windows);

create table if not exists crop_soil_compatibility (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references crops(id) on delete cascade,
  soil_type soil_type_enum not null,
  suitability_score numeric(3,2) not null check (suitability_score >= 0 and suitability_score <= 1),
  ph_min numeric(3,1) check (ph_min >= 0 and ph_min <= 14),
  ph_max numeric(3,1) check (ph_max >= 0 and ph_max <= 14 and (ph_max >= ph_min or ph_max is null)),
  notes text
);
create unique index if not exists crop_soil_crop_soil_key on crop_soil_compatibility (crop_id, soil_type);
create index if not exists crop_soil_crop_idx on crop_soil_compatibility (crop_id);

create table if not exists crop_rotation_rules (
  id uuid primary key default gen_random_uuid(),
  previous_crop_id uuid not null references crops(id) on delete cascade,
  next_crop_id uuid not null references crops(id) on delete cascade,
  benefit text not null,
  reason_key text not null,
  suitability_score numeric(3,2) not null check (suitability_score >= 0 and suitability_score <= 1)
);
create unique index if not exists crop_rotation_prev_next_key on crop_rotation_rules (previous_crop_id, next_crop_id);
create index if not exists crop_rotation_prev_idx on crop_rotation_rules (previous_crop_id);

create table if not exists soil_profiles (
  id uuid primary key default gen_random_uuid(),
  district text not null,
  province text not null,
  dominant_soil_type soil_type_enum not null,
  secondary_soil_type soil_type_enum,
  ph_typical numeric(3,1),
  organic_matter_band text check (organic_matter_band in ('low','medium','high')),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists soil_profiles_district_province_key on soil_profiles (district, province);
create index if not exists soil_profiles_province_idx on soil_profiles (province);

create table if not exists crop_price_trends (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references crops(id) on delete cascade,
  observed_at date not null,
  price_per_maan_pkr numeric(10,2) not null,
  trend text not null default 'stable' check (trend in ('up','stable','down')),
  volatility numeric(4,3) not null default 0.100 check (volatility >= 0 and volatility <= 1)
);
create index if not exists crop_price_trends_crop_date_idx on crop_price_trends (crop_id, observed_at desc);

-- ──────────────────────── Transactional tables ────────────────────────
create table if not exists crop_recommendation_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references users(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  target_season season_enum not null,
  target_year integer not null,
  soil_type soil_type_enum not null,
  soil_is_regional_default boolean not null default false,
  irrigation_type irrigation_type_enum not null,
  budget_bracket budget_bracket_enum not null,
  weather_confidence text not null default 'full' check (weather_confidence in ('full','degraded','missing')),
  market_confidence text not null default 'full' check (market_confidence in ('full','degraded','missing')),
  soil_confidence text not null default 'full' check (soil_confidence in ('full','degraded','missing')),
  inputs_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create unique index if not exists crop_rec_requests_farm_season_year_key
  on crop_recommendation_requests (farm_id, target_season, target_year);
create index if not exists crop_rec_requests_account_idx
  on crop_recommendation_requests (account_id, created_at desc);
create index if not exists crop_rec_requests_farm_idx on crop_recommendation_requests (farm_id);

create table if not exists crop_recommendations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references crop_recommendation_requests(id) on delete cascade,
  rank integer not null check (rank in (1,2,3)),
  crop_id uuid not null references crops(id),
  expected_revenue_per_acre_pkr numeric(12,2) not null check (expected_revenue_per_acre_pkr >= 0),
  revenue_confidence text not null default 'medium'
    check (revenue_confidence in ('high','medium','low','unreliable')),
  reason_key text not null,
  risk_factors text[] not null default '{}',
  water_requirement_level text not null,
  suitability_score numeric(4,3) not null check (suitability_score >= 0 and suitability_score <= 1),
  weather_fit_score numeric(4,3) not null check (weather_fit_score >= 0 and weather_fit_score <= 1),
  profitability_score numeric(4,3) not null check (profitability_score >= 0 and profitability_score <= 1),
  risk_score numeric(4,3) not null check (risk_score >= 0 and risk_score <= 1),
  sustainability_score numeric(4,3) not null check (sustainability_score >= 0 and sustainability_score <= 1),
  final_score numeric(4,3) not null check (final_score >= 0 and final_score <= 1),
  data_sources_used text[] not null default '{}',
  data_fresheness_seconds integer not null,
  created_at timestamptz not null default now()
);
create unique index if not exists crop_recs_request_rank_key on crop_recommendations (request_id, rank);
create index if not exists crop_recs_request_idx on crop_recommendations (request_id);
create index if not exists crop_recs_crop_idx on crop_recommendations (crop_id);

create table if not exists farm_plan_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references users(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  recommendation_id uuid not null references crop_recommendations(id) on delete cascade,
  target_season season_enum not null,
  target_year integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists farm_plan_farm_season_year_key
  on farm_plan_entries (farm_id, target_season, target_year);
create index if not exists farm_plan_account_idx
  on farm_plan_entries (account_id, target_year desc, target_season);

create table if not exists crop_rotation_suggestions (
  id uuid primary key default gen_random_uuid(),
  farm_plan_entry_id uuid not null references farm_plan_entries(id) on delete cascade,
  sequence_position integer not null check (sequence_position in (1,2,3)),
  target_season season_enum not null,
  target_year integer not null,
  crop_id uuid not null references crops(id),
  reason_key text not null,
  is_generic boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists rotation_suggestions_entry_seq_key
  on crop_rotation_suggestions (farm_plan_entry_id, sequence_position);
create index if not exists rotation_suggestions_entry_idx on crop_rotation_suggestions (farm_plan_entry_id);

-- ───────────────────────────── Seed: crops ─────────────────────────────
-- capital_requirement_per_acre_pkr chosen against budget brackets:
--   low <= 25000 · medium 25000-60000 · high 60000-120000 · very_high > 120000
insert into crops (name_en, name_key, category, typical_yield_per_acre_kg, growing_duration_days,
                  season_windows, water_requirement_level, labour_cost_level,
                  capital_requirement_per_acre_pkr, market_risk_baseline, notes)
values
  ('Wheat',      'app.crops.catalogue.wheat',      'staple',   800,  120, array['winter'],                                  'medium', 'medium', 18000, 'low',    'Rabi staple across Punjab and Sindh.'),
  ('Rice',       'app.crops.catalogue.rice',       'staple',   1200, 150, array['rainy','summer'],                          'high',   'high',   75000, 'medium', 'Kharif staple; water-intensive.'),
  ('Maize',      'app.crops.catalogue.maize',      'staple',   1600, 110, array['summer','spring'],                         'medium', 'medium', 22000, 'low',    'Spring/summer cereal.'),
  ('Sugarcane',  'app.crops.catalogue.sugarcane',  'staple',   35000, 330, array['spring','summer'],                         'high',   'high',   130000,'medium', 'Long-duration cash crop.'),
  ('Cotton',     'app.crops.catalogue.cotton',     'cash',     600,  160, array['summer','rainy'],                          'medium', 'high',   55000, 'high',   'Major kharif cash crop.'),
  ('Chickpea',   'app.crops.catalogue.chickpea',   'pulse',    350,  130, array['winter'],                                  'low',    'low',    15000, 'low',    'Rabbi pulse; fixes nitrogen.'),
  ('Mustard',    'app.crops.catalogue.mustard',    'cash',     400,  125, array['winter'],                                  'low',    'low',    16000, 'low',    'Oilseed; low water need.'),
  ('Mung Bean',  'app.crops.catalogue.mung_bean',  'pulse',    300,  75,  array['summer','rainy'],                          'low',    'low',    14000, 'low',    'Short-duration pulse; nitrogen-fixing.'),
  ('Soybean',    'app.crops.catalogue.soybean',    'pulse',    450,  110, array['summer','rainy'],                          'medium', 'medium', 20000, 'medium', 'Pulse with good market demand.'),
  ('Potato',     'app.crops.catalogue.potato',     'vegetable', 9000, 90,  array['winter','autumn'],                        'medium', 'high',   70000, 'medium', 'Vegetable; high value per acre.'),
  ('Onion',      'app.crops.catalogue.onion',      'vegetable', 6000, 100, array['autumn','winter'],                        'medium', 'high',   45000, 'high',   'Vegetable; price volatile.'),
  ('Tomato',     'app.crops.catalogue.tomato',     'vegetable', 9000, 110, array['winter','spring','autumn'],              'high',   'high',   65000, 'high',   'Vegetable; high value, pest pressure.')
on conflict (name_en) do nothing;

-- ──────────────────── Seed: crop × soil compatibility ────────────────────
-- suitability_score 0.00-1.00 per (crop, soil_type)
insert into crop_soil_compatibility (crop_id, soil_type, suitability_score, ph_min, ph_max, notes)
select c.id, s.soil, sc.score, sc.ph_min, sc.ph_max, sc.note
from crops c
cross join (values
  ('loamy',1.00,6.0,7.5),('sandy_loam',0.90,6.0,7.5),('clay_loam',0.85,6.0,7.8),
  ('silty',0.80,6.2,7.6),('sandy',0.65,6.0,7.5),('clay',0.70,6.0,8.0),
  ('saline',0.45,7.0,8.5),('rocky',0.35,6.0,7.5),('other',0.70,6.0,7.5)
) as s(soil, score, ph_min, ph_max)
cross join lateral (
  select
    case
      when c.name_en in ('Rice','Sugarcane') then
        case s.soil when 'clay' then 0.95 when 'clay_loam' then 0.90 when 'loamy' then 0.80
                     when 'silty' then 0.75 when 'sandy_loam' then 0.70 when 'sandy' then 0.40
                     when 'saline' then 0.30 when 'rocky' then 0.20 when 'other' then 0.70 end
      when c.category = 'pulse' then
        case s.soil when 'sandy_loam' then 0.95 when 'loamy' then 0.90 when 'sandy' then 0.85
                     when 'clay_loam' then 0.80 when 'silty' then 0.78 when 'clay' then 0.70
                     when 'saline' then 0.50 when 'rocky' then 0.40 when 'other' then 0.80 end
      when c.category = 'vegetable' then
        case s.soil when 'loamy' then 0.95 when 'sandy_loam' then 0.90 when 'silty' then 0.88
                     when 'clay_loam' then 0.82 when 'sandy' then 0.60 when 'clay' then 0.65
                     when 'saline' then 0.40 when 'rocky' then 0.25 when 'other' then 0.75 end
      else -- cereals / cash (wheat, maize, cotton, mustard)
        case s.soil when 'loamy' then 1.00 when 'sandy_loam' then 0.92 when 'clay_loam' then 0.85
                     when 'silty' then 0.82 when 'clay' then 0.72 when 'sandy' then 0.68
                     when 'saline' then 0.45 when 'rocky' then 0.35 when 'other' then 0.72 end
    end as score,
    case
      when c.name_en in ('Rice','Sugarcane') then 'Prefers heavy, water-retentive soils.'
      when c.category = 'pulse' then 'Thrives on well-drained light soils; fixes nitrogen.'
      when c.category = 'vegetable' then 'Needs fertile, well-drained loamy soils.'
      else 'Adapted to fertile loamy and clay-loam plains.'
    end as note
) as sc
where not exists (
  select 1 from crop_soil_compatibility x where x.crop_id = c.id and x.soil_type = s.soil::soil_type_enum
)
on conflict (crop_id, soil_type) do nothing;

-- ──────────────────── Seed: crop rotation rules ────────────────────
-- reason_key values map to app.crops.rotation.* translation keys.
insert into crop_rotation_rules (previous_crop_id, next_crop_id, benefit, reason_key, suitability_score)
select p.id, n.id, r.benefit, r.reason_key, r.score
from (values
  ('Wheat','Mung Bean',  'Nitrogen fixation after cereal',     'app.crops.rotation.wheat_then_mung',   0.92),
  ('Wheat','Chickpea',  'Legume builds soil after wheat',      'app.crops.rotation.wheat_then_chickpea',0.88),
  ('Wheat','Cotton',    'Common Punjab follow-on',              'app.crops.rotation.wheat_then_cotton',  0.70),
  ('Cotton','Wheat',    'Cereal restores after cotton',        'app.crops.rotation.cotton_then_wheat',   0.85),
  ('Cotton','Maize',    'Maize follows cotton on good land',   'app.crops.rotation.cotton_then_maize',   0.72),
  ('Rice','Wheat',      'Classic kharif→rabi sequence',        'app.crops.rotation.rice_then_wheat',     0.90),
  ('Rice','Maize',      'Maize after paddy on residual moisture','app.crops.rotation.rice_then_maize',    0.78),
  ('Maize','Potato',    'Potato after maize on loam',           'app.crops.rotation.maize_then_potato',   0.80),
  ('Maize','Wheat',     'Wheat after maize',                    'app.crops.rotation.maize_then_wheat',    0.82),
  ('Potato','Maize',    'Maize follows potato',                'app.crops.rotation.potato_then_maize',   0.76),
  ('Sugarcane','Maize', 'Maize after ratoon cane',             'app.crops.rotation.sugarcane_then_maize',0.74),
  ('Mung Bean','Wheat', 'Cereal after pulse',                  'app.crops.rotation.mung_then_wheat',     0.86),
  ('Chickpea','Cotton', 'Cotton after legume',                  'app.crops.rotation.chickpea_then_cotton',0.80),
  ('Mustard','Cotton',  'Cotton after oilseed',                'app.crops.rotation.mustard_then_cotton', 0.70),
  ('Soybean','Wheat',   'Wheat after soybean',                 'app.crops.rotation.soybean_then_wheat',  0.84),
  ('Onion','Maize',     'Maize after onion on fertile bed',    'app.crops.rotation.onion_then_maize',    0.75),
  ('Tomato','Wheat',    'Wheat after tomato',                  'app.crops.rotation.tomato_then_wheat',   0.73)
) as r(prev, next, benefit, reason_key, score)
join crops p on p.name_en = r.prev
join crops n on n.name_en = r.next
where not exists (
  select 1 from crop_rotation_rules x
  where x.previous_crop_id = p.id and x.next_crop_id = n.id
)
on conflict (previous_crop_id, next_crop_id) do nothing;

-- ──────────────────── Seed: soil profiles (15 districts) ────────────────────
insert into soil_profiles (district, province, dominant_soil_type, secondary_soil_type, ph_typical, organic_matter_band, notes)
values
  ('Multan',     'Punjab',     'loamy',     'clay_loam', 7.6, 'medium', 'Indus plains, productive.'),
  ('Faisalabad', 'Punjab',     'clay_loam', 'loamy',     7.8, 'medium', 'Canal-irrigated loams.'),
  ('Sahiwal',    'Punjab',     'loamy',     'sandy_loam',7.5, 'medium', 'Mixed loams.'),
  ('Bahawalpur', 'Punjab',     'sandy',     'sandy_loam',7.9, 'low',    'Desert margin sands.'),
  ('Lodhran',    'Punjab',     'sandy_loam','loamy',     7.7, 'low',    'Sandy loams.'),
  ('Rahim Yar Khan','Punjab',  'sandy',     'loamy',     8.0, 'low',    'Sandy, saline patches.'),
  ('Vehari',     'Punjab',     'clay_loam', 'loamy',     7.8, 'medium', 'Cotton belt clays.'),
  ('Lahore',     'Punjab',     'loamy',     'silty',     7.5, 'medium', 'Urban-peri loams.'),
  ('Sargodha',   'Punjab',     'loamy',     'silty',     7.6, 'medium', 'Citrus belt loams.'),
  ('Dera Ghazi Khan','Punjab', 'sandy',     'rocky',     8.0, 'low',    'Western arid sands.'),
  ('Hyderabad',  'Sindh',      'clay',      'clay_loam', 7.9, 'medium', 'Sindh clays.'),
  ('Sukkur',     'Sindh',      'clay',      'saline',    8.1, 'low',    'Saline clays.'),
  ('Larkana',    'Sindh',      'clay',      'loamy',     7.9, 'medium', 'Rice belt clays.'),
  ('Peshawar',   'Khyber Pakhtunkhwa', 'loamy', 'silty',  7.3, 'medium', 'Valley loams.'),
  ('Quetta',     'Balochistan', 'sandy_loam','rocky',    7.6, 'low',    'Arid loams, rocky.'),
  ('Nowshera',   'Khyber Pakhtunkhwa', 'loamy','silty',   7.4, 'medium', 'Valley alluvium.')
on conflict (district, province) do nothing;

-- ──────────────────── Seed: static price trends (demo fallback) ────────────────────
-- One representative recent observation per crop (maan ≈ 40 kg). Volatility 0.00-1.00.
insert into crop_price_trends (crop_id, observed_at, price_per_maan_pkr, trend, volatility)
select c.id, '2026-08-15'::date, p.price, p.trend, p.vol
from crops c
join (values
  ('Wheat',2500,'up',0.12),('Rice',3400,'stable',0.15),('Maize',2200,'up',0.18),
  ('Sugarcane',900,'stable',0.10),('Cotton',7200,'down',0.28),('Chickpea',6200,'stable',0.16),
  ('Mustard',4200,'up',0.14),('Mung Bean',4800,'stable',0.20),('Soybean',4000,'up',0.22),
  ('Potato',2600,'down',0.35),('Onion',5200,'down',0.45),('Tomato',3800,'down',0.40)
) as p(name, price, trend, vol) on p.name = c.name_en
where not exists (select 1 from crop_price_trends x where x.crop_id = c.id)
on conflict do nothing;

commit;
