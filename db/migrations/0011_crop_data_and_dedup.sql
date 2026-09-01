-- Fix crops with empty season_windows and zero capital cost
UPDATE crops SET season_windows = ARRAY['summer']::text[], capital_requirement_per_acre_pkr = 80000 WHERE id = 'mango';
UPDATE crops SET season_windows = ARRAY['summer','rainy']::text[], capital_requirement_per_acre_pkr = 75000 WHERE id IN ('rice-basmati','rice-irri');
UPDATE crops SET season_windows = ARRAY['winter']::text[], capital_requirement_per_acre_pkr = 15000 WHERE id = 'gram';

-- Prevent duplicate crop recommendations for the same farm/season/year
ALTER TABLE crop_recommendation_requests ADD CONSTRAINT unique_account_farm_season_year UNIQUE (account_id, farm_id, target_season, target_year);
