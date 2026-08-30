import { query } from "@/lib/db";
import type { CropSummary, RotationSuggestion, Season } from "./api-types";

/** Circular season order used to advance the rotation plan. */
const SEASON_ORDER: Season[] = [
  "winter",
  "spring",
  "summer",
  "rainy",
  "autumn",
  "windy",
];

function advanceSeason(season: Season, steps: number): { season: Season; years: number } {
  const idx = SEASON_ORDER.indexOf(season);
  const total = idx + steps;
  return {
    season: SEASON_ORDER[total % SEASON_ORDER.length],
    years: Math.floor(total / SEASON_ORDER.length),
  };
}

type RotationRuleRow = {
  next_crop_id: string;
  benefit: string;
  reason_key: string;
  suitability_score: number;
};

/**
 * Builds a 2–3 season rotation plan after a saved crop.
 * - With farm history (lastCropCategory provided): uses the rules that follow the
 *   saved crop; flags are not generic.
 * - Without history: same rules but flagged `isGeneric` (UI shows "generic advice").
 * - If no rotation rule exists at all, falls back to a single generic "keep crop"
 *   suggestion so the section is never empty.
 */
export async function buildRotation(
  savedCrop: CropSummary,
  targetSeason: Season,
  targetYear: number,
  hasHistory: boolean,
  allCrops: CropSummary[],
): Promise<RotationSuggestion[]> {
  const rules = await query<RotationRuleRow>(
    `SELECT next_crop_id, benefit, reason_key, suitability_score
     FROM crop_rotation_rules
     WHERE previous_crop_id = $1
     ORDER BY suitability_score DESC
     LIMIT 3`,
    [savedCrop.id],
  );

  const cropById = new Map(allCrops.map((c) => [c.id, c]));
  const picks = (rules ?? []).slice(0, 3);

  const suggestions: RotationSuggestion[] = picks.map((rule, i) => {
    const next = cropById.get(rule.next_crop_id) ?? savedCrop;
    const adv = advanceSeason(targetSeason, i + 1);
    return {
      sequencePosition: i + 1,
      targetSeason: adv.season,
      targetYear: targetYear + adv.years,
      crop: next,
      reasonKey: rule.reason_key,
      isGeneric: !hasHistory,
    };
  });

  if (suggestions.length === 0) {
    // Generic fallback: repeat the saved crop with the generic advice key.
    const adv = advanceSeason(targetSeason, 1);
    suggestions.push({
      sequencePosition: 1,
      targetSeason: adv.season,
      targetYear: targetYear + adv.years,
      crop: savedCrop,
      reasonKey: "app.crops.rotation.generic",
      isGeneric: true,
    });
  }

  return suggestions;
}
